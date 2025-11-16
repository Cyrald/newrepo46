import { useState } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { productsApi } from "@/lib/api"

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: () => productsApi.getAll({ limit: 10000 }),
  })

  const products = data?.products || []

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteProduct = (productId: string) => {
    console.log("Delete product:", productId)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Загрузка товаров...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold" data-testid="text-page-title">
              Товары
            </h1>
            <p className="text-muted-foreground">
              Управление каталогом товаров
            </p>
          </div>
          <Button data-testid="button-add-product">
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Все товары</CardTitle>
            <CardDescription>
              {products.length} товаров в каталоге
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или артикулу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-products"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery ? "Товары не найдены" : "Нет товаров"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Наличие</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || "—"}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{parseFloat(product.price).toLocaleString()} ₽</TableCell>
                        <TableCell>
                          {product.stockQuantity > 0 ? (
                            <Badge variant="default">{product.stockQuantity} шт</Badge>
                          ) : (
                            <Badge variant="destructive">Нет</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.isPublished ? "default" : "secondary"}>
                            {product.isPublished ? "Опубликован" : "Черновик"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Просмотр
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
