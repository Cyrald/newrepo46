import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';

const prefetchedRoutes = new Set<string>();

const safeRequestIdleCallback = (
  callback: () => void,
  options?: { timeout?: number }
) => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
};

const routeComponentMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/home-page'),
  '/catalog': () => import('@/pages/catalog-page'),
  '/products': () => import('@/pages/product-detail-page'),
  '/cart': () => import('@/pages/cart-page'),
  '/wishlist': () => import('@/pages/wishlist-page'),
  '/profile': () => import('@/pages/profile-page'),
  '/checkout': () => import('@/pages/checkout-page'),
  '/login': () => import('@/pages/login-page'),
  '/register': () => import('@/pages/register-page'),
  '/verify-email': () => import('@/pages/verify-email-page'),
  '/privacy-policy': () => import('@/pages/privacy-policy-page'),
  '/admin': () => import('@/pages/admin/dashboard-page'),
  '/admin/users': () => import('@/pages/admin/users-page'),
  '/admin/products': () => import('@/pages/admin/products-page'),
  '/admin/categories': () => import('@/pages/admin/categories-page'),
  '/admin/promocodes': () => import('@/pages/admin/promocodes-page'),
  '/admin/orders': () => import('@/pages/admin/orders-page'),
  '/admin/support': () => import('@/pages/admin/support-chat-page'),
};

function prefetchRoute(route: string): void {
  if (prefetchedRoutes.has(route)) {
    return;
  }

  const loader = routeComponentMap[route];
  if (!loader) {
    console.warn(`No loader found for route: ${route}`);
    return;
  }

  loader()
    .then(() => {
      prefetchedRoutes.add(route);
      console.log(`✅ Prefetched: ${route}`);
    })
    .catch((error) => {
      console.error(`❌ Failed to prefetch ${route}:`, error);
    });
}

// Helper function to get accessible routes based on auth status and roles
function getAccessibleRoutes(isAuthenticated: boolean, hasStaffRole: boolean): string[] {
  const publicRoutes = ['/login', '/register', '/privacy-policy'];
  const authenticatedRoutes = ['/catalog', '/cart', '/wishlist', '/products', '/profile', '/checkout'];
  const adminRoutes = ['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/admin/promocodes', '/admin/users', '/admin/support'];
  
  if (!isAuthenticated) {
    return [...publicRoutes, '/catalog', '/products'];
  }
  
  if (hasStaffRole) {
    return [...authenticatedRoutes, ...adminRoutes, '/privacy-policy'];
  }
  
  return [...authenticatedRoutes, '/privacy-policy'];
}

export function usePrefetchRoutes() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authInitialized = useAuthStore((state) => state.authInitialized);
  const user = useAuthStore((state) => state.user);
  const previousAuthState = useRef<boolean | null>(null);
  const [location] = useLocation();
  const prefetchStarted = useRef(false);

  useEffect(() => {
    if (!authInitialized || prefetchStarted.current) {
      return;
    }

    const hasStaffRole = user?.roles?.some(role => 
      ['admin', 'marketer', 'consultant'].includes(role)
    ) ?? false;
    
    // Get all accessible routes based on auth status
    const accessibleRoutes = getAccessibleRoutes(isAuthenticated, hasStaffRole);
    
    // Filter out already prefetched routes
    const routesToPrefetch = accessibleRoutes.filter(route => !prefetchedRoutes.has(route));
    
    if (routesToPrefetch.length === 0) {
      return;
    }

    // AGGRESSIVE PREFETCHING: Load everything in parallel immediately
    console.log(`🚀 Starting aggressive prefetch of ${routesToPrefetch.length} routes...`);
    prefetchStarted.current = true;
    
    // Use queueMicrotask to avoid blocking render
    queueMicrotask(() => {
      const loaders = routesToPrefetch.map(route => {
        const loader = routeComponentMap[route];
        if (!loader) return Promise.resolve();
        
        return loader()
          .then(() => {
            prefetchedRoutes.add(route);
            console.log(`✅ Prefetched: ${route}`);
          })
          .catch((error) => {
            console.error(`❌ Failed to prefetch ${route}:`, error);
          });
      });
      
      // Load all routes in parallel
      Promise.allSettled(loaders).then(() => {
        console.log(`🎉 Aggressive prefetch complete! Loaded ${routesToPrefetch.length} routes.`);
      });
    });

    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, authInitialized, user, location]);
}

export function usePrefetchFromReturnUrl() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');

    if (returnUrl) {
      console.log(`🎯 Detected returnUrl: ${returnUrl}, prefetching immediately...`);
      
      const normalizedUrl = returnUrl.split('?')[0].split('#')[0];
      
      if (normalizedUrl.startsWith('/cart')) {
        prefetchRoute('/cart');
      } else if (normalizedUrl.startsWith('/wishlist')) {
        prefetchRoute('/wishlist');
      } else if (normalizedUrl.startsWith('/profile')) {
        prefetchRoute('/profile');
      } else if (normalizedUrl.startsWith('/checkout')) {
        prefetchRoute('/checkout');
      } else if (normalizedUrl.startsWith('/admin')) {
        const segments = normalizedUrl.split('/');
        if (segments.length === 2) {
          prefetchRoute('/admin');
        } else if (segments.length === 3) {
          prefetchRoute(`/admin/${segments[2]}`);
        }
      }
    }
  }, []);
}
