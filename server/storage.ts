import bcrypt from "bcryptjs";
import { eq, desc, and, sql, ilike, count } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  posts,
  categories,
  likes,
  comments,
  favorites,
  type Category,
  type User,
  type Post,
  type Like,
  type Comment,
  type Favorite,
  type InsertCategory,
  type InsertUser,
  type InsertPost,
  type InsertLike,
  type InsertComment,
  type InsertFavorite,
  type PostWithRelations,
  type CommentWithUser,
  type UserProfile,
  type LoginData,
  type RegisterData,
} from "@shared/schema";

export interface IStorage {
  // Auth
  login(credentials: LoginData): Promise<UserProfile | null>;
  register(userData: RegisterData): Promise<UserProfile>;
  getUserById(id: string): Promise<UserProfile | undefined>;
  
  // Categories
  getCategories(type?: string): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Posts
  getPosts(options?: {
    categoryId?: string;
    type?: string;
    isFeatured?: boolean;
    limit?: number;
    search?: string;
    location?: string;
    userId?: string;
  }): Promise<PostWithRelations[]>;
  getPostById(id: string, userId?: string): Promise<PostWithRelations | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>, userId: string): Promise<Post | null>;
  deletePost(id: string, userId: string): Promise<boolean>;
  getUserPosts(userId: string): Promise<PostWithRelations[]>;
  
  // Interactions
  likePost(userId: string, postId: string): Promise<boolean>;
  unlikePost(userId: string, postId: string): Promise<boolean>;
  isPostLiked(userId: string, postId: string): Promise<boolean>;
  
  // Comments
  addComment(comment: InsertComment): Promise<CommentWithUser>;
  getPostComments(postId: string): Promise<CommentWithUser[]>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  
  // Favorites
  addToFavorites(userId: string, postId: string): Promise<boolean>;
  removeFromFavorites(userId: string, postId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<PostWithRelations[]>;
  isPostFavorited(userId: string, postId: string): Promise<boolean>;
  
  // Analytics
  incrementPostView(id: string): Promise<void>;
  incrementPostContact(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    try {
      // Check if categories already exist
      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length > 0) return;

      // Seed categories by type
      const categoryData = [
        // Services
        { name: "Limpeza", slug: "limpeza", icon: "fas fa-broom", type: "service" },
        { name: "Encanamento", slug: "encanamento", icon: "fas fa-wrench", type: "service" },
        { name: "Elétrica", slug: "eletrica", icon: "fas fa-bolt", type: "service" },
        { name: "Jardinagem", slug: "jardinagem", icon: "fas fa-leaf", type: "service" },
        { name: "Pintura", slug: "pintura", icon: "fas fa-paint-roller", type: "service" },
        
        // Products
        { name: "Eletrônicos", slug: "eletronicos", icon: "fas fa-laptop", type: "product" },
        { name: "Móveis", slug: "moveis", icon: "fas fa-chair", type: "product" },
        { name: "Roupas", slug: "roupas", icon: "fas fa-tshirt", type: "product" },
        { name: "Casa & Jardim", slug: "casa-jardim", icon: "fas fa-home", type: "product" },
        { name: "Esportes", slug: "esportes", icon: "fas fa-dumbbell", type: "product" },
        
        // Jobs
        { name: "Tecnologia", slug: "tecnologia", icon: "fas fa-code", type: "job" },
        { name: "Vendas", slug: "vendas", icon: "fas fa-chart-line", type: "job" },
        { name: "Educação", slug: "educacao", icon: "fas fa-graduation-cap", type: "job" },
        { name: "Saúde", slug: "saude", icon: "fas fa-heartbeat", type: "job" },
        { name: "Administração", slug: "administracao", icon: "fas fa-briefcase", type: "job" },
        
        // News
        { name: "Economia", slug: "economia", icon: "fas fa-dollar-sign", type: "news" },
        { name: "Promoções", slug: "promocoes", icon: "fas fa-tags", type: "news" },
        { name: "Tecnologia", slug: "tech-news", icon: "fas fa-microchip", type: "news" },
        { name: "Local", slug: "local", icon: "fas fa-map-marker-alt", type: "news" },
        { name: "Variedades", slug: "variedades", icon: "fas fa-newspaper", type: "news" },
      ];

      await db.insert(categories).values(categoryData);
      console.log("Categories seeded successfully");
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  // Auth methods
  async register(userData: RegisterData): Promise<UserProfile> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        phone: userData.phone || null,
        location: userData.location || null,
      })
      .returning();

    // Return user without password hash
    const { passwordHash, ...userProfile } = user;
    return userProfile;
  }

  async login(credentials: LoginData): Promise<UserProfile | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email));

    if (!user) return null;

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) return null;

    // Return user without password hash
    const { passwordHash, ...userProfile } = user;
    return userProfile;
  }

  async getUserById(id: string): Promise<UserProfile | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) return undefined;

    // Return user without password hash
    const { passwordHash, ...userProfile } = user;
    return userProfile;
  }

  // Categories
  async getCategories(type?: string): Promise<Category[]> {
    const query = db.select().from(categories);
    
    if (type) {
      return query.where(eq(categories.type, type));
    }
    
    return query;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    
    return newCategory;
  }

  // Posts
  async getPosts(options: {
    categoryId?: string;
    type?: string;
    isFeatured?: boolean;
    limit?: number;
    search?: string;
    location?: string;
    userId?: string;
  } = {}): Promise<PostWithRelations[]> {
    const { categoryId, type, isFeatured, limit = 50, search, location, userId } = options;

    // Build where conditions
    const conditions = [eq(posts.isActive, true)];

    if (categoryId) {
      conditions.push(eq(posts.categoryId, categoryId));
    }

    if (type) {
      conditions.push(eq(categories.type, type));
    }

    if (isFeatured !== undefined) {
      conditions.push(eq(posts.isFeatured, isFeatured));
    }

    if (search) {
      conditions.push(
        sql`(${ilike(posts.title, `%${search}%`)} OR ${ilike(posts.description, `%${search}%`)})`
      );
    }

    if (location) {
      conditions.push(ilike(posts.location, `%${location}%`));
    }

    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        imageUrls: posts.imageUrls,
        price: posts.price,
        whatsappNumber: posts.whatsappNumber,
        externalLink: posts.externalLink,
        location: posts.location,
        isActive: posts.isActive,
        isFeatured: posts.isFeatured,
        viewCount: posts.viewCount,
        contactCount: posts.contactCount,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        expiresAt: posts.expiresAt,
        categoryId: posts.categoryId,
        userId: posts.userId,
        category: categories,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          whatsapp: users.whatsapp,
          location: users.location,
          avatar: users.avatar,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    // Add user interaction data if userId provided
    if (userId) {
      const postsWithInteractions = await Promise.all(
        result.map(async (post) => {
          const isLiked = await this.isPostLiked(userId, post.id);
          const isFavorited = await this.isPostFavorited(userId, post.id);
          return { ...post, isLiked, isFavorited } as PostWithRelations;
        })
      );
      return postsWithInteractions;
    }

    return result as PostWithRelations[];
  }

  async getPostById(id: string, userId?: string): Promise<PostWithRelations | undefined> {
    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        imageUrls: posts.imageUrls,
        price: posts.price,
        whatsappNumber: posts.whatsappNumber,
        externalLink: posts.externalLink,
        location: posts.location,
        isActive: posts.isActive,
        isFeatured: posts.isFeatured,
        viewCount: posts.viewCount,
        contactCount: posts.contactCount,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        expiresAt: posts.expiresAt,
        categoryId: posts.categoryId,
        userId: posts.userId,
        category: categories,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          whatsapp: users.whatsapp,
          location: users.location,
          avatar: users.avatar,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));

    if (!post) return undefined;

    // Add user interaction data if userId provided
    if (userId) {
      const isLiked = await this.isPostLiked(userId, post.id);
      const isFavorited = await this.isPostFavorited(userId, post.id);
      const postComments = await this.getPostComments(post.id);
      
      return { ...post, isLiked, isFavorited, comments: postComments } as PostWithRelations;
    }

    return post as PostWithRelations;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();

    return newPost;
  }

  async updatePost(id: string, postData: Partial<InsertPost>, userId: string): Promise<Post | null> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...postData, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();

    return updatedPost || null;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));

    return (result.rowCount ?? 0) > 0;
  }

  async getUserPosts(userId: string): Promise<PostWithRelations[]> {
    return this.getPosts({ userId });
  }

  // Interactions
  async likePost(userId: string, postId: string): Promise<boolean> {
    try {
      await db.insert(likes).values({ userId, postId });
      
      // Update likes count
      await db
        .update(posts)
        .set({ 
          likesCount: sql`${posts.likesCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));

      return true;
    } catch (error) {
      return false;
    }
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    if ((result.rowCount ?? 0) > 0) {
      // Update likes count
      await db
        .update(posts)
        .set({ 
          likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));

      return true;
    }

    return false;
  }

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .limit(1);

    return !!like;
  }

  // Comments
  async addComment(comment: InsertComment): Promise<CommentWithUser> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();

    // Update comments count
    await db
      .update(posts)
      .set({ 
        commentsCount: sql`${posts.commentsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, comment.postId));

    // Get comment with user data
    const [commentWithUser] = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        postId: comments.postId,
        content: comments.content,
        parentId: comments.parentId,
        isActive: comments.isActive,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          whatsapp: users.whatsapp,
          location: users.location,
          avatar: users.avatar,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, newComment.id));

    return commentWithUser as CommentWithUser;
  }

  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const result = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        postId: comments.postId,
        content: comments.content,
        parentId: comments.parentId,
        isActive: comments.isActive,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          whatsapp: users.whatsapp,
          location: users.location,
          avatar: users.avatar,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.postId, postId), eq(comments.isActive, true)))
      .orderBy(desc(comments.createdAt));

    return result as CommentWithUser[];
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (!comment) return false;

    const result = await db
      .update(comments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));

    if ((result.rowCount ?? 0) > 0) {
      // Update comments count
      await db
        .update(posts)
        .set({ 
          commentsCount: sql`GREATEST(${posts.commentsCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, comment.postId));

      return true;
    }

    return false;
  }

  // Favorites
  async addToFavorites(userId: string, postId: string): Promise<boolean> {
    try {
      await db.insert(favorites).values({ userId, postId });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeFromFavorites(userId: string, postId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.postId, postId)));

    return (result.rowCount ?? 0) > 0;
  }

  async getUserFavorites(userId: string): Promise<PostWithRelations[]> {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        imageUrls: posts.imageUrls,
        price: posts.price,
        whatsappNumber: posts.whatsappNumber,
        externalLink: posts.externalLink,
        location: posts.location,
        isActive: posts.isActive,
        isFeatured: posts.isFeatured,
        viewCount: posts.viewCount,
        contactCount: posts.contactCount,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        expiresAt: posts.expiresAt,
        categoryId: posts.categoryId,
        userId: posts.userId,
        category: categories,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          whatsapp: users.whatsapp,
          location: users.location,
          avatar: users.avatar,
          isVerified: users.isVerified,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(favorites)
      .leftJoin(posts, eq(favorites.postId, posts.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(eq(favorites.userId, userId), eq(posts.isActive, true)))
      .orderBy(desc(favorites.createdAt));

    return result.filter(r => r.id !== null).map(r => ({ ...r, isFavorited: true } as PostWithRelations));
  }

  async isPostFavorited(userId: string, postId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.postId, postId)))
      .limit(1);

    return !!favorite;
  }

  // Analytics
  async incrementPostView(id: string): Promise<void> {
    await db
      .update(posts)
      .set({ 
        viewCount: sql`${posts.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, id));
  }

  async incrementPostContact(id: string): Promise<void> {
    await db
      .update(posts)
      .set({ 
        contactCount: sql`${posts.contactCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, id));
  }
}

export const storage = new DatabaseStorage();