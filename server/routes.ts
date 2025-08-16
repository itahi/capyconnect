import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const { type } = req.query;
      const categories = await storage.getCategories(type ? String(type) : undefined);
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

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const { categoryId, type, isFeatured, limit, search, location } = req.query;
      
      const options: any = {};
      if (categoryId) options.categoryId = String(categoryId);
      if (type) options.type = String(type);
      if (isFeatured !== undefined) options.isFeatured = isFeatured === 'true';
      if (limit) options.limit = parseInt(String(limit));
      if (search) options.search = String(search);
      if (location) options.location = String(location);

      const posts = await storage.getPosts(options);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementPostView(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment post views" });
    }
  });

  app.post("/api/posts/:id/contact", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementPostContact(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment post contacts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const post = await storage.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
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
