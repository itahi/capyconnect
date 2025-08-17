import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

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

  // Object storage routes for public file serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage routes for image uploads
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for images
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Process uploaded images and set them as public
  app.put("/api/images", async (req, res) => {
    if (!req.body.imageURLs || !Array.isArray(req.body.imageURLs)) {
      return res.status(400).json({ error: "imageURLs array is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const processedPaths: string[] = [];

      for (const imageURL of req.body.imageURLs) {
        const objectPath = objectStorageService.normalizeObjectEntityPath(imageURL);
        processedPaths.push(objectPath);
      }

      res.status(200).json({
        objectPaths: processedPaths,
      });
    } catch (error) {
      console.error("Error processing uploaded images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
