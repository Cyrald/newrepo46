import { Link } from "wouter"
import { ShoppingCart, Heart, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Product } from "@shared/schema"

interface ProductCardProps {
  product: Product & { images?: { url: string }[] }
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
  isInWishlist?: boolean
}

export function ProductCard({ product, onAddToCart, onToggleWishlist, isInWishlist = false }: ProductCardProps) {
  const hasDiscount = parseFloat(product.discountPercentage) > 0
  const discountedPrice = hasDiscount
    ? parseFloat(product.price) * (1 - parseFloat(product.discountPercentage) / 100)
    : parseFloat(product.price)
  
  const firstImage = product.images?.[0]?.url

  return (
    <Card className="group relative overflow-hidden transition-all duration-200">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {firstImage ? (
            <img
              src={firstImage}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Eye className="h-8 w-8" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-0.5">
            {product.isNew && (
              <Badge variant="default" className="text-xs px-1.5 py-0" data-testid={`badge-new-${product.id}`}>
                Новый
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0" data-testid={`badge-discount-${product.id}`}>
                -{product.discountPercentage}%
              </Badge>
            )}
          </div>

          {/* Quick actions on hover */}
          <div className="absolute right-1.5 top-1.5 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onToggleWishlist && (
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  onToggleWishlist(product.id)
                }}
                data-testid={`button-wishlist-${product.id}`}
                className="h-7 w-7"
              >
                <Heart className={`h-3.5 w-3.5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-2.5">
        <Link href={`/products/${product.id}`}>
          <h3 className="mb-0.5 line-clamp-2 text-sm font-semibold" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        
        {product.weight && (
          <p className="mb-1 text-xs text-muted-foreground" data-testid={`text-weight-${product.id}`}>
            {product.weight} г
          </p>
        )}
        {product.volume && (
          <p className="mb-1 text-xs text-muted-foreground" data-testid={`text-volume-${product.id}`}>
            {product.volume} мл
          </p>
        )}

        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-base font-bold text-foreground" data-testid={`text-price-${product.id}`}>
            {discountedPrice.toFixed(0)} ₽
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through" data-testid={`text-old-price-${product.id}`}>
              {parseFloat(product.price).toFixed(0)} ₽
            </span>
          )}
        </div>

        {product.stockQuantity > 0 ? (
          <Button
            className="w-full h-8 text-xs"
            size="sm"
            onClick={() => onAddToCart?.(product.id)}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            В корзину
          </Button>
        ) : (
          <Button
            className="w-full h-8 text-xs"
            size="sm"
            variant="secondary"
            disabled
            data-testid={`button-out-of-stock-${product.id}`}
          >
            Нет в наличии
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
