import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sessionConfig, requireAuth, optionalAuth } from "./auth";
import {
  type Category,
  type Post,
  type PostWithRelations,
  type UserProfile,
  insertPostSchema,
  insertCommentSchema,
  loginSchema,
  registerSchema,
} from "@shared/schema";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(sessionConfig);
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await storage.register(userData);
      req.session.userId = user.id;
      res.json({ user, message: "Registration successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return res.status(409).json({ error: "Email already registered" });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.login(credentials);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      req.session.userId = user.id;
      res.json({ user, message: "Login successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", optionalAuth, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const { type } = req.query;
      const categories = await storage.getCategories(type ? String(type) : undefined);
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Get category error:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Posts
  app.get("/api/posts", optionalAuth, async (req, res) => {
    try {
      const { categoryId, type, isFeatured, limit, search, location } = req.query;
      
      const options: any = {};
      if (categoryId) options.categoryId = String(categoryId);
      if (type) options.type = String(type);
      if (isFeatured !== undefined) options.isFeatured = isFeatured === 'true';
      if (limit) options.limit = parseInt(String(limit));
      if (search) options.search = String(search);
      if (location) options.location = String(location);
      if (req.session.userId) options.userId = req.session.userId;

      const posts = await storage.getPosts(options);
      res.json(posts);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", optionalAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPostById(id, req.session.userId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Increment view count
      await storage.incrementPostView(id);
      
      res.json(post);
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const postData = insertPostSchema.partial().parse(req.body);
      
      const updatedPost = await storage.updatePost(id, postData, req.session.userId!);
      
      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found or unauthorized" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Update post error:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deletePost(id, req.session.userId!);
      
      if (!success) {
        return res.status(404).json({ error: "Post not found or unauthorized" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/user/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getUserPosts(req.session.userId!);
      res.json(posts);
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  // Likes
  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.likePost(req.session.userId!, id);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to like post" });
      }
      
      res.json({ message: "Post liked successfully" });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.unlikePost(req.session.userId!, id);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to unlike post" });
      }
      
      res.json({ message: "Post unliked successfully" });
    } catch (error) {
      console.error("Unlike post error:", error);
      res.status(500).json({ error: "Failed to unlike post" });
    }
  });

  // Comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getPostComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId: id,
        userId: req.session.userId,
      });

      const comment = await storage.addComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Add comment error:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteComment(id, req.session.userId!);
      
      if (!success) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Favorites
  app.get("/api/user/favorites", requireAuth, async (req, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.session.userId!);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/posts/:id/favorite", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.addToFavorites(req.session.userId!, id);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to favorite post" });
      }
      
      res.json({ message: "Post added to favorites" });
    } catch (error) {
      console.error("Add to favorites error:", error);
      res.status(500).json({ error: "Failed to add to favorites" });
    }
  });

  app.delete("/api/posts/:id/favorite", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.removeFromFavorites(req.session.userId!, id);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to remove from favorites" });
      }
      
      res.json({ message: "Post removed from favorites" });
    } catch (error) {
      console.error("Remove from favorites error:", error);
      res.status(500).json({ error: "Failed to remove from favorites" });
    }
  });

  // Analytics
  app.post("/api/posts/:id/contact", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementPostContact(id);
      res.json({ message: "Contact recorded" });
    } catch (error) {
      console.error("Record contact error:", error);
      res.status(500).json({ error: "Failed to record contact" });
    }
  });

  // Object storage for image uploads
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