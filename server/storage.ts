import { 
  type Category, type User, type Post,
  type InsertCategory, type InsertUser, type InsertPost,
  type PostWithRelations
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(type?: string): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Posts
  getPosts(options?: {
    categoryId?: string;
    type?: string;
    isFeatured?: boolean;
    limit?: number;
    search?: string;
    location?: string;
  }): Promise<PostWithRelations[]>;
  getPostById(id: string): Promise<PostWithRelations | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  incrementPostView(id: string): Promise<void>;
  incrementPostContact(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private users: Map<string, User> = new Map();
  private posts: Map<string, Post> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
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
      { name: "Casa", slug: "casa", icon: "fas fa-home", type: "product" },
      
      // Jobs
      { name: "Tecnologia", slug: "tecnologia", icon: "fas fa-code", type: "job" },
      { name: "Vendas", slug: "vendas", icon: "fas fa-handshake", type: "job" },
      { name: "Administração", slug: "administracao", icon: "fas fa-briefcase", type: "job" },
      { name: "Saúde", slug: "saude", icon: "fas fa-heartbeat", type: "job" },
      
      // News
      { name: "Economia", slug: "economia", icon: "fas fa-chart-line", type: "news" },
      { name: "Negócios", slug: "negocios", icon: "fas fa-building", type: "news" },
      { name: "Tecnologia", slug: "tech-news", icon: "fas fa-microchip", type: "news" },
    ];

    categoryData.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { id, ...cat, postCount: 0 });
    });

    // Seed users
    const userData = [
      { name: "João Silva", email: "joao@email.com", phone: "(11) 99999-0001", whatsapp: "11999990001", location: "São Paulo - SP", isVerified: true },
      { name: "Maria Santos", email: "maria@email.com", phone: "(21) 99999-0002", whatsapp: "21999990002", location: "Rio de Janeiro - RJ", isVerified: true },
      { name: "Pedro Lima", email: "pedro@email.com", phone: "(31) 99999-0003", whatsapp: "31999990003", location: "Belo Horizonte - MG", isVerified: false },
      { name: "Ana Costa", email: "ana@email.com", phone: "(85) 99999-0004", whatsapp: "85999990004", location: "Fortaleza - CE", isVerified: true },
    ];

    userData.forEach(user => {
      const id = randomUUID();
      this.users.set(id, { 
        id, 
        name: user.name,
        email: user.email ?? null,
        phone: user.phone ?? null,
        whatsapp: user.whatsapp ?? null,
        location: user.location ?? null,
        isVerified: user.isVerified || false,
        createdAt: new Date()
      });
    });

    // Get some IDs for seeding posts
    const categoryIds = Array.from(this.categories.keys());
    const userIds = Array.from(this.users.keys());

    // Seed posts
    const postData = [
      {
        title: "Serviço de Limpeza Residencial",
        description: "Limpeza completa de casas e apartamentos. Equipe experiente, produtos de qualidade. Orçamento sem compromisso.",
        imageUrls: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        price: 15000, // R$ 150.00
        whatsappNumber: "11999990001",
        externalLink: "https://limpezatotal.com.br",
        location: "São Paulo - SP",
        isFeatured: true,
        categoryId: categoryIds[0], // Limpeza
        userId: userIds[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        title: "Instalação e Reparo de Torneiras",
        description: "Encanador profissional para instalação, reparo e manutenção de torneiras, chuveiros e conexões hidráulicas.",
        imageUrls: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        price: 8000, // R$ 80.00
        whatsappNumber: "21999990002",
        location: "Rio de Janeiro - RJ",
        isFeatured: false,
        categoryId: categoryIds[1], // Encanamento
        userId: userIds[1],
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      },
      {
        title: "Notebook Gamer usado - RTX 3060",
        description: "Notebook Dell G15 em ótimo estado, usado por apenas 6 meses. Ideal para jogos e trabalho. Acompanha carregador e caixa original.",
        imageUrls: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        price: 280000, // R$ 2,800.00
        whatsappNumber: "31999990003",
        externalLink: "https://olx.com.br/notebook-gamer-dell",
        location: "Belo Horizonte - MG",
        isFeatured: true,
        categoryId: categoryIds[5], // Eletrônicos
        userId: userIds[2],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      {
        title: "Desenvolvedor Frontend - React",
        description: "Vaga para desenvolvedor frontend com experiência em React, TypeScript e Tailwind CSS. Trabalho remoto, CLT, excelentes benefícios.",
        imageUrls: ["https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        whatsappNumber: "85999990004",
        externalLink: "https://empresa.com.br/vagas/frontend",
        location: "Remoto",
        isFeatured: false,
        categoryId: categoryIds[9], // Tecnologia (job)
        userId: userIds[3],
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
      },
      {
        title: "Mercado de Startups Cresce 40% no Brasil",
        description: "Segundo relatório da ABSTARTUPS, o ecossistema brasileiro de startups registrou crescimento expressivo em 2024, com destaque para fintechs e healthtechs.",
        imageUrls: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        externalLink: "https://abstartups.com.br/relatorio-2024",
        location: "Brasil",
        isFeatured: true,
        categoryId: categoryIds[13], // Economia (news)
        userId: userIds[0],
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
    ];

    postData.forEach(post => {
      const id = randomUUID();
      this.posts.set(id, { 
        id, 
        title: post.title,
        description: post.description,
        imageUrls: post.imageUrls || null,
        price: post.price || null,
        whatsappNumber: post.whatsappNumber || null,
        externalLink: post.externalLink || null,
        location: post.location || null,
        isActive: true,
        isFeatured: post.isFeatured || false,
        viewCount: Math.floor(Math.random() * 500), 
        contactCount: Math.floor(Math.random() * 50),
        createdAt: new Date(),
        expiresAt: post.expiresAt || null,
        categoryId: post.categoryId || null,
        userId: post.userId || null
      });
    });

    // Update category post counts
    this.updateCategoryPostCounts();
  }

  private updateCategoryPostCounts() {
    const counts = new Map<string, number>();
    this.posts.forEach(post => {
      if (post.categoryId) {
        counts.set(post.categoryId, (counts.get(post.categoryId) || 0) + 1);
      }
    });

    this.categories.forEach((category, id) => {
      this.categories.set(id, { ...category, postCount: counts.get(id) || 0 });
    });
  }

  // Categories
  async getCategories(type?: string): Promise<Category[]> {
    let categories = Array.from(this.categories.values());
    if (type) {
      categories = categories.filter(cat => cat.type === type);
    }
    return categories.sort((a, b) => (b.postCount || 0) - (a.postCount || 0));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, postCount: 0 };
    this.categories.set(id, category);
    return category;
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Posts
  async getPosts(options: {
    categoryId?: string;
    type?: string;
    isFeatured?: boolean;
    limit?: number;
    search?: string;
    location?: string;
  } = {}): Promise<PostWithRelations[]> {
    let posts = Array.from(this.posts.values()).filter(post => post.isActive);

    // Filter by category
    if (options.categoryId) {
      posts = posts.filter(post => post.categoryId === options.categoryId);
    }

    // Filter by type (through category)
    if (options.type) {
      const categoriesOfType = Array.from(this.categories.values()).filter(cat => cat.type === options.type);
      const categoryIds = categoriesOfType.map(cat => cat.id);
      posts = posts.filter(post => post.categoryId && categoryIds.includes(post.categoryId));
    }

    // Filter by featured
    if (options.isFeatured !== undefined) {
      posts = posts.filter(post => post.isFeatured === options.isFeatured);
    }

    // Search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        (post.location?.toLowerCase().includes(searchLower))
      );
    }

    // Location filter
    if (options.location) {
      const locationLower = options.location.toLowerCase();
      posts = posts.filter(post => 
        post.location?.toLowerCase().includes(locationLower)
      );
    }

    // Sort by featured first, then by creation date
    posts.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    });

    // Apply limit
    if (options.limit) {
      posts = posts.slice(0, options.limit);
    }

    // Add relations
    return posts.map(post => ({
      ...post,
      category: post.categoryId ? this.categories.get(post.categoryId) || null : null,
      user: post.userId ? this.users.get(post.userId) || null : null,
    }));
  }

  async getPostById(id: string): Promise<PostWithRelations | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    return {
      ...post,
      category: post.categoryId ? this.categories.get(post.categoryId) || null : null,
      user: post.userId ? this.users.get(post.userId) || null : null,
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = { 
      id,
      title: insertPost.title,
      description: insertPost.description,
      imageUrl: insertPost.imageUrl || null,
      price: insertPost.price || null,
      whatsappNumber: insertPost.whatsappNumber || null,
      externalLink: insertPost.externalLink || null,
      location: insertPost.location || null,
      isActive: insertPost.isActive !== undefined ? insertPost.isActive : true,
      isFeatured: insertPost.isFeatured || false,
      viewCount: 0, 
      contactCount: 0, 
      createdAt: new Date(),
      expiresAt: insertPost.expiresAt || null,
      categoryId: insertPost.categoryId || null,
      userId: insertPost.userId || null
    };
    this.posts.set(id, post);
    this.updateCategoryPostCounts();
    return post;
  }

  async incrementPostView(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      this.posts.set(id, { ...post, viewCount: (post.viewCount || 0) + 1 });
    }
  }

  async incrementPostContact(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      this.posts.set(id, { ...post, contactCount: (post.contactCount || 0) + 1 });
    }
  }


}

export const storage = new MemStorage();
