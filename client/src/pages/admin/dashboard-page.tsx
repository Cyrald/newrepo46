import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminStats"],
    queryFn: adminApi.getStats,
  })

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Загрузка статистики...</div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Ошибка загрузки статистики</div>
        </div>
      </AdminLayout>
    )
  }

  const stats = data
  const recentOrders = data.recentOrders

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-semibold" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Обзор ключевых показателей
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Выручка
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                {stats.totalRevenue.toLocaleString()} ₽
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stats.revenueChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{stats.revenueChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{stats.revenueChange}%</span>
                  </>
                )}
                <span>за месяц</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Заказы
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">
                {stats.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stats.ordersChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{stats.ordersChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{stats.ordersChange}%</span>
                  </>
                )}
                <span>за месяц</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Клиенты
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-customers">
                {stats.totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stats.customersChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{stats.customersChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{stats.customersChange}%</span>
                  </>
                )}
                <span>за месяц</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Товары
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-products">
                {stats.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stats.productsChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{stats.productsChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{stats.productsChange}%</span>
                  </>
                )}
                <span>за месяц</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Последние заказы</CardTitle>
            <CardDescription>
              {recentOrders.length} новых заказов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Нет новых заказов
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm", { locale: ru })}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{parseFloat(order.total).toLocaleString()} ₽</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
