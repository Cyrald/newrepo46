import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken } from "../auth";
import { addCartItemSchema, updateCartItemSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/", authenticateToken, async (req, res) => {
  const cartItems = await storage.getCartItems(req.userId!);
  res.json(cartItems);
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = addCartItemSchema.parse(req.body);

    const product = await storage.getProduct(data.productId);
    
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    const existingCartItem = await storage.getCartItem(req.userId!, data.productId);
    
    if (existingCartItem) {
      const currentQuantityInCart = existingCartItem.quantity;
      const totalQuantity = currentQuantityInCart + data.quantity;
      
      if (totalQuantity > product.stockQuantity) {
        return res.status(400).json({ 
          message: `Недостаточно товара на складе. Доступно: ${product.stockQuantity}, в корзине: ${currentQuantityInCart}` 
        });
      }
      
      const updatedCartItem = await storage.updateCartItem(req.userId!, data.productId, totalQuantity);
      return res.json(updatedCartItem);
    }

    if (data.quantity > product.stockQuantity) {
      return res.status(400).json({ 
        message: `Недостаточно товара на складе. Доступно: ${product.stockQuantity}` 
      });
    }

    const cartItem = await storage.addCartItem({
      userId: req.userId!,
      productId: data.productId,
      quantity: data.quantity,
    });

    res.json(cartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.put("/:productId", authenticateToken, async (req, res) => {
  try {
    const data = updateCartItemSchema.parse(req.body);

    const product = await storage.getProduct(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    if (data.quantity > product.stockQuantity) {
      return res.status(400).json({ 
        message: `Недостаточно товара на складе. Доступно: ${product.stockQuantity}` 
      });
    }

    const updatedCartItem = await storage.updateCartItem(req.userId!, req.params.productId, data.quantity);
    res.json(updatedCartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

router.delete("/:productId", authenticateToken, async (req, res) => {
  await storage.deleteCartItem(req.userId!, req.params.productId);
  res.json({ message: "Товар удалён из корзины" });
});

router.delete("/", authenticateToken, async (req, res) => {
  await storage.clearCart(req.userId!);
  res.json({ message: "Корзина очищена" });
});

export default router;
