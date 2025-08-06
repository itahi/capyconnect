import { 
  type Category, type Store, type Deal, type Coupon,
  type InsertCategory, type InsertStore, type InsertDeal, type InsertCoupon,
  type DealWithRelations, type CouponWithStore
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Stores
  getStores(): Promise<Store[]>;
  getStoreById(id: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;

  // Deals
  getDeals(options?: {
    categoryId?: string;
    storeId?: string;
    isHot?: boolean;
    limit?: number;
    search?: string;
  }): Promise<DealWithRelations[]>;
  getDealById(id: string): Promise<DealWithRelations | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  incrementDealUsage(id: string): Promise<void>;

  // Coupons
  getCoupons(options?: {
    storeId?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<CouponWithStore[]>;
  getCouponById(id: string): Promise<CouponWithStore | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  incrementCouponUsage(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private stores: Map<string, Store> = new Map();
  private deals: Map<string, Deal> = new Map();
  private coupons: Map<string, Coupon> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoryData = [
      { name: "Smartphones", slug: "smartphones", icon: "fas fa-mobile-alt" },
      { name: "Eletrônicos", slug: "eletronicos", icon: "fas fa-laptop" },
      { name: "Casa e Jardim", slug: "casa-jardim", icon: "fas fa-home" },
      { name: "Moda", slug: "moda", icon: "fas fa-tshirt" },
      { name: "Games", slug: "games", icon: "fas fa-gamepad" },
      { name: "Saúde e Beleza", slug: "saude-beleza", icon: "fas fa-heart" },
      { name: "Esportes", slug: "esportes", icon: "fas fa-dumbbell" },
      { name: "Viagens", slug: "viagens", icon: "fas fa-plane" },
    ];

    categoryData.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { id, ...cat, dealCount: 0 });
    });

    // Seed stores
    const storeData = [
      { name: "Amazon", slug: "amazon", logoUrl: "https://logo.clearbit.com/amazon.com.br", websiteUrl: "https://amazon.com.br", isVerified: true },
      { name: "Magazine Luiza", slug: "magazine-luiza", logoUrl: "https://logo.clearbit.com/magazineluiza.com.br", websiteUrl: "https://magazineluiza.com.br", isVerified: true },
      { name: "Americanas", slug: "americanas", logoUrl: "https://logo.clearbit.com/americanas.com.br", websiteUrl: "https://americanas.com.br", isVerified: true },
      { name: "Casas Bahia", slug: "casas-bahia", logoUrl: "https://logo.clearbit.com/casasbahia.com.br", websiteUrl: "https://casasbahia.com.br", isVerified: true },
      { name: "Nike", slug: "nike", logoUrl: "https://logo.clearbit.com/nike.com", websiteUrl: "https://nike.com.br", isVerified: true },
      { name: "Dell", slug: "dell", logoUrl: "https://logo.clearbit.com/dell.com", websiteUrl: "https://dell.com.br", isVerified: true },
    ];

    storeData.forEach(store => {
      const id = randomUUID();
      this.stores.set(id, { id, ...store });
    });

    // Get some IDs for seeding deals
    const categoryIds = Array.from(this.categories.keys());
    const storeIds = Array.from(this.stores.keys());

    // Seed deals
    const dealData = [
      {
        title: "iPhone 14 Pro Max 256GB",
        description: "O mais novo iPhone com câmera profissional e tela Super Retina XDR",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        originalPrice: 1199900, // R$ 11,999.00
        salePrice: 419900, // R$ 4,199.00
        discountPercentage: 65,
        dealUrl: "https://amazon.com.br/iphone-14-pro-max",
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        isHot: true,
        categoryId: categoryIds[0], // Smartphones
        storeId: storeIds[0], // Amazon
      },
      {
        title: "Notebook Gamer Dell G15 RTX 3060",
        description: "Notebook gamer com placa RTX 3060, ideal para jogos e trabalho",
        imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        originalPrice: 599900, // R$ 5,999.00
        salePrice: 329900, // R$ 3,299.00
        discountPercentage: 45,
        dealUrl: "https://dell.com.br/notebook-gamer-g15",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        isHot: true,
        categoryId: categoryIds[1], // Eletrônicos
        storeId: storeIds[5], // Dell
      },
      {
        title: "Air Fryer Philips Walita 4.1L",
        description: "Fritadeira sem óleo com tecnologia Rapid Air",
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        originalPrice: 66900, // R$ 669.00
        salePrice: 29900, // R$ 299.00
        discountPercentage: 55,
        dealUrl: "https://magazineluiza.com.br/air-fryer-philips",
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
        isHot: true,
        categoryId: categoryIds[2], // Casa e Jardim
        storeId: storeIds[1], // Magazine Luiza
      },
      {
        title: "Tênis Nike Air Max 270",
        description: "Tênis esportivo com tecnologia Air Max para máximo conforto",
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        originalPrice: 59900, // R$ 599.00
        salePrice: 38900, // R$ 389.00
        discountPercentage: 35,
        dealUrl: "https://nike.com.br/tenis-air-max-270",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        isHot: false,
        categoryId: categoryIds[6], // Esportes
        storeId: storeIds[4], // Nike
      },
      {
        title: "Headset Gamer HyperX Cloud II",
        description: "Headset gamer com som surround 7.1 e microfone removível",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        originalPrice: 39900, // R$ 399.00
        salePrice: 29900, // R$ 299.00
        discountPercentage: 25,
        dealUrl: "https://americanas.com.br/headset-hyperx-cloud-ii",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        isHot: false,
        categoryId: categoryIds[4], // Games
        storeId: storeIds[2], // Americanas
      },
      {
        title: "Smart TV Samsung 55\" 4K Crystal UHD",
        description: "Smart TV 55 polegadas com resolução 4K e HDR",
        imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        originalPrice: 319900, // R$ 3,199.00
        salePrice: 189900, // R$ 1,899.00
        discountPercentage: 40,
        dealUrl: "https://casasbahia.com.br/smart-tv-samsung-55",
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        isHot: false,
        categoryId: categoryIds[1], // Eletrônicos
        storeId: storeIds[3], // Casas Bahia
      },
    ];

    dealData.forEach(deal => {
      const id = randomUUID();
      this.deals.set(id, { id, ...deal, usageCount: Math.floor(Math.random() * 300), isVerified: true });
    });

    // Seed coupons
    const couponData = [
      {
        code: "MAGALU15",
        title: "15% OFF",
        description: "Em compras acima de R$ 299",
        discountType: "percentage",
        discountValue: 15,
        minPurchase: 29900, // R$ 299.00
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        isActive: true,
        storeId: storeIds[1], // Magazine Luiza
      },
      {
        code: "PRIMEIRACOMPRA",
        title: "R$ 50 OFF",
        description: "Primeira compra no app",
        discountType: "fixed",
        discountValue: 5000, // R$ 50.00
        minPurchase: 10000, // R$ 100.00
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
        storeId: storeIds[0], // Amazon
      },
    ];

    couponData.forEach(coupon => {
      const id = randomUUID();
      this.coupons.set(id, { id, ...coupon, usageCount: Math.floor(Math.random() * 100) });
    });

    // Update category deal counts
    this.updateCategoryDealCounts();
  }

  private updateCategoryDealCounts() {
    const counts = new Map<string, number>();
    this.deals.forEach(deal => {
      if (deal.categoryId) {
        counts.set(deal.categoryId, (counts.get(deal.categoryId) || 0) + 1);
      }
    });

    this.categories.forEach((category, id) => {
      this.categories.set(id, { ...category, dealCount: counts.get(id) || 0 });
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => b.dealCount - a.dealCount);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, dealCount: 0 };
    this.categories.set(id, category);
    return category;
  }

  // Stores
  async getStores(): Promise<Store[]> {
    return Array.from(this.stores.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getStoreById(id: string): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = randomUUID();
    const store: Store = { ...insertStore, id };
    this.stores.set(id, store);
    return store;
  }

  // Deals
  async getDeals(options: {
    categoryId?: string;
    storeId?: string;
    isHot?: boolean;
    limit?: number;
    search?: string;
  } = {}): Promise<DealWithRelations[]> {
    let deals = Array.from(this.deals.values());

    // Filter by category
    if (options.categoryId) {
      deals = deals.filter(deal => deal.categoryId === options.categoryId);
    }

    // Filter by store
    if (options.storeId) {
      deals = deals.filter(deal => deal.storeId === options.storeId);
    }

    // Filter by hot deals
    if (options.isHot !== undefined) {
      deals = deals.filter(deal => deal.isHot === options.isHot);
    }

    // Search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      deals = deals.filter(deal => 
        deal.title.toLowerCase().includes(searchLower) ||
        (deal.description?.toLowerCase().includes(searchLower))
      );
    }

    // Sort by hot deals first, then by discount percentage
    deals.sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return b.discountPercentage - a.discountPercentage;
    });

    // Apply limit
    if (options.limit) {
      deals = deals.slice(0, options.limit);
    }

    // Add relations
    return deals.map(deal => ({
      ...deal,
      category: deal.categoryId ? this.categories.get(deal.categoryId) || null : null,
      store: deal.storeId ? this.stores.get(deal.storeId) || null : null,
    }));
  }

  async getDealById(id: string): Promise<DealWithRelations | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;

    return {
      ...deal,
      category: deal.categoryId ? this.categories.get(deal.categoryId) || null : null,
      store: deal.storeId ? this.stores.get(deal.storeId) || null : null,
    };
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const deal: Deal = { ...insertDeal, id, usageCount: 0 };
    this.deals.set(id, deal);
    this.updateCategoryDealCounts();
    return deal;
  }

  async incrementDealUsage(id: string): Promise<void> {
    const deal = this.deals.get(id);
    if (deal) {
      this.deals.set(id, { ...deal, usageCount: deal.usageCount + 1 });
    }
  }

  // Coupons
  async getCoupons(options: {
    storeId?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<CouponWithStore[]> {
    let coupons = Array.from(this.coupons.values());

    // Filter by store
    if (options.storeId) {
      coupons = coupons.filter(coupon => coupon.storeId === options.storeId);
    }

    // Filter by active status
    if (options.isActive !== undefined) {
      coupons = coupons.filter(coupon => coupon.isActive === options.isActive);
    }

    // Sort by expiration date
    coupons.sort((a, b) => {
      if (!a.expiresAt && !b.expiresAt) return 0;
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    });

    // Apply limit
    if (options.limit) {
      coupons = coupons.slice(0, options.limit);
    }

    // Add store relation
    return coupons.map(coupon => ({
      ...coupon,
      store: coupon.storeId ? this.stores.get(coupon.storeId) || null : null,
    }));
  }

  async getCouponById(id: string): Promise<CouponWithStore | undefined> {
    const coupon = this.coupons.get(id);
    if (!coupon) return undefined;

    return {
      ...coupon,
      store: coupon.storeId ? this.stores.get(coupon.storeId) || null : null,
    };
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const id = randomUUID();
    const coupon: Coupon = { ...insertCoupon, id, usageCount: 0 };
    this.coupons.set(id, coupon);
    return coupon;
  }

  async incrementCouponUsage(id: string): Promise<void> {
    const coupon = this.coupons.get(id);
    if (coupon) {
      this.coupons.set(id, { ...coupon, usageCount: coupon.usageCount + 1 });
    }
  }
}

export const storage = new MemStorage();
