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
      // Try to sync with Notion, but don't fail if we can't
      if (shouldSyncResources(lastSyncTime)) {
        await syncResourcesWithNotion();
      }

      // Get partner ID from query parameter
      const partnerId = req.query.partnerId as string;
      
      // Add logging for debugging
      log(`GET /api/resources partnerId query parameter: ${partnerId}`);
      
      if (!partnerId) {
        log(`Error: Partner ID is required but was not provided`);
        return res.status(400).json({ message: "Partner ID is required" });
      }

      // Parse and validate filter parameters
      const filter = {
        partnerId,
        types: req.query.types ? (req.query.types as string).split(',') : [],
        products: req.query.products ? (req.query.products as string).split(',') : [],
        audiences: req.query.audiences ? (req.query.audiences as string).split(',') : [],
        messagingStages: req.query.messagingStages ? (req.query.messagingStages as string).split(',') : [],
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
      log(`Filtered resources for partner ${partnerId}. Found ${resources.length} matching resources`);
      
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

  // Route to get resource metadata (unique values for filters)
  app.get("/api/resources/metadata", async (_req: Request, res: Response) => {
    try {
      // Try to sync with Notion, but don't fail if we can't
      if (shouldSyncResources(lastSyncTime)) {
        await syncResourcesWithNotion();
      }

      const resources = await storage.getResources();
      
      // Extract unique values for each filter category directly without using Set
      const typesSet = new Set<string>();
      const productsSet = new Set<string>();
      const audiencesSet = new Set<string>();
      const messagingStagesSet = new Set<string>();
      
      // Manually populate the sets
      resources.forEach(r => {
        typesSet.add(r.type);
        r.product.forEach(p => productsSet.add(p));
        r.audience.forEach(a => audiencesSet.add(a));
        messagingStagesSet.add(r.messagingStage);
      });
      
      // Convert sets to arrays
      const types = Array.from(typesSet);
      const products = Array.from(productsSet);
      const audiences = Array.from(audiencesSet);
      const messagingStages = Array.from(messagingStagesSet);
      
      res.json({
        types,
        products,
        audiences,
        messagingStages,
        lastSynced: lastSyncTime
      });
    } catch (error) {
      log(`Error handling metadata request: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return empty metadata instead of error to avoid breaking the UI
      res.json({
        types: [],
        products: [],
        audiences: [],
        messagingStages: [],
        lastSynced: lastSyncTime || new Date()
      });
    }
  });

  // Force sync with Notion
  app.post("/api/sync", async (_req: Request, res: Response) => {
    try {
      const success = await syncResourcesWithNotion();
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Successfully synced with Notion",
          lastSynced: lastSyncTime
        });
      } else {
        // We're using mock data if API key isn't available
        if (!process.env.NOTION_API_KEY) {
          res.json({ 
            success: true, 
            message: "Using demonstration data (No Notion API key available)",
            lastSynced: lastSyncTime
          });
        } else {
          res.status(500).json({ 
            success: false,
            message: "Failed to sync with Notion",
            error: "Check server logs for details"
          });
        }
      }
    } catch (error) {
      log(`Error during manual sync: ${error instanceof Error ? error.message : String(error)}`);
      
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
    
    // Fetch resources from Notion (or mock data if Notion API is not available)
    const notionResources = await fetchResourcesFromNotion();
    
    // Get all existing resources
    const existingResources = await storage.getResources();
    
    // Clear existing resources first when using mock data to ensure latest table data
    if (!process.env.NOTION_API_KEY) {
      for (const existingResource of existingResources) {
        await storage.deleteResource(existingResource.id);
        log(`Removed old resource: ${existingResource.name}`);
      }
    }
    
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
    
    // Only remove resources if we have actual resources from an API call
    // (we don't want to clear the database if we're just using fallback data)
    if (process.env.NOTION_API_KEY) {
      // Create a map of notionIds for quick lookup
      const notionIdMap = new Map<string, boolean>();
      notionResources.forEach(r => notionIdMap.set(r.notionId, true));
      
      // Remove resources that no longer exist in Notion
      for (const existingResource of existingResources) {
        if (!notionIdMap.has(existingResource.notionId)) {
          await storage.deleteResource(existingResource.id);
          log(`Deleted resource: ${existingResource.name}`);
        }
      }
    }
    
    // Update last sync time
    lastSyncTime = new Date();
    log(`Sync completed at ${lastSyncTime.toISOString()}`);
    
    return true;
  } catch (error) {
    log(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    // Don't throw the error - this allows the app to continue functioning with mock data
    return false;
  }
}
