import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Stores
  app.get("/api/stores", async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  // Deals
  app.get("/api/deals", async (req, res) => {
    try {
      const { categoryId, storeId, isHot, limit, search } = req.query;
      
      const options: any = {};
      if (categoryId) options.categoryId = String(categoryId);
      if (storeId) options.storeId = String(storeId);
      if (isHot !== undefined) options.isHot = isHot === 'true';
      if (limit) options.limit = parseInt(String(limit));
      if (search) options.search = String(search);

      const deals = await storage.getDeals(options);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deal = await storage.getDealById(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post("/api/deals/:id/use", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementDealUsage(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment deal usage" });
    }
  });

  // Coupons
  app.get("/api/coupons", async (req, res) => {
    try {
      const { storeId, isActive, limit } = req.query;
      
      const options: any = {};
      if (storeId) options.storeId = String(storeId);
      if (isActive !== undefined) options.isActive = isActive === 'true';
      if (limit) options.limit = parseInt(String(limit));

      const coupons = await storage.getCoupons(options);
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.get("/api/coupons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await storage.getCouponById(id);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupon" });
    }
  });

  app.post("/api/coupons/:id/use", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementCouponUsage(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment coupon usage" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const emailSchema = z.object({
        email: z.string().email("Email inválido"),
      });

      const { email } = emailSchema.parse(req.body);
      
      // In a real app, you would save this to a database and/or send to an email service
      console.log(`Newsletter subscription: ${email}`);
      
      res.json({ success: true, message: "Email cadastrado com sucesso!" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
