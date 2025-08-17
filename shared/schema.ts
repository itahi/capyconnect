import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  postCount: integer("post_count").default(0),
  type: text("type").notNull(), // 'service', 'product', 'news', 'job'
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  location: text("location"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrls: text("image_urls").array(), // Array of up to 3 image URLs
  price: integer("price"), // in cents, optional for services/jobs
  whatsappNumber: text("whatsapp_number"),
  externalLink: text("external_link"),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  contactCount: integer("contact_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  categoryId: varchar("category_id").references(() => categories.id),
  userId: varchar("user_id").references(() => users.id),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  postCount: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  viewCount: true,
  contactCount: true,
  createdAt: true,
});

export type Category = typeof categories.$inferSelect;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;

// Extended types for API responses
export type PostWithRelations = Post & {
  category: Category | null;
  user: User | null;
};
