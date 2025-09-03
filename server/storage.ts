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
  boosts,
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
    minPrice?: number;
    maxPrice?: number;
    store?: string;
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
        // Services - Expanded
        { name: "Limpeza", slug: "limpeza", icon: "🧹", type: "service" },
        { name: "Encanamento", slug: "encanamento", icon: "🔧", type: "service" },
        { name: "Elétrica", slug: "eletrica", icon: "⚡", type: "service" },
        { name: "Jardinagem", slug: "jardinagem", icon: "🌱", type: "service" },
        { name: "Pintura", slug: "pintura", icon: "🎨", type: "service" },
        { name: "Marcenaria", slug: "marcenaria", icon: "🪚", type: "service" },
        { name: "Serralheria", slug: "serralheria", icon: "🔩", type: "service" },
        { name: "Mecânica", slug: "mecanica", icon: "⚙️", type: "service" },
        { name: "Estética", slug: "estetica", icon: "💅", type: "service" },
        { name: "Massagem", slug: "massagem", icon: "💆", type: "service" },
        { name: "Personal Trainer", slug: "personal-trainer", icon: "💪", type: "service" },
        { name: "Cozinheira", slug: "cozinheira", icon: "👩‍🍳", type: "service" },
        { name: "Babá", slug: "baba", icon: "👶", type: "service" },
        { name: "Diarista", slug: "diarista", icon: "🏠", type: "service" },
        { name: "Catering", slug: "catering", icon: "🍽️", type: "service" },
        { name: "Fotografia", slug: "fotografia", icon: "📸", type: "service" },
        { name: "Design Gráfico", slug: "design-grafico", icon: "🎨", type: "service" },
        { name: "Consultoria", slug: "consultoria", icon: "💼", type: "service" },
        
        // Products - Expanded
        { name: "Eletrônicos", slug: "eletronicos", icon: "📱", type: "product" },
        { name: "Móveis", slug: "moveis", icon: "🪑", type: "product" },
        { name: "Roupas", slug: "roupas", icon: "👕", type: "product" },
        { name: "Casa & Jardim", slug: "casa-jardim", icon: "🏠", type: "product" },
        { name: "Esportes", slug: "esportes", icon: "⚽", type: "product" },
        { name: "Carros", slug: "carros", icon: "🚗", type: "product" },
        { name: "Motos", slug: "motos", icon: "🏍️", type: "product" },
        { name: "Livros", slug: "livros", icon: "📚", type: "product" },
        { name: "Instrumentos Musicais", slug: "instrumentos-musicais", icon: "🎸", type: "product" },
        { name: "Beleza", slug: "beleza", icon: "💄", type: "product" },
        { name: "Joias", slug: "joias", icon: "💍", type: "product" },
        { name: "Brinquedos", slug: "brinquedos", icon: "🧸", type: "product" },
        { name: "Pet Shop", slug: "pet-shop", icon: "🐕", type: "product" },
        { name: "Alimentação", slug: "alimentacao", icon: "🍕", type: "product" },
        { name: "Informática", slug: "informatica", icon: "💻", type: "product" },
        { name: "Ferramentas", slug: "ferramentas", icon: "🛠️", type: "product" },
        
        // Jobs - Expanded
        { name: "Tecnologia", slug: "tecnologia", icon: "💻", type: "job" },
        { name: "Vendas", slug: "vendas", icon: "📈", type: "job" },
        { name: "Educação", slug: "educacao", icon: "🎓", type: "job" },
        { name: "Saúde", slug: "saude", icon: "⚕️", type: "job" },
        { name: "Administração", slug: "administracao", icon: "💼", type: "job" },
        { name: "Marketing", slug: "marketing", icon: "📢", type: "job" },
        { name: "Recursos Humanos", slug: "recursos-humanos", icon: "👥", type: "job" },
        { name: "Engenharia", slug: "engenharia", icon: "⚙️", type: "job" },
        { name: "Design", slug: "design", icon: "🎨", type: "job" },
        { name: "Jurídico", slug: "juridico", icon: "⚖️", type: "job" },
        { name: "Contabilidade", slug: "contabilidade", icon: "🧮", type: "job" },
        { name: "Logística", slug: "logistica", icon: "🚚", type: "job" },
        { name: "Construção Civil", slug: "construcao-civil", icon: "🏗️", type: "job" },
        { name: "Turismo", slug: "turismo", icon: "✈️", type: "job" },
        { name: "Gastronomia", slug: "gastronomia", icon: "🍽️", type: "job" },
        { name: "Segurança", slug: "seguranca", icon: "🛡️", type: "job" },
        
        // News - Expanded  
        { name: "Economia", slug: "economia", icon: "💰", type: "news" },
        { name: "Promoções", slug: "promocoes", icon: "🏷️", type: "news" },
        { name: "Tecnologia", slug: "tech-news", icon: "🔬", type: "news" },
        { name: "Local", slug: "local", icon: "📍", type: "news" },
        { name: "Variedades", slug: "variedades", icon: "📰", type: "news" },
        { name: "Esportes", slug: "esportes-news", icon: "🏆", type: "news" },
        { name: "Saúde", slug: "saude-news", icon: "🏥", type: "news" },
        { name: "Educação", slug: "educacao-news", icon: "🏫", type: "news" },
        { name: "Entretenimento", slug: "entretenimento", icon: "🎭", type: "news" },
        { name: "Política", slug: "politica", icon: "🏛️", type: "news" },
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
    minPrice?: number;
    maxPrice?: number;
    store?: string;
  } = {}): Promise<PostWithRelations[]> {
    const { categoryId, type, isFeatured, limit = 50, search, location, userId, minPrice, maxPrice, store } = options;

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

    if (minPrice !== undefined) {
      conditions.push(sql`${posts.price} >= ${minPrice * 100}`); // Convert to cents
    }

    if (maxPrice !== undefined) {
      conditions.push(sql`${posts.price} <= ${maxPrice * 100}`); // Convert to cents
    }

    if (store) {
      conditions.push(ilike(users.name, `%${store}%`));
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

  // Admin functions
  async getAllPostsForAdmin(): Promise<PostWithRelations[]> {
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
      .orderBy(desc(posts.createdAt));

    return result as PostWithRelations[];
  }

  async getAdminStats(): Promise<{
    totalPosts: number;
    activePosts: number;
    totalUsers: number;
    featuredPosts: number;
  }> {
    const [totalPosts] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [activePosts] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.isActive, true));
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [featuredPosts] = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.isFeatured, true));

    return {
      totalPosts: totalPosts.count,
      activePosts: activePosts.count,
      totalUsers: totalUsers.count,
      featuredPosts: featuredPosts.count,
    };
  }

  async updatePostStatus(id: string, isActive: boolean): Promise<void> {
    await db
      .update(posts)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(posts.id, id));
  }

  async updatePostFeatured(id: string, isFeatured: boolean): Promise<void> {
    await db
      .update(posts)
      .set({ isFeatured, updatedAt: new Date() })
      .where(eq(posts.id, id));
  }

  async deletePostAdmin(id: string): Promise<void> {
    // Delete related records first
    await db.delete(likes).where(eq(likes.postId, id));
    await db.delete(favorites).where(eq(favorites.postId, id));
    await db.delete(comments).where(eq(comments.postId, id));
    await db.delete(boosts).where(eq(boosts.postId, id));
    
    // Delete the post
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Boost functions
  async getPostBoosts(postId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(boosts)
      .where(eq(boosts.postId, postId))
      .orderBy(desc(boosts.createdAt));

    return result;
  }

  async getActivePostBoosts(postId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(boosts)
      .where(
        and(
          eq(boosts.postId, postId),
          eq(boosts.isActive, true),
          sql`${boosts.expiresAt} > NOW()`
        )
      );

    return result;
  }

  async createPostBoost(postId: string, planId: string, userId: string): Promise<any> {
    const plans = {
      basic: { multiplier: 2, duration: 3, price: 1500 },
      premium: { multiplier: 5, duration: 7, price: 3500 },
      pro: { multiplier: 3, duration: 15, price: 6000 },
    };

    const plan = plans[planId as keyof typeof plans];
    if (!plan) {
      throw new Error("Invalid plan");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration);

    const [boost] = await db
      .insert(boosts)
      .values({
        postId,
        userId,
        planId,
        multiplier: plan.multiplier,
        duration: plan.duration,
        price: plan.price,
        expiresAt,
      })
      .returning();

    return boost;
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