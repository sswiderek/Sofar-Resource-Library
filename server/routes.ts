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
import { resourceFilterSchema, adminLoginSchema, feedbackSchema } from "@shared/schema";
import { processQuestion } from "./openai";
import { createResourceEmbeddings } from "./embeddings";
import { submitFeedbackToNotion } from "./feedback";
import { z } from 'zod';

// Schema for question validation
const questionSchema = z.object({
  question: z.string().min(3).max(500),
  stream: z.boolean().optional().default(false), // Optional streaming parameter
});

// Track when we last synced with Notion
let lastSyncTime: Date | null = null;

// Flag to track if resources need embedding update and if we're currently processing
let resourcesNeedEmbeddingUpdate = false;
let isGeneratingEmbeddings = false;

export async function registerRoutes(app: Express): Promise<Server> {
  // Add feedback API route
  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      // Add page and user agent automatically
      const feedbackData = {
        ...req.body,
        page: req.body.page || req.headers.referer,
        userAgent: req.body.userAgent || req.headers['user-agent'],
        timestamp: new Date()
      };
      
      const parseResult = feedbackSchema.safeParse(feedbackData);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid feedback data",
          errors: parseResult.error.errors
        });
      }
      
      // Submit the feedback to Notion
      await submitFeedbackToNotion(parseResult.data);
      
      // Return success response
      res.json({ 
        message: "Thank you for your feedback!",
        success: true
      });
    } catch (error) {
      log(`Error submitting feedback: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        message: "Failed to submit feedback",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  // put application routes here
  // prefix all routes with /api

  // Route to get resources based on filter criteria with pagination
  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      // Get all resources to check if we need to sync
      let allResources = await storage.getResources();
      
      // Trigger background sync with Notion if needed, but don't wait for it to complete
      // This allows faster initial page load
      if ((req.query.sync === 'true' || allResources.length === 0) && shouldSyncResources(lastSyncTime)) {
        // Fork a background process for sync so we can return resources immediately
        syncResourcesWithNotion().catch(err => {
          log(`Background sync error: ${err.message}`);
        });
        
        // On first load with no resources, wait briefly for initial data
        if (allResources.length === 0) {
          log("First load with no resources, waiting briefly for initial data...");
          await new Promise(resolve => setTimeout(resolve, 500));
          allResources = await storage.getResources();
        }
      }
      
      // Always trigger embedding generation in the background if needed
      // Users will still see resources while embeddings are being generated
      if (resourcesNeedEmbeddingUpdate && !isGeneratingEmbeddings) {
        updateResourceEmbeddings().catch(err => {
          log(`Background embedding generation error: ${err.message}`);
        });
      }
      
      // Parse and validate filter parameters
      const filter = {
        types: req.query.types ? (req.query.types as string).split(',') : [],
        products: req.query.products ? (req.query.products as string).split(',') : [],
        audiences: req.query.audiences ? (req.query.audiences as string).split(',') : [],
        messagingStages: req.query.messagingStages ? (req.query.messagingStages as string).split(',') : [],
        contentVisibility: req.query.contentVisibility ? (req.query.contentVisibility as string).split(',') : [],
        solutions: req.query.solutions ? (req.query.solutions as string).split(',') : [],
        search: req.query.search as string || '',
        sortBy: req.query.sortBy as 'popularity' | 'newest' | 'oldest' | undefined,
      };

      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;

      // Validate the filter using our schema
      const parseResult = resourceFilterSchema.safeParse(filter);
      
      if (!parseResult.success) {
        log(`Invalid filter parameters: ${JSON.stringify(parseResult.error.errors)}`);
        return res.status(400).json({ 
          message: "Invalid filter parameters",
          errors: parseResult.error.errors
        });
      }
      
      // Get total count and paginated resources
      const { resources, total } = await storage.getFilteredResourcesPaginated(parseResult.data, page, limit);
      
      // Log filter and result count
      log(`Filtered resources. Found ${total} matching resources, serving page ${page} with ${resources.length} resources`);
      
      // Return both resources and pagination metadata
      res.json({
        resources,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      log(`Error handling resources request: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return error status with message to help debugging
      return res.status(500).json({
        message: "Failed to load resources",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to get popular resources
  app.get("/api/resources/popular", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const popularResources = await storage.getPopularResources(limit);
      
      log(`Retrieved ${popularResources.length} popular resources`);
      res.json(popularResources);
    } catch (error) {
      log(`Error retrieving popular resources: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        message: "Failed to retrieve popular resources",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to track resource views
  app.post("/api/resources/:id/view", async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const updatedResource = await storage.incrementResourceViews(resourceId);
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      log(`Tracked view for resource ${resourceId}. New count: ${updatedResource.viewCount}`);
      res.json({ success: true, viewCount: updatedResource.viewCount });
    } catch (error) {
      log(`Error tracking resource view: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        message: "Failed to track resource view",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to track resource shares
  app.post("/api/resources/:id/share", async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const updatedResource = await storage.incrementResourceShares(resourceId);
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      log(`Tracked share for resource ${resourceId}. New count: ${updatedResource.shareCount}`);
      res.json({ success: true, shareCount: updatedResource.shareCount });
    } catch (error) {
      log(`Error tracking resource share: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        message: "Failed to track resource share",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to track resource downloads
  app.post("/api/resources/:id/download", async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const updatedResource = await storage.incrementResourceDownloads(resourceId);
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      log(`Tracked download for resource ${resourceId}. New count: ${updatedResource.downloadCount}`);
      res.json({ success: true, downloadCount: updatedResource.downloadCount });
    } catch (error) {
      log(`Error tracking resource download: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        message: "Failed to track resource download",
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
      // Extract solutions from the dedicated solution field
      const solutionsSet = new Set(resources.flatMap(r => r.solutions || []));
      
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
      
      const { question, stream } = parseResult.data;
      
      // Only wait for embeddings if needed for question answering
      if (resourcesNeedEmbeddingUpdate) {
        // Set a reasonable timeout limit to prevent excessive waiting
        const embeddingPromise = updateResourceEmbeddings();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Embedding generation timeout exceeded")), 15000);
        });
        
        try {
          // Wait for either embeddings to complete or timeout to occur
          await Promise.race([embeddingPromise, timeoutPromise]);
        } catch (error) {
          // Type-safe error handling
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          log(`Warning: ${errorMessage}, proceeding with available resources`);
          // Continue with existing resources even if embeddings aren't complete
        }
      }
      
      // Get all resources (no team filtering)
      const resources = await storage.getResources();
      
      // If streaming is requested, set up SSE response
      if (stream) {
        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Log the start of streaming
        log(`Starting streaming response for question: ${question.substring(0, 50)}...`);
        
        // Create a variable to track if the connection was closed early
        let connectionClosed = false;
        
        // Handle client disconnect
        req.on('close', () => {
          connectionClosed = true;
          log('Client closed connection before streaming completed');
        });
        
        // Start streaming chunks
        let fullAnswer = '';
        let relevantResourceIds: number[] = [];
        
        // Create a stream handler
        const streamHandler = (chunk: string, done: boolean) => {
          // Skip if connection was closed
          if (connectionClosed) return;
          
          if (done) {
            // Send the final event with complete data
            res.write(`event: done\ndata: ${JSON.stringify({ 
              answer: fullAnswer,
              relevantResourceIds
            })}\n\n`);
            
            // End the response
            res.end();
            
            log('Streaming completed successfully');
          } else {
            // Send the chunk
            res.write(`event: chunk\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
            
            // Accumulate the answer
            fullAnswer += chunk;
          }
        };
        
        try {
          // Process with streaming
          const result = await processQuestion(question, resources, streamHandler);
          
          // Store relevant resource IDs for final response
          relevantResourceIds = result.relevantResourceIds;
          
          // If we get here, the streaming has completed successfully
          if (!connectionClosed && !res.writableEnded) {
            log('Streaming completed, but response was not ended. Ensuring response is ended.');
            res.end();
          }
        } catch (error) {
          // Handle errors during streaming
          log(`Error during streaming: ${error instanceof Error ? error.message : String(error)}`);
          
          if (!connectionClosed && !res.writableEnded) {
            // Send error event to client
            res.write(`event: error\ndata: ${JSON.stringify({ 
              error: error instanceof Error ? error.message : String(error) 
            })}\n\n`);
            res.end();
          }
        }
      }
      // Otherwise, process normally and return full response
      else {
        // Process the question using our OpenAI utility
        const result = await processQuestion(question, resources);
        
        // Return normal JSON response
        res.json(result);
      }
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

// Continue with functions below

// Helper function to sync resources with Notion - optimized to track changes
async function syncResourcesWithNotion() {
  try {
    log("Syncing resources with Notion...");
    
    // Fetch resources from Notion
    const notionResources = await fetchResourcesFromNotion();
    log(`Fetched ${notionResources.length} resources from Notion`);
    
    // HARD RESET: Delete all existing resources and recreate them from Notion
    // This ensures we don't have any stale data
    const existingResources = await storage.getResources();
    
    log(`Performing complete refresh: Deleting all ${existingResources.length} existing resources`);
    
    // Delete all resources with our new method that also resets the ID counter
    await storage.deleteAllResources();
    
    // Resources were deleted, mark for update
    let resourcesUpdated = true;
    
    // Add all resources from Notion as new
    for (const resource of notionResources) {
      // Create as new resource
      await storage.createResource(resource);
      log(`Created new resource: ${resource.name}`);
    }
    
    // Always update embeddings after a full refresh
    resourcesNeedEmbeddingUpdate = true;
    
    // Always mark for embedding update, but don't block initial page load
    log(`Resources were updated. Marking for embedding update.`);
    
    // Start the embedding process asynchronously without awaiting
    if (!isGeneratingEmbeddings) {
      updateResourceEmbeddings().catch(err => {
        log(`Background embedding generation error: ${err.message}`);
      });
    }
    
    // Update last sync time
    lastSyncTime = new Date();
    log("Resources sync completed with full refresh");
  } catch (error) {
    log(`Error syncing resources: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Helper function to update resource embeddings only when needed
async function updateResourceEmbeddings() {
  // If we're already generating embeddings or don't need to update, skip
  if (!resourcesNeedEmbeddingUpdate || isGeneratingEmbeddings) {
    return;
  }
  
  try {
    // Set flag to prevent multiple concurrent generations
    isGeneratingEmbeddings = true;
    
    // Refresh resources after updates
    const updatedResources = await storage.getResources();
    
    log(`Creating embeddings for ${updatedResources.length} resources...`);
    
    // Create embeddings for all resources
    await createResourceEmbeddings(updatedResources);
    
    // Reset the flag after completion
    resourcesNeedEmbeddingUpdate = false;
    
    log("Resource embeddings updated");
  } catch (error) {
    log(`Error creating embeddings: ${error instanceof Error ? error.message : String(error)}`);
    // Don't reset the resourcesNeedEmbeddingUpdate flag on error, so we'll try again later
  } finally {
    // Always reset the generation flag when done
    isGeneratingEmbeddings = false;
  }
}