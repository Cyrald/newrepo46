import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { cartApi } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

export function useCart() {
  const setItems = useCartStore((state) => state.setItems);
  const clear = useCartStore((state) => state.clear);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      setItems(query.data);
    } else if (query.error || !isAuthenticated) {
      clear();
    }
  }, [query.data, query.error, isAuthenticated, setItems, clear]);

  return query;
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const setItems = useCartStore((state) => state.setItems);

  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      cartApi.add(data),
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(["cart"]);

      // Optimistically update to the new value
      const updatedCart = queryClient.setQueryData(["cart"], (old: any) => {
        // If cart is empty, create new cart with first item
        if (!old || old.length === 0) {
          return [{ productId: newItem.productId, quantity: newItem.quantity }];
        }
        
        const existingItemIndex = old.findIndex(
          (item: any) => item.productId === newItem.productId
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const newCart = [...old];
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + newItem.quantity,
          };
          return newCart;
        } else {
          // Add new item
          return [...old, { productId: newItem.productId, quantity: newItem.quantity }];
        }
      });

      // Sync with cartStore for instant UI updates
      if (updatedCart && Array.isArray(updatedCart)) {
        setItems(updatedCart);
      }

      return { previousCart };
    },
    onError: (_err, _newItem, context) => {
      // Rollback to the previous value on error
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
        setItems(context.previousCart as any);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartApi.update(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => cartApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
