import { useState } from "react"
import { Search, MoreHorizontal, Eye, Package } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ordersApi } from "@/lib/api"

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: ordersApi.getAll,
  })

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      case "pending":
        return "secondary"
      case "processing":
        return "default"
      case "shipped":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Ожидает",
      processing: "В обработке",
      shipped: "Отправлен",
      delivered: "Доставлен",
      cancelled: "Отменен",
    }
    return labels[status] || status
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Загрузка заказов...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-semibold" data-testid="text-page-title">
            Заказы
          </h1>
          <p className="text-muted-foreground">
            Управление заказами клиентов
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Все заказы</CardTitle>
            <CardDescription>
              {orders.length} заказов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по номеру заказа или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-orders"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="processing">В обработке</SelectItem>
                  <SelectItem value="shipped">Отправлен</SelectItem>
                  <SelectItem value="delivered">Доставлен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery || statusFilter !== "all" ? "Заказы не найдены" : "Нет заказов"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№ Заказа</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Оплата</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.user.firstName} {order.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          {parseFloat(order.totalAmount)} ₽
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.isPaid ? "default" : "secondary"}>
                            {order.isPaid ? "Оплачен" : "Не оплачен"}
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
                                Подробнее
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Обновить статус
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
