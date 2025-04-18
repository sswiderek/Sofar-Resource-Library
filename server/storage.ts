import path from "path";
import fs from "fs";
import session from "express-session";
import MemoryStore from "memorystore";
import {
  User,
  InsertUser,
  Resource,
  InsertResource,
  Team, 
  InsertTeam,
  ResourceFilter,
  UpdateTeamPassword
} from "@shared/schema";

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods (keeping existing ones)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Resource methods
  getResources(): Promise<Resource[]>;
  getResourceById(id: number): Promise<Resource | undefined>;
  getResourceByNotionId(notionId: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  deleteAllResources(): Promise<boolean>;
  getFilteredResources(filter: ResourceFilter): Promise<Resource[]>;
  getFilteredResourcesPaginated(filter: ResourceFilter, page: number, limit: number): Promise<{resources: Resource[], total: number}>;
  
  // Resource usage tracking methods
  incrementResourceViews(id: number): Promise<Resource | undefined>;
  incrementResourceShares(id: number): Promise<Resource | undefined>;
  incrementResourceDownloads(id: number): Promise<Resource | undefined>;
  getPopularResources(limit?: number): Promise<Resource[]>;
  
  // Partner methods (keeping for backward compatibility)
  getPartners(): Promise<Team[]>;
  getPartnerBySlug(slug: string): Promise<Team | undefined>;
  getPartnerById(id: number): Promise<Team | undefined>;
  createPartner(partner: InsertTeam): Promise<Team>;
  updatePartnerPassword(id: number, passwordData: UpdateTeamPassword): Promise<Team | undefined>;
  verifyPartnerPassword(slug: string, password: string): Promise<boolean>;
  deletePartner(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resources: Map<number, Resource>;
  private partners: Map<number, Team>;
  private resourceUsageStats: Map<number, { viewCount: number, shareCount: number, downloadCount: number }>;
  currentUserId: number;
  currentResourceId: number;
  currentPartnerId: number;
  sessionStore: session.Store;

  // Path for storing data files
  private partnersFilePath: string = path.join(process.cwd(), 'partners-data.json');
  // Store resource stats in a stable, persistent location that survives deployments
  private resourceStatsFilePath: string = path.resolve(process.env.PERSISTENT_STORAGE_DIR || process.cwd(), 'resource-stats.json');
  // Legacy path for backward compatibility
  private legacyResourceStatsFilePath: string = path.join(process.cwd(), 'resource-stats.json');

  constructor() {
    this.users = new Map();
    this.resources = new Map();
    this.partners = new Map();
    this.resourceUsageStats = new Map();
    this.currentUserId = 1;
    this.currentResourceId = 1;
    this.currentPartnerId = 1;

    // Create a memory store for sessions
    const MemoryStoreFactory = MemoryStore(session);
    this.sessionStore = new MemoryStoreFactory({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Initialize partners from file
    this.initializePartners();
    
    console.log("Setting up resource stats tracking with persistence...");
    
    // Check if legacy stats file exists and migrate if needed
    this.migrateStatsIfNeeded();
    
    // Make sure the primary resource-stats.json exists
    if (!fs.existsSync(this.resourceStatsFilePath)) {
      console.log(`Creating initial empty resource stats file at: ${this.resourceStatsFilePath}`);
      try {
        // Create directory if it doesn't exist
        const dir = path.dirname(this.resourceStatsFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
        
        fs.writeFileSync(this.resourceStatsFilePath, JSON.stringify([], null, 2));
      } catch (error) {
        console.error(`Error creating resource stats file: ${error}`);
      }
    }
    
    // Initialize resource stats from file
    // This must be done after resources are loaded (happens in the getResources call)
    this.initializeResourceStats();
  }

  // Helper to save partners to JSON file
  private savePartnersToFile() {
    try {
      const partnersArray = Array.from(this.partners.values()).map(partner => ({
        ...partner,
        lastPasswordUpdate: partner.lastPasswordUpdate?.toISOString() || null
      }));

      const data = {
        partners: partnersArray,
        currentPartnerId: this.currentPartnerId
      };

      fs.writeFileSync(this.partnersFilePath, JSON.stringify(data, null, 2));
      console.log("Partners data saved to file");
    } catch (error) {
      console.error("Error saving partners data to file:", error);
    }
  }

  // Helper to load partners from JSON file
  private loadPartnersFromFile() {
    try {
      if (!fs.existsSync(this.partnersFilePath)) {
        console.log("Partners file doesn't exist yet");
        return null;
      }

      const fileData = fs.readFileSync(this.partnersFilePath, 'utf8');
      
      // Define the structure of the stored data
      interface StoredData {
        partners: Array<Team & { lastPasswordUpdate: string | null }>;
        currentPartnerId: number;
      }

      const data = JSON.parse(fileData) as StoredData;

      // Parse dates from strings
      const partners = data.partners.map(partner => ({
        ...partner,
        lastPasswordUpdate: partner.lastPasswordUpdate ? new Date(partner.lastPasswordUpdate) : null
      }));

      console.log(`Loaded ${partners.length} partners from file`);
      return {
        partners,
        currentPartnerId: data.currentPartnerId
      };
    } catch (error) {
      console.error("Error loading partners data from file:", error);
      return null;
    }
  }

  // Initialize partners from file or create a default if none exists
  private initializePartners() {
    const data = this.loadPartnersFromFile();

    if (data) {
      // Use loaded data
      this.currentPartnerId = data.currentPartnerId;
      
      // Populate the Map
      data.partners.forEach(partner => {
        this.partners.set(partner.id, partner);
      });
    } else {
      // Create a default partner
      const defaultPartner: Team = {
        id: 1,
        name: "PME",
        slug: "pme",
        password: "pme123",
        lastPasswordUpdate: new Date()
      };

      this.partners.set(defaultPartner.id, defaultPartner);
      this.currentPartnerId = 2;
      this.savePartnersToFile();
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getResourceByNotionId(notionId: string): Promise<Resource | undefined> {
    for (const resource of this.resources.values()) {
      if (resource.notionId === notionId) {
        return resource;
      }
    }
    return undefined;
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.currentResourceId++;
    const resource: Resource = { ...insertResource, id };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return undefined;

    const updatedResource = { ...existingResource, ...resource };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }
  
  async deleteAllResources(): Promise<boolean> {
    this.resources.clear();
    this.currentResourceId = 1; // Reset ID counter
    console.log("Deleted all resources and reset ID counter");
    return true;
  }

  // Get filtered resources with the options to paginate
  async getFilteredResourcesPaginated(
    filter: ResourceFilter,
    page: number = 1,
    limit: number = 30
  ): Promise<{resources: Resource[], total: number}> {
    // Get all filtered resources first
    const allFilteredResources = await this.getFilteredResources(filter);
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResources = allFilteredResources.slice(startIndex, endIndex);
    
    return {
      resources: paginatedResources,
      total: allFilteredResources.length
    };
  }

  // Keep the existing implementation for non-paginated filtering
  async getFilteredResources(filter: ResourceFilter): Promise<Resource[]> {
    console.log(`Filtering resources with filter:`, JSON.stringify(filter, null, 2));
    
    // Hard-coded list of resource names to exclude (temporarily while waiting for Notion to update)
    const excludedResources = [
      "Spotter Spec Sheet (Temperature Sensor)",
      "Spotter Spec Sheet (Pressure Sensor)",
      "Spotter Spec Sheet (All spec sheets in one)",
      "Spotter Spec Sheet (Smart Mooring)",
      "Spotter Spec Sheet (Current Meter)",
      "Spotter Spec Sheet (Dissolved Oxygen)",
      "Spotter Spec Sheet (Hydrophone)",
      "Spotter Spec Sheet (Core)",
      "Advanced Ocean Sensing: A Research Study",
      "Spotter Pitch Deck"
    ];
    
    const allResources = Array.from(this.resources.values());
    console.log(`Total resources before filtering: ${allResources.length}`);
    
    const filtered = allResources.filter(resource => {
      // Filter out resources that have been manually flagged for exclusion
      if (excludedResources.includes(resource.name)) {
        console.log(`Filtering out excluded resource: ${resource.name}`);
        return false;
      }
    
      // Filter by content visibility if specified
      if (filter.contentVisibility && filter.contentVisibility.length > 0) {
        // If the resource doesn't have contentVisibility, default to "both"
        const visibility = resource.contentVisibility || "both";
        
        // Check if the resource's visibility matches any of the requested ones
        const visibilityMatch = filter.contentVisibility.includes(visibility);
        if (!visibilityMatch) return false;
      }

      // Filter by type if specified
      if (filter.types && filter.types.length > 0 && !filter.types.includes(resource.type)) {
        return false;
      }

      // Filter by product if specified
      if (filter.products && filter.products.length > 0) {
        const hasMatchingProduct = resource.product.some(p => filter.products?.includes(p));
        if (!hasMatchingProduct) return false;
      }

      // Filter by solutions if specified
      if (filter.solutions && filter.solutions.length > 0) {
        // Check if the resource has the solutions field and if it contains any of the requested solutions
        const hasMatchingSolution = resource.solutions && resource.solutions.some(s => 
          filter.solutions?.includes(s)
        );
        
        // If no matching solution found, exclude this resource
        if (!hasMatchingSolution) return false;
      }

      // Filter by audience if specified
      if (filter.audiences && filter.audiences.length > 0) {
        const hasMatchingAudience = resource.audience.some(a => filter.audiences?.includes(a));
        if (!hasMatchingAudience) return false;
      }

      // Filter by messaging stage if specified
      if (filter.messagingStages && filter.messagingStages.length > 0 && !filter.messagingStages.includes(resource.messagingStage)) {
        return false;
      }

      // Filter by search term if specified
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.toLowerCase().trim();
        return (
          resource.name.toLowerCase().includes(searchTerm) ||
          resource.description.toLowerCase().includes(searchTerm) ||
          (resource.detailedDescription && resource.detailedDescription.toLowerCase().includes(searchTerm))
        );
      }

      return true;
    });
    
    // Sort the filtered results based on the sortBy parameter
    if (filter.sortBy) {
      switch (filter.sortBy) {
        case 'popularity':
          filtered.sort((a, b) => {
            // Primary sort by view count
            const aViews = a.viewCount || 0;
            const bViews = b.viewCount || 0;
            
            // If view counts are equal, use total interaction count as secondary sort
            if (aViews === bViews) {
              const aTotalInteractions = aViews + (a.shareCount || 0) + (a.downloadCount || 0);
              const bTotalInteractions = bViews + (b.shareCount || 0) + (b.downloadCount || 0);
              return bTotalInteractions - aTotalInteractions;
            }
            
            return bViews - aViews; // Descending by views
          });
          break;
        case 'newest':
          filtered.sort((a, b) => {
            // Parse dates and sort by newest first (using the "Last Updated" date from Notion)
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            return bDate.getTime() - aDate.getTime(); // Descending order
          });
          break;
        case 'oldest':
          filtered.sort((a, b) => {
            // Parse dates and sort by oldest first (using the "Last Updated" date from Notion)
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            return aDate.getTime() - bDate.getTime(); // Ascending order
          });
          break;
        default:
          // Default case (relevance) - no sorting needed as it's handled by search
          break;
      }
    }
    
    console.log(`Filtered results count: ${filtered.length}`);
    return filtered;
  }

  // Team methods (previously Partner methods)
  async getPartners(): Promise<Team[]> {
    return Array.from(this.partners.values());
  }

  async getPartnerBySlug(slug: string): Promise<Team | undefined> {
    for (const partner of this.partners.values()) {
      if (partner.slug === slug) {
        return partner;
      }
    }
    return undefined;
  }

  async getPartnerById(id: number): Promise<Team | undefined> {
    return this.partners.get(id);
  }

  async createPartner(insertPartner: InsertTeam): Promise<Team> {
    const id = this.currentPartnerId++;
    
    const partner: Team = { 
      ...insertPartner, 
      id,
      lastPasswordUpdate: new Date()
    };
    
    this.partners.set(id, partner);
    this.savePartnersToFile();
    return partner;
  }

  async updatePartnerPassword(id: number, passwordData: UpdateTeamPassword): Promise<Team | undefined> {
    const existingPartner = this.partners.get(id);
    if (!existingPartner) return undefined;

    const updatedPartner: Team = {
      ...existingPartner,
      password: passwordData.password,
      lastPasswordUpdate: new Date()
    };

    this.partners.set(id, updatedPartner);
    this.savePartnersToFile();
    return updatedPartner;
  }
  
  async verifyPartnerPassword(slug: string, password: string): Promise<boolean> {
    const partner = await this.getPartnerBySlug(slug);
    if (!partner) return false;
    
    // If no password is set, don't allow access
    if (!partner.password) return false;
    
    // Basic password comparison (in a real app, use proper hashing)
    return partner.password === password;
  }

  async deletePartner(id: number): Promise<boolean> {
    const result = this.partners.delete(id);
    if (result) {
      this.savePartnersToFile();
    }
    return result;
  }

  // Helper function to migrate stats from legacy path to new persistent path
  private migrateStatsIfNeeded() {
    try {
      // Check if legacy file exists but new one doesn't
      if (fs.existsSync(this.legacyResourceStatsFilePath) && !fs.existsSync(this.resourceStatsFilePath)) {
        console.log(`Found legacy stats file at ${this.legacyResourceStatsFilePath}, migrating to ${this.resourceStatsFilePath}`);
        
        // Read the legacy file
        const legacyData = fs.readFileSync(this.legacyResourceStatsFilePath, 'utf8');
        const statsData = JSON.parse(legacyData);
        
        // Ensure the target directory exists
        const dir = path.dirname(this.resourceStatsFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
        
        // Write to the new location
        fs.writeFileSync(this.resourceStatsFilePath, JSON.stringify(statsData, null, 2));
        console.log(`Successfully migrated stats to persistent location: ${this.resourceStatsFilePath}`);
        
        // Keep a backup of the legacy file but don't delete it
        const backupPath = `${this.legacyResourceStatsFilePath}.bak`;
        fs.copyFileSync(this.legacyResourceStatsFilePath, backupPath);
        console.log(`Created backup of legacy stats file at: ${backupPath}`);
      }
    } catch (error) {
      console.error(`Error migrating stats: ${error}`);
      // Non-fatal error, continue with empty stats if migration fails
    }
  }

  // Helper to save resource stats to JSON file
  private saveResourceStatsToFile() {
    try {
      // Convert Map to array for serialization
      const statsArray = Array.from(this.resourceUsageStats.entries()).map(([id, stats]) => ({
        id,
        ...stats
      }));

      // Make sure all resources with stats are updated with their current stats
      for (const stat of statsArray) {
        const resource = this.resources.get(stat.id);
        if (resource) {
          // Apply stats to the resource in memory
          this.resources.set(stat.id, {
            ...resource,
            viewCount: stat.viewCount || 0,
            shareCount: stat.shareCount || 0,
            downloadCount: stat.downloadCount || 0
          });
        }
      }

      // Ensure directory exists
      const dir = path.dirname(this.resourceStatsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to persistent file path
      fs.writeFileSync(this.resourceStatsFilePath, JSON.stringify(statsArray, null, 2));
      console.log(`Resource stats saved to persistent file: ${this.resourceStatsFilePath}`);
      
      // Also save to legacy path as a backup during transition
      try {
        fs.writeFileSync(this.legacyResourceStatsFilePath, JSON.stringify(statsArray, null, 2));
      } catch (backupError) {
        // Non-fatal if backup fails
        console.log(`Note: Could not write backup to legacy location: ${backupError.message}`);
      }
    } catch (error) {
      console.error("Error saving resource stats to file:", error);
    }
  }

  // Helper to load resource stats from JSON file
  private loadResourceStatsFromFile() {
    try {
      if (!fs.existsSync(this.resourceStatsFilePath)) {
        console.log(`Resource stats file doesn't exist yet at path: ${this.resourceStatsFilePath}`);
        
        // Check if we have a legacy file to use instead
        if (fs.existsSync(this.legacyResourceStatsFilePath)) {
          console.log(`Found legacy stats file, will use that instead: ${this.legacyResourceStatsFilePath}`);
          const legacyData = fs.readFileSync(this.legacyResourceStatsFilePath, 'utf8');
          const data = JSON.parse(legacyData);
          
          // Save to the new location for next time
          this.migrateStatsIfNeeded();
          
          return data;
        }
        
        return null;
      }

      const fileData = fs.readFileSync(this.resourceStatsFilePath, 'utf8');
      
      // Define the structure of the stored data
      interface StatData {
        id: number;
        viewCount: number;
        shareCount: number;
        downloadCount: number;
      }

      console.log(`Successfully loaded resource stats from persistent location: ${this.resourceStatsFilePath}`);
      const data = JSON.parse(fileData) as StatData[];
      return data;
    } catch (error) {
      console.error(`Error loading resource stats from file: ${error}`);
      
      // Try the legacy file as a fallback
      try {
        if (fs.existsSync(this.legacyResourceStatsFilePath)) {
          console.log(`Trying to load from legacy location as fallback...`);
          const legacyData = fs.readFileSync(this.legacyResourceStatsFilePath, 'utf8');
          return JSON.parse(legacyData);
        }
      } catch (fallbackError) {
        console.error(`Fallback also failed: ${fallbackError}`);
      }
      
      return null;
    }
  }

  // Initialize resource stats from file or create empty ones if none exists
  private initializeResourceStats() {
    const data = this.loadResourceStatsFromFile();

    if (data) {
      // Populate the Map with loaded stats
      data.forEach(stat => {
        // Store in stats map
        this.resourceUsageStats.set(stat.id, {
          viewCount: stat.viewCount || 0,
          shareCount: stat.shareCount || 0,
          downloadCount: stat.downloadCount || 0
        });
        
        // Also apply to any existing resource objects
        const resource = this.resources.get(stat.id);
        if (resource) {
          this.resources.set(stat.id, {
            ...resource,
            viewCount: stat.viewCount || 0,
            shareCount: stat.shareCount || 0,
            downloadCount: stat.downloadCount || 0
          });
        }
      });
      console.log(`Loaded and applied stats for ${data.length} resources from file`);
    } else {
      // No stats file exists yet, will be created on first update
      console.log("No resource stats file found. A new one will be created when needed.");
    }
  }

  // Update a resource with the latest stats from our file-backed tracker
  private applyStatsToResource(resource: Resource): Resource {
    const stats = this.resourceUsageStats.get(resource.id);
    if (!stats) return resource;
    
    return {
      ...resource,
      viewCount: stats.viewCount,
      shareCount: stats.shareCount,
      downloadCount: stats.downloadCount
    };
  }

  // Resource usage tracking methods
  async incrementResourceViews(id: number): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    // Get current stats or initialize new ones
    let stats = this.resourceUsageStats.get(id) || { viewCount: 0, shareCount: 0, downloadCount: 0 };
    
    // Update stats
    stats = { ...stats, viewCount: stats.viewCount + 1 };
    this.resourceUsageStats.set(id, stats);
    
    // Apply stats to resource
    const updatedResource = this.applyStatsToResource(resource);
    this.resources.set(id, updatedResource);
    
    // Save to file
    this.saveResourceStatsToFile();
    
    return updatedResource;
  }
  
  async incrementResourceShares(id: number): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    // Get current stats or initialize new ones
    let stats = this.resourceUsageStats.get(id) || { viewCount: 0, shareCount: 0, downloadCount: 0 };
    
    // Update stats
    stats = { ...stats, shareCount: stats.shareCount + 1 };
    this.resourceUsageStats.set(id, stats);
    
    // Apply stats to resource
    const updatedResource = this.applyStatsToResource(resource);
    this.resources.set(id, updatedResource);
    
    // Save to file
    this.saveResourceStatsToFile();
    
    return updatedResource;
  }
  
  async incrementResourceDownloads(id: number): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    // Get current stats or initialize new ones
    let stats = this.resourceUsageStats.get(id) || { viewCount: 0, shareCount: 0, downloadCount: 0 };
    
    // Update stats
    stats = { ...stats, downloadCount: stats.downloadCount + 1 };
    this.resourceUsageStats.set(id, stats);
    
    // Apply stats to resource
    const updatedResource = this.applyStatsToResource(resource);
    this.resources.set(id, updatedResource);
    
    // Save to file
    this.saveResourceStatsToFile();
    
    return updatedResource;
  }
  
  async getPopularResources(limit: number = 5): Promise<Resource[]> {
    // Get all resources and ensure they have the latest stats applied
    const resourcesWithStats = Array.from(this.resources.values())
      .map(resource => this.applyStatsToResource(resource));
    
    // Sort by view count first (primary sort)
    return resourcesWithStats
      .sort((a, b) => {
        const aViews = a.viewCount || 0;
        const bViews = b.viewCount || 0;
        
        // If view counts are equal, use total interaction count as secondary sort
        if (aViews === bViews) {
          const aTotalInteractions = aViews + (a.shareCount || 0) + (a.downloadCount || 0);
          const bTotalInteractions = bViews + (b.shareCount || 0) + (b.downloadCount || 0);
          return bTotalInteractions - aTotalInteractions;
        }
        
        return bViews - aViews; // Descending by views
      })
      .slice(0, limit);
  }
}

export const storage = new MemStorage();