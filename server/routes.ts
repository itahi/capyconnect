import type { Express, Request } from "express";
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
import { ImageProcessor } from "./imageProcessor";

import multer from "multer";
import { randomUUID } from "crypto";

// Simple in-memory image storage for demo
const imageStorage = new Map<string, Buffer>();

// Add a demo image on startup
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  // Load smartphone image
  const iphoneImagePath = join(process.cwd(), 'attached_assets/generated_images/smartphone_product_photo_942e8b09.png');
  const iphoneImageBuffer = readFileSync(iphoneImagePath);
  imageStorage.set('exemplo_iphone', iphoneImageBuffer);
  console.log('iPhone demo image loaded successfully, size:', iphoneImageBuffer.length, 'bytes');
  
  // Load headphones image
  const headphonesImagePath = join(process.cwd(), 'attached_assets/generated_images/bluetooth_headphones_product_f60aa7b8.png');
  const headphonesImageBuffer = readFileSync(headphonesImagePath);
  imageStorage.set('exemplo_fone', headphonesImageBuffer);
  console.log('Headphones demo image loaded successfully, size:', headphonesImageBuffer.length, 'bytes');
  
} catch (error) {
  console.log('Could not load all demo images:', error.message);
  // Fallback to a small demo image if the generated ones are not available
  const demoImageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+/qKKKAP/9k=', 'base64');
  imageStorage.set('exemplo_iphone', demoImageBuffer);
  imageStorage.set('exemplo_fone', demoImageBuffer);
  console.log('Demo image fallback loaded for both products');
}

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
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

  // Image upload routes
  // Simple image upload without authentication for testing
  app.post("/api/images/upload-simple", upload.array('images', 8), async (req: any, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const imageUrls: string[] = [];
      
      for (const file of req.files) {
        // Generate unique filename
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const imagePath = `/api/images/${imageId}`;
        
        // Store image buffer in memory
        imageStorage.set(imageId, file.buffer);
        imageUrls.push(imagePath);
      }

      res.json({
        success: true,
        imageUrls,
        message: `${req.files.length} image(s) uploaded successfully`,
      });

    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ 
        error: "Failed to upload images",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/images/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      
      // First try to get from memory storage
      const imageBuffer = imageStorage.get(imageId);
      if (imageBuffer) {
        res.set({
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600'
        });
        return res.send(imageBuffer);
      }
      
      // If not in memory, try object storage
      const objectPath = `/objects/uploads/${imageId}`;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
      
    } catch (error) {
      console.error("Get image error:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Image not found" });
      }
      res.status(500).json({ error: "Failed to get image" });
    }
  });

  // Posts
  app.get("/api/posts", optionalAuth, async (req, res) => {
    try {
      const { categoryId, type, isFeatured, limit, search, location, minPrice, maxPrice, store } = req.query;
      
      const options: any = {};
      if (categoryId) options.categoryId = String(categoryId);
      if (type) options.type = String(type);
      if (isFeatured !== undefined) options.isFeatured = isFeatured === 'true';
      if (limit) options.limit = parseInt(String(limit));
      if (search) options.search = String(search);
      if (location) options.location = String(location);
      if (minPrice) options.minPrice = parseFloat(String(minPrice));
      if (maxPrice) options.maxPrice = parseFloat(String(maxPrice));
      if (store) options.store = String(store);
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

  // Update post endpoint
  app.put("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const updatedPost = await storage.updatePost(id, req.body, userId);
      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found or unauthorized" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
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

  // Toggle like on a post
  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session!.userId!;
      
      // Check if already liked
      const isLiked = await storage.isPostLiked(userId, postId);
      
      if (isLiked) {
        await storage.unlikePost(userId, postId);
      } else {
        await storage.likePost(userId, postId);
      }
      
      // Get updated post to return current like count
      const post = await storage.getPostById(postId);
      
      res.json({
        liked: !isLiked,
        likesCount: post?.likesCount || 0
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Toggle favorite on a post
  app.post("/api/posts/:id/favorite", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session!.userId!;
      
      // Check if already favorited
      const isFavorited = await storage.isPostFavorited(userId, postId);
      
      if (isFavorited) {
        await storage.removeFromFavorites(userId, postId);
      } else {
        await storage.addToFavorites(userId, postId);
      }
      
      res.json({
        favorited: !isFavorited
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // Add comment to a post
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session!.userId!;
      const { content } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: "Comment content is required" });
      }
      
      const commentData = {
        userId,
        postId,
        content: content.trim()
      };
      
      const comment = await storage.addComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = req.params.id;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Get user favorites
  app.get("/api/user/favorites", requireAuth, async (req, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.session.userId!);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  // Get like/favorite status for a post
  app.get("/api/posts/:id/like-status", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session!.userId!;
      
      const [liked, favorited] = await Promise.all([
        storage.isPostLiked(userId, postId),
        storage.isPostFavorited(userId, postId)
      ]);
      
      res.json({
        liked,
        favorited
      });
    } catch (error) {
      console.error("Error checking like/favorite status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Admin routes
  app.get("/api/admin/check", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      res.json({ isAdmin: user?.isAdmin || false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  app.get("/api/admin/posts", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const posts = await storage.getAllPostsForAdmin();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/posts/:id/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { isActive } = req.body;
      await storage.updatePostStatus(req.params.id, isActive);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating post status:", error);
      res.status(500).json({ error: "Failed to update post status" });
    }
  });

  app.patch("/api/admin/posts/:id/featured", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { isFeatured } = req.body;
      await storage.updatePostFeatured(req.params.id, isFeatured);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating post featured status:", error);
      res.status(500).json({ error: "Failed to update featured status" });
    }
  });

  app.delete("/api/admin/posts/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deletePostAdmin(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Boost/Impulsionamento routes
  app.get("/api/posts/:id/boosts", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const boosts = await storage.getPostBoosts(postId);
      res.json(boosts);
    } catch (error) {
      console.error("Error fetching post boosts:", error);
      res.status(500).json({ error: "Failed to fetch boosts" });
    }
  });

  app.post("/api/posts/:id/boost", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session!.userId!;
      const { planId } = req.body;

      // Verify post ownership
      const post = await storage.getPostById(postId);
      if (!post || post.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if post already has active boost
      const activeBoosts = await storage.getActivePostBoosts(postId);
      if (activeBoosts.length > 0) {
        return res.status(400).json({ error: "Post already has active boost" });
      }

      // Create boost record (in real app, integrate with Stripe here)
      const boost = await storage.createPostBoost(postId, planId, userId);
      
      res.json(boost);
    } catch (error) {
      console.error("Error creating boost:", error);
      res.status(500).json({ error: "Failed to create boost" });
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

  // Enhanced image upload with automatic processing
  app.post("/api/images/upload", upload.array('images', 3), async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const uploadPromises = req.files.map(async (file: any) => {
        // Validate image
        const isValid = await ImageProcessor.validateImage(file.buffer);
        if (!isValid) {
          throw new Error(`Invalid image file: ${file.originalname}`);
        }

        // Process image (resize, convert to PNG, optimize)
        const processedBuffer = await ImageProcessor.processImage(file.buffer, {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 85,
          format: "png",
        });

        // Get upload URL
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();

        // Upload processed image
        const response = await fetch(uploadURL, {
          method: "PUT",
          body: processedBuffer,
          headers: {
            "Content-Type": "image/png",
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.originalname}`);
        }

        return uploadURL.split('?')[0]; // Remove query parameters
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Normalize paths
      const processedPaths: string[] = [];
      for (const imageURL of uploadedUrls) {
        const objectPath = objectStorageService.normalizeObjectEntityPath(imageURL);
        processedPaths.push(objectPath);
      }

      res.json({
        success: true,
        imageUrls: processedPaths,
        message: `${(req.files as any[]).length} image(s) uploaded and processed successfully`,
      });

    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ 
        error: "Failed to upload images",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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

  // Get like status for a post
  app.get("/api/posts/:postId/like-status", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session!.userId!;

      const liked = await storage.isPostLiked(userId, postId);
      res.json({ liked });
    } catch (error) {
      console.error("Error getting like status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Post interactions API
  app.post("/api/posts/:postId/like", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session!.userId!;

      // Check if already liked
      const isLiked = await storage.isPostLiked(userId, postId);
      
      if (isLiked) {
        await storage.unlikePost(userId, postId);
      } else {
        await storage.likePost(userId, postId);
      }
      
      // Get updated post to return current like count
      const post = await storage.getPostById(postId);
      
      res.json({
        liked: !isLiked,
        likesCount: post?.likesCount || 0
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Não foi possível curtir o post" });
    }
  });

  app.post("/api/posts/:postId/favorite", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session!.userId!;

      // Check if already favorited
      const isFavorited = await storage.isPostFavorited(userId, postId);
      
      if (isFavorited) {
        await storage.removeFromFavorites(userId, postId);
      } else {
        await storage.addToFavorites(userId, postId);
      }
      
      res.json({
        favorited: !isFavorited
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Não foi possível favoritar o post" });
    }
  });

  // Comments API
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error getting comments:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.session!.userId!;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Conteúdo do comentário é obrigatório" });
      }

      const commentData = {
        userId,
        postId,
        content: content.trim(),
      };

      const newComment = await storage.addComment(commentData);
      res.json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.session!.userId!;

      const deleted = await storage.deleteComment(commentId, userId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Comentário não encontrado" });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // User favorites
  app.get("/api/user/favorites", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error getting user favorites:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}