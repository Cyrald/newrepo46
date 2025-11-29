import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken, requireRole } from "../auth";
import { validatePromocode } from "../promocodes";
import { promocodeValidationLimiter } from "../middleware/rateLimiter";
import { validatePromocodeSchema, createPromocodeSchema, updatePromocodeSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  const promocodes = await storage.getPromocodes();
  res.json(promocodes);
});

router.post("/validate", authenticateToken, promocodeValidationLimiter, async (req, res) => {
  try {
    const data = validatePromocodeSchema.parse(req.body);
    const result = await validatePromocode(data.code, req.userId!, data.orderAmount);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.post("/", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  try {
    const data = createPromocodeSchema.parse(req.body);
    const promocode = await storage.createPromocode(data);
    res.json(promocode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.put("/:id", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  try {
    const data = updatePromocodeSchema.parse(req.body);
    const promocode = await storage.updatePromocode(req.params.id, data);
    res.json(promocode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.delete("/:id", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  await storage.deletePromocode(req.params.id);
  res.json({ message: "Промокод удалён" });
});

export default router;
