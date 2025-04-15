import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";

// Extend express-session
declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}
import { storage } from "./storage";
import { fetchResourcesFromNotion, shouldSyncResources } from "./notion";
import { log } from "./vite";
import { resourceFilterSchema, adminLoginSchema } from "@shared/schema";
import { processQuestion } from "./openai";
import { createResourceEmbeddings } from "./embeddings";
import { z } from 'zod';

// Schema for question validation
const questionSchema = z.object({
  question: z.string().min(3).max(500),
});

// Track when we last synced with Notion
let lastSyncTime: Date | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Route to get resources based on filter criteria
  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      // Try to sync with Notion, but don't fail if we can't
      if (shouldSyncResources(lastSyncTime)) {
        await syncResourcesWithNotion();
      }
      
      // Parse and validate filter parameters
      const filter = {
        types: req.query.types ? (req.query.types as string).split(',') : [],
        products: req.query.products ? (req.query.products as string).split(',') : [],
        audiences: req.query.audiences ? (req.query.audiences as string).split(',') : [],
        messagingStages: req.query.messagingStages ? (req.query.messagingStages as string).split(',') : [],
        contentVisibility: req.query.contentVisibility ? (req.query.contentVisibility as string).split(',') : [],
        search: req.query.search as string || '',
      };

      // Validate the filter using our schema
      const parseResult = resourceFilterSchema.safeParse(filter);
      
      if (!parseResult.success) {
        log(`Invalid filter parameters: ${JSON.stringify(parseResult.error.errors)}`);
        return res.status(400).json({ 
          message: "Invalid filter parameters",
          errors: parseResult.error.errors
        });
      }
      
      const resources = await storage.getFilteredResources(parseResult.data);
      
      // Log filter and result count
      log(`Filtered resources. Found ${resources.length} matching resources`);
      
      res.json(resources);
    } catch (error) {
      log(`Error handling resources request: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return error status with message to help debugging
      return res.status(500).json({
        message: "Failed to load resources",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to get metadata from resources
  app.get("/api/resources/metadata", async (req: Request, res: Response) => {
    try {
      // Get all resources
      const resources = await storage.getResources();
      
      log(`Metadata endpoint: Got ${resources.length} resources`);
      
      if (!resources || resources.length === 0) {
        log('No resources found for metadata');
        return res.json({
          types: [],
          products: [],
          audiences: [],
          messagingStages: [],
          contentVisibility: [],
          solutions: [],
          lastSynced: lastSyncTime
        });
      }
      
      // Extract unique values for each category
      // Using Array.from instead of spread operator to address TypeScript compatibility
      const typesSet = new Set(resources.map(r => r.type));
      const productsSet = new Set(resources.flatMap(r => r.product));
      const audiencesSet = new Set(resources.flatMap(r => r.audience));
      const messagingStagesSet = new Set(resources.map(r => r.messagingStage));
      const contentVisibilitySet = new Set(resources.map(r => r.contentVisibility || "both"));
      // Extract solution values from products for now since they're closely related
      const solutionsSet = new Set(resources.flatMap(r => r.product.filter(p => 
        p.includes('Wayfinder') || p.includes('Spotter') || p.includes('Smart Mooring')
      )));
      
      const types = Array.from(typesSet).filter(Boolean);  // Remove empty values
      const products = Array.from(productsSet).filter(Boolean);
      const audiences = Array.from(audiencesSet).filter(Boolean);
      const messagingStages = Array.from(messagingStagesSet).filter(Boolean);
      const contentVisibility = Array.from(contentVisibilitySet).filter(Boolean);
      const solutions = Array.from(solutionsSet).filter(Boolean);

      log(`Metadata extracted: 
        - ${types.length} types
        - ${products.length} products
        - ${audiences.length} audiences
        - ${messagingStages.length} stages
        - ${contentVisibility.length} visibility options
        - ${solutions.length} solutions`);
      
      res.json({
        types,
        products,
        audiences,
        messagingStages,
        contentVisibility,
        solutions,
        lastSynced: lastSyncTime
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch resource metadata",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to manually sync resources with Notion
  app.post("/api/sync", async (_req: Request, res: Response) => {
    try {
      await syncResourcesWithNotion();
      res.json({ message: "Resources synced successfully", lastSynced: lastSyncTime });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to sync resources",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin login route (keeping for backward compatibility)
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const parseResult = adminLoginSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid login data",
          errors: parseResult.error.errors
        });
      }
      
      const { username, password } = parseResult.data;
      
      // Simple authentication logic for demo purposes
      if (username === "admin" && password === "admin123") {
        // Store admin status in session
        req.session.isAdmin = true;
        
        return res.json({ message: "Admin login successful" });
      }
      
      return res.status(401).json({ message: "Invalid username or password" });
    } catch (error) {
      res.status(500).json({ 
        message: "Login error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin logout route
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Route to check admin authentication status
  app.get("/api/admin/check-auth", (req: Request, res: Response) => {
    if (req.session.isAdmin) {
      return res.json({ isAdmin: true });
    }
    res.json({ isAdmin: false });
  });

  // Middleware to check if user is admin
  const checkAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Ask questions and get AI-powered responses
  app.post("/api/ask", async (req: Request, res: Response) => {
    try {
      const parseResult = questionSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid question format",
          errors: parseResult.error.errors
        });
      }
      
      const { question } = parseResult.data;
      
      // Get all resources for now (no team filtering)
      const resources = await storage.getResources();
      
      // Process the question using our OpenAI utility
      const result = await processQuestion(question, resources);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Error processing question",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create HTTP server and return it
  const server = createServer(app);
  return server;
}

// Helper function to sync resources with Notion
async function syncResourcesWithNotion() {
  try {
    log("Syncing resources with Notion...");
    
    // Fetch resources from Notion
    const notionResources = await fetchResourcesFromNotion();
    log(`Fetched ${notionResources.length} resources from Notion`);
    
    // Get existing resources from storage
    const existingResources = await storage.getResources();
    
    // Process each resource from Notion
    for (const resource of notionResources) {
      // Check if resource already exists (by Notion ID)
      const existingResource = await storage.getResourceByNotionId(resource.notionId);
      
      if (existingResource) {
        // Update existing resource
        await storage.updateResource(existingResource.id, resource);
        log(`Updated resource: ${resource.name}`);
      } else {
        // Create new resource
        await storage.createResource(resource);
        log(`Created new resource: ${resource.name}`);
      }
    }
    
    // Update all resources embeddings for search (could be optimized to only update changed resources)
    log(`Creating embeddings for ${notionResources.length} resources...`);
    
    // Refresh resources after updates
    const updatedResources = await storage.getResources();
    
    // Create embeddings for all resources
    await createResourceEmbeddings(updatedResources);
    
    // Update last sync time
    lastSyncTime = new Date();
    log("Resources sync completed");
  } catch (error) {
    log(`Error syncing resources: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}