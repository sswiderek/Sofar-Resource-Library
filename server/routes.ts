import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";

// Extend express-session
declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    authorizedTeams?: string[];
  }
}
import { storage } from "./storage";
import { fetchResourcesFromNotion, shouldSyncResources } from "./notion";
import { log } from "./vite";
import { resourceFilterSchema, adminLoginSchema, updateTeamPasswordSchema, teamAccessSchema } from "@shared/schema";
import { processQuestion } from "./openai";
import { createResourceEmbeddings } from "./embeddings";
import { z } from 'zod';

// Schema for question validation
const questionSchema = z.object({
  question: z.string().min(3).max(500),
  teamId: z.string().nullable(),
});

// Track when we last synced with Notion
let lastSyncTime: Date | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Route to get all teams
  app.get("/api/teams", async (_req: Request, res: Response) => {
    try {
      const teams = await storage.getPartners(); // Note: still using getPartners() method until storage is updated
      res.json(teams);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch teams",
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

      // Get team ID from query parameter
      const teamId = req.query.teamId as string;
      
      // Add logging for debugging
      log(`GET /api/resources teamId query parameter: ${teamId}`);
      
      if (!teamId) {
        log(`Error: Team ID is required but was not provided`);
        return res.status(400).json({ message: "Team ID is required" });
      }

      // Parse and validate filter parameters
      const filter = {
        teamId,
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
      log(`Filtered resources for team ${teamId}. Found ${resources.length} matching resources`);
      
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
  app.get("/api/resources/metadata", async (req: Request, res: Response) => {
    try {
      // Try to sync with Notion, but don't fail if we can't
      if (shouldSyncResources(lastSyncTime)) {
        await syncResourcesWithNotion();
      }

      // Check if a team filter is applied
      const teamId = req.query.teamId as string | undefined;
      
      // If no team is specified, return empty metadata
      if (!teamId) {
        return res.json({
          types: [],
          products: [],
          audiences: [],
          messagingStages: [],
          contentVisibility: [],
          lastSynced: lastSyncTime,
          teamFiltered: false
        });
      }
      
      // Get team details
      const team = await storage.getPartnerBySlug(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Apply team filter to get only resources relevant to this team
      const resources = await storage.getFilteredResources({ 
        teamId
      });
      
      log(`Found ${resources.length} resources for team ${teamId} for metadata`);
      
      // Extract unique values for each filter category only from resources relevant to this partner
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
      
      // Get content visibility values
      const contentVisibilitySet = new Set<string>();
      resources.forEach(r => {
        if (r.contentVisibility) {
          contentVisibilitySet.add(r.contentVisibility);
        }
      });
      const contentVisibility = Array.from(contentVisibilitySet);
      
      res.json({
        types,
        products,
        audiences,
        messagingStages,
        contentVisibility,
        lastSynced: lastSyncTime,
        teamFiltered: !!teamId
      });
    } catch (error) {
      log(`Error handling metadata request: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return empty metadata instead of error to avoid breaking the UI
      res.json({
        types: [],
        products: [],
        audiences: [],
        messagingStages: [],
        contentVisibility: [],
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

  // Admin authentication routes
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const parseResult = adminLoginSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input",
          errors: parseResult.error.errors
        });
      }

      // Get admin credentials from environment variables
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin";
      
      // Check credentials
      if (req.body.username === adminUsername && req.body.password === adminPassword) {
        // Set admin session flag
        if (req.session) {
          req.session.isAdmin = true;
        }
        
        return res.json({ success: true });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      log(`Error in admin login: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ 
        message: "Authentication failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.isAdmin = false;
    }
    res.json({ success: true });
  });
  
  // Check admin authentication status
  app.get("/api/admin/check-auth", (req: Request, res: Response) => {
    if (req.session && req.session.isAdmin) {
      res.json({ isAuthenticated: true });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // Admin middleware to check authentication
  const checkAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.isAdmin) {
      next();
    } else {
      res.status(401).json({ message: "Admin authentication required" });
    }
  };

  // Admin route to update team passwords
  app.patch("/api/admin/teams/:id/password", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      // Validate password
      const parseResult = updateTeamPasswordSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid password",
          errors: parseResult.error.errors
        });
      }

      // Get team ID from route params
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      // Update the password
      const team = await storage.updatePartnerPassword(teamId, parseResult.data);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Return success without exposing the password
      res.json({ 
        id: team.id,
        name: team.name,
        slug: team.slug,
        lastPasswordUpdate: team.lastPasswordUpdate,
        hasPassword: !!team.password
      });
    } catch (error) {
      log(`Error updating team password: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ 
        message: "Failed to update password",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Team access verification route
  app.post("/api/team-access", async (req: Request, res: Response) => {
    try {
      // Validate request
      const parseResult = teamAccessSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input",
          errors: parseResult.error.errors
        });
      }

      // Verify team password
      const { teamId, password } = parseResult.data;
      const isValid = await storage.verifyPartnerPassword(teamId, password);
      
      if (isValid) {
        // Store team access in session
        if (req.session) {
          if (!req.session.authorizedTeams) {
            req.session.authorizedTeams = [];
          }
          
          if (!req.session.authorizedTeams.includes(teamId)) {
            req.session.authorizedTeams.push(teamId);
          }
        }
        
        return res.json({ success: true });
      } else {
        return res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      log(`Error verifying team access: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ 
        message: "Verification failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Check team access
  app.get("/api/team-access/:teamId", (req: Request, res: Response) => {
    const teamId = req.params.teamId;
    
    // Check if team access is already authorized in session
    if (req.session && req.session.authorizedTeams && req.session.authorizedTeams.includes(teamId)) {
      return res.json({ authorized: true });
    } else {
      return res.json({ authorized: false });
    }
  });

  // Process a question using AI
  app.post("/api/ask", async (req: Request, res: Response) => {
    try {
      // Validate the question
      const parseResult = questionSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input",
          errors: parseResult.error.errors
        });
      }

      const { question, teamId } = parseResult.data;
      
      // Verify the team exists
      if (teamId) {
        const team = await storage.getPartnerBySlug(teamId);
        if (!team) {
          return res.status(404).json({ message: "Team not found" });
        }
      }

      // Get relevant resources (either for specific team or all resources)
      let resources;
      if (teamId) {
        resources = await storage.getFilteredResources({ teamId });
        log(`Available resources for team ${teamId}:`);
        resources.forEach(resource => {
          log(`- ${resource.id}: ${resource.name} (${resource.type})`);
        });
      } else {
        resources = await storage.getResources();
      }

      log(`Processing question: "${question}" with ${resources.length} resources`);
      
      // Create a timer to measure performance
      const startTime = Date.now();
      
      // Process the question with OpenAI (now uses embeddings for relevance matching)
      const result = await processQuestion(question, resources);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      log(`Question processed in ${processingTime}ms with ${result.relevantResourceIds.length} relevant resources found`);
      
      // Return the answer along with relevant resource IDs
      res.json(result);
    } catch (error) {
      log(`Error processing question: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ 
        message: "Failed to process your question",
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
