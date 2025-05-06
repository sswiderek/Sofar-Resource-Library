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
  solutions: text("solutions").array(),  // Solution field from Notion
  audience: text("audience").array().notNull(),
  teamRelevancy: text("team_relevancy").array().notNull(), // Keeping for backwards compatibility
  messagingStage: text("messaging_stage").notNull(),
  contentVisibility: text("content_visibility").notNull().default("both"), // "internal", "external", or "both"
  newHire: text("new_hire"),  // "Yes" or "No" from Notion "New Hire?" property
  date: text("date").notNull(),
  url: text("url").notNull(),
  description: text("description").notNull(),
  detailedDescription: text("detailed_description"),
  notionId: text("notion_id").notNull().unique(),
  lastSynced: timestamp("last_synced").notNull(),
  // Usage tracking fields
  viewCount: integer("view_count").default(0).notNull(),
  shareCount: integer("share_count").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
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
  newHireOptions: z.array(z.string()).optional(),   // Maps to "New Hire?" in Notion (Yes/No)
  search: z.string().optional(),
  sortBy: z.enum(["relevance", "popularity", "newest", "oldest"]).optional(),
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

// Feedback schema for user feedback submissions
export const feedbackSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  feedback: z.string().min(3, { message: "Feedback must be at least 3 characters" }),
  feedbackType: z.enum(["bug", "suggestion", "other"]).default("other"),
  email: z.string().email().optional(),
  page: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date().optional(),
});

export type Feedback = z.infer<typeof feedbackSchema>;