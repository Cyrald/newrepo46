import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { authenticateToken, requireRole } from "../auth";
import { sql, count, sum, eq } from "drizzle-orm";
import { users, products, orders, userRoles } from "@shared/schema";

const router = Router();

router.get("/stats", authenticateToken, requireRole("admin"), async (req, res) => {
  const [
    totalUsersResult,
    totalProductsResult,
    totalOrdersResult,
    totalRevenueResult,
    pendingOrdersResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(products).where(eq(products.isArchived, false)),
    db.select({ count: count() }).from(orders),
    db.select({ 
      total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)` 
    }).from(orders).where(eq(orders.paymentStatus, 'paid')),
    db.select({ count: count() }).from(orders).where(eq(orders.status, 'pending')),
  ]);

  const totalUsers = totalUsersResult[0]?.count || 0;
  const totalProducts = totalProductsResult[0]?.count || 0;
  const totalOrders = totalOrdersResult[0]?.count || 0;
  const totalRevenue = totalRevenueResult[0]?.total || '0';
  const pendingOrders = pendingOrdersResult[0]?.count || 0;

  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: parseFloat(totalRevenue),
    pendingOrders,
  });
});

router.get("/users", authenticateToken, requireRole("admin"), async (req, res) => {
  const users = await storage.getUsers();
  
  const allRoles = await db.select().from(userRoles);
  const rolesMap = new Map<string, string[]>();
  
  for (const roleRecord of allRoles) {
    if (!rolesMap.has(roleRecord.userId)) {
      rolesMap.set(roleRecord.userId, []);
    }
    rolesMap.get(roleRecord.userId)!.push(roleRecord.role);
  }

  const usersWithRoles = users.map((user: any) => ({
    ...user,
    roles: rolesMap.get(user.id) || [],
  }));

  res.json(usersWithRoles);
});

export default router;
