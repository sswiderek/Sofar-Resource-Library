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
  teamRelevancy: text("team_relevancy").array().notNull(), // Keeping for backwards compatibility
  messagingStage: text("messaging_stage").notNull(),
  contentVisibility: text("content_visibility").notNull().default("both"), // "internal", "external", or "both"
  date: text("date").notNull(),
  url: text("url").notNull(),
  description: text("description").notNull(),
  detailedDescription: text("detailed_description"),
  notionId: text("notion_id").notNull().unique(),
  lastSynced: timestamp("last_synced").notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

// Team schema (keeping for backward compatibility)
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  password: text("password").default("").notNull(),
  lastPasswordUpdate: timestamp("last_password_update"),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
});

export const updateTeamPasswordSchema = z.object({
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type UpdateTeamPassword = z.infer<typeof updateTeamPasswordSchema>;

// Updated schema for the resource filtering (no team dependency)
export const resourceFilterSchema = z.object({
  types: z.array(z.string()).optional(),            // Maps to "Content Type" in Notion
  products: z.array(z.string()).optional(),         // Maps to "Smart Mooring Sensor(s)" in Notion
  audiences: z.array(z.string()).optional(),        // Maps to "Market Segment(s)" in Notion
  messagingStages: z.array(z.string()).optional(),  // Maps to "Stage in Buyer's Journey" in Notion
  contentVisibility: z.array(z.string()).optional(), // Maps to "Internal Use Only?" in Notion
  solutions: z.array(z.string()).optional(),        // Major product groupings (Wayfinder, Spotter, Smart Mooring)
  search: z.string().optional(),
});

export type ResourceFilter = z.infer<typeof resourceFilterSchema>;

// Authentication schemas (keeping for backward compatibility)
export const adminLoginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const teamAccessSchema = z.object({
  teamId: z.string().min(1, { message: "Team ID is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type TeamAccess = z.infer<typeof teamAccessSchema>;