import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchResourcesFromNotion, shouldSyncResources } from "./notion";
import { log } from "./vite";
import { resourceFilterSchema } from "@shared/schema";

// Track when we last synced with Notion
let lastSyncTime: Date | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Route to get all partners
  app.get("/api/partners", async (_req: Request, res: Response) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch partners",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to get resources based on filter criteria
  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      // Check if we need to sync with Notion
      if (shouldSyncResources(lastSyncTime)) {
        await syncResourcesWithNotion();
      }

      // Get partner ID from query parameter
      const partnerId = req.query.partnerId as string;
      
      if (!partnerId) {
        return res.status(400).json({ message: "Partner ID is required" });
      }

      // Parse and validate filter parameters
      const filter = {
        partnerId,
        types: req.query.types ? (req.query.types as string).split(',') : undefined,
        products: req.query.products ? (req.query.products as string).split(',') : undefined,
        audiences: req.query.audiences ? (req.query.audiences as string).split(',') : undefined,
        messagingStages: req.query.messagingStages ? (req.query.messagingStages as string).split(',') : undefined,
        search: req.query.search as string || undefined,
      };

      // Validate the filter using our schema
      const parseResult = resourceFilterSchema.safeParse(filter);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid filter parameters",
          errors: parseResult.error.errors
        });
      }
      
      const resources = await storage.getFilteredResources(parseResult.data);
      
      // Log filter and result count
      log(`Filtered resources for partner ${partnerId}. Found ${resources.length} matching resources`);
      
      res.json(resources);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch resources",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to get resource metadata (unique values for filters)
  app.get("/api/resources/metadata", async (_req: Request, res: Response) => {
    try {
      // Check if we need to sync with Notion
      if (shouldSyncResources(lastSyncTime)) {
        await syncResourcesWithNotion();
      }

      const resources = await storage.getResources();
      
      // Extract unique values for each filter category
      const types = [...new Set(resources.map(r => r.type))];
      const products = [...new Set(resources.flatMap(r => r.product))];
      const audiences = [...new Set(resources.flatMap(r => r.audience))];
      const messagingStages = [...new Set(resources.map(r => r.messagingStage))];
      
      res.json({
        types,
        products,
        audiences,
        messagingStages,
        lastSynced: lastSyncTime
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch resource metadata",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Force sync with Notion
  app.post("/api/sync", async (_req: Request, res: Response) => {
    try {
      await syncResourcesWithNotion();
      res.json({ 
        success: true, 
        message: "Successfully synced with Notion",
        lastSynced: lastSyncTime
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to sync with Notion",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to sync resources with Notion
async function syncResourcesWithNotion() {
  try {
    log("Starting Notion sync...");
    
    // Fetch resources from Notion
    const notionResources = await fetchResourcesFromNotion();
    
    // Get all existing resources
    const existingResources = await storage.getResources();
    
    // Create or update resources
    for (const resource of notionResources) {
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
    
    // Remove resources that no longer exist in Notion
    const notionIds = new Set(notionResources.map(r => r.notionId));
    for (const existingResource of existingResources) {
      if (!notionIds.has(existingResource.notionId)) {
        await storage.deleteResource(existingResource.id);
        log(`Deleted resource: ${existingResource.name}`);
      }
    }
    
    // Update last sync time
    lastSyncTime = new Date();
    log(`Sync completed at ${lastSyncTime.toISOString()}`);
  } catch (error) {
    log(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
