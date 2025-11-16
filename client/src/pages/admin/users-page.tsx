import { useState } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import { adminApi } from "@/lib/api"

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: adminApi.getUsers,
  })

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteUser = (userId: string) => {
    console.log("Delete user:", userId)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "marketer":
        return "default"
      case "consultant":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Админ",
      marketer: "Маркетолог",
      consultant: "Консультант",
      customer: "Клиент",
    }
    return labels[role] || role
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Загрузка пользователей...</div>
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
              Пользователи
            </h1>
            <p className="text-muted-foreground">
              Управление пользователями системы
            </p>
          </div>
          <Button data-testid="button-add-user">
            <Plus className="mr-2 h-4 w-4" />
            Добавить пользователя
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Все пользователи</CardTitle>
            <CardDescription>
              {users.length} пользователей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по email или имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery ? "Пользователи не найдены" : "Нет пользователей"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Роли</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                  {getRoleLabel(role)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">Клиент</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                            {user.isEmailVerified ? "Активен" : "Не подтвержден"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), "dd.MM.yyyy", { locale: ru })}
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
                                <Pencil className="mr-2 h-4 w-4" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteUser(user.id)}
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
