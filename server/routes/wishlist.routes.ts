import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken } from "../auth";
import { addWishlistItemSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", authenticateToken, async (req, res) => {
  const wishlistItems = await storage.getWishlistItems(req.userId!);
  res.json(wishlistItems);
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = addWishlistItemSchema.parse(req.body);

    const wishlistItem = await storage.addWishlistItem({
      userId: req.userId!,
      productId: data.productId,
    });

    res.json(wishlistItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.delete("/:productId", authenticateToken, async (req, res) => {
  await storage.deleteWishlistItem(req.userId!, req.params.productId);
  res.json({ message: "Товар удалён из избранного" });
});

export default router;
