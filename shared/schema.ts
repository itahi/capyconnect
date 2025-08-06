import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  dealCount: integer("deal_count").default(0),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url").notNull(),
  isVerified: boolean("is_verified").default(true),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  originalPrice: integer("original_price").notNull(), // in cents
  salePrice: integer("sale_price").notNull(), // in cents
  discountPercentage: integer("discount_percentage").notNull(),
  dealUrl: text("deal_url").notNull(),
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").default(0),
  isHot: boolean("is_hot").default(false),
  isVerified: boolean("is_verified").default(true),
  categoryId: varchar("category_id").references(() => categories.id),
  storeId: varchar("store_id").references(() => stores.id),
});

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: integer("discount_value").notNull(),
  minPurchase: integer("min_purchase"), // in cents
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  storeId: varchar("store_id").references(() => stores.id),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  dealCount: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  usageCount: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
});

export type Category = typeof categories.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

// Extended types for API responses
export type DealWithRelations = Deal & {
  category: Category | null;
  store: Store | null;
};

export type CouponWithStore = Coupon & {
  store: Store | null;
};
