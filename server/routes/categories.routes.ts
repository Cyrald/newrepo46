import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken, requireRole } from "../auth";
import { createCategorySchema, updateCategorySchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", async (req, res) => {
  const categories = await storage.getCategories();
  res.json(categories);
});

router.get("/:id", async (req, res) => {
  const category = await storage.getCategory(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Категория не найдена" });
  }

  res.json(category);
});

router.post("/", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  try {
    const data = createCategorySchema.parse(req.body);
    
    const category = await storage.createCategory({
      name: data.name,
      slug: data.slug,
      description: data.description,
      sortOrder: data.sortOrder,
    });

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.put("/:id", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  try {
    const data = updateCategorySchema.parse(req.body);
    
    const category = await storage.updateCategory(req.params.id, {
      name: data.name,
      slug: data.slug,
      description: data.description,
      sortOrder: data.sortOrder,
    });

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.delete("/:id", authenticateToken, requireRole("admin", "marketer"), async (req, res) => {
  await storage.deleteCategory(req.params.id);
  res.json({ message: "Категория удалена" });
});

export default router;
