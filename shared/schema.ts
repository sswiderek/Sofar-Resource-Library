import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the user schema (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Resource schema definition
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  product: text("product").array().notNull(),
  audience: text("audience").array().notNull(),
  partnerRelevancy: text("partner_relevancy").array().notNull(),
  messagingStage: text("messaging_stage").notNull(),
  date: text("date").notNull(),
  url: text("url").notNull(),
  description: text("description").notNull(),
  notionId: text("notion_id").notNull().unique(),
  lastSynced: timestamp("last_synced").notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

// Partner schema
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  password: text("password").default("").notNull(),
  lastPasswordUpdate: timestamp("last_password_update"),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
});

export const updatePartnerPasswordSchema = z.object({
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type UpdatePartnerPassword = z.infer<typeof updatePartnerPasswordSchema>;

// Define a schema for the resource filtering
export const resourceFilterSchema = z.object({
  partnerId: z.string(),
  types: z.array(z.string()).optional(),
  products: z.array(z.string()).optional(),
  audiences: z.array(z.string()).optional(),
  messagingStages: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export type ResourceFilter = z.infer<typeof resourceFilterSchema>;

// Authentication schemas
export const adminLoginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const partnerAccessSchema = z.object({
  partnerId: z.string().min(1, { message: "Partner ID is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type PartnerAccess = z.infer<typeof partnerAccessSchema>;
