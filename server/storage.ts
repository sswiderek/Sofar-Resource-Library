import path from "path";
import fs from "fs";
import session from "express-session";
import MemoryStore from "memorystore";
import {
  User,
  InsertUser,
  Resource,
  InsertResource,
  Partner as Team, // Renamed but using Partner as Team for backward compatibility
  InsertTeam,
  ResourceFilter,
  UpdateTeamPassword,
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
  currentUserId: number;
  currentResourceId: number;
  currentPartnerId: number;
  sessionStore: session.Store;

  // Path for storing partners data (keeping for backward compatibility)
  private partnersFilePath: string = path.join(process.cwd(), 'partners-data.json');

  constructor() {
    this.users = new Map();
    this.resources = new Map();
    this.partners = new Map();
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
            // Sort by total interactions (views + shares + downloads)
            const aTotal = (a.viewCount || 0) + (a.shareCount || 0) + (a.downloadCount || 0);
            const bTotal = (b.viewCount || 0) + (b.shareCount || 0) + (b.downloadCount || 0);
            return bTotal - aTotal; // Descending order
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

  // Resource usage tracking methods
  async incrementResourceViews(id: number): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { 
      ...resource, 
      viewCount: (resource.viewCount || 0) + 1 
    };
    
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async incrementResourceShares(id: number): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { 
      ...resource, 
      shareCount: (resource.shareCount || 0) + 1 
    };
    
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async incrementResourceDownloads(id: number): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { 
      ...resource, 
      downloadCount: (resource.downloadCount || 0) + 1 
    };
    
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async getPopularResources(limit: number = 5): Promise<Resource[]> {
    // Get all resources and sort by total usage (views + shares + downloads)
    const resources = Array.from(this.resources.values());
    
    return resources
      .sort((a, b) => {
        const totalA = (a.viewCount || 0) + (a.shareCount || 0) + (a.downloadCount || 0);
        const totalB = (b.viewCount || 0) + (b.shareCount || 0) + (b.downloadCount || 0);
        return totalB - totalA; // Sort in descending order
      })
      .slice(0, limit);
  }
}

import { db } from "./db";
import { eq } from "drizzle-orm";

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // Resource methods
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }
  
  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }
  
  async getResourceByNotionId(notionId: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.notionId, notionId));
    return resource || undefined;
  }
  
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
  }
  
  async updateResource(id: number, resourceUpdate: Partial<Resource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resourceUpdate)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }
  
  async updateResourceByNotionId(notionId: string, resourceUpdate: Partial<Resource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resourceUpdate)
      .where(eq(resources.notionId, notionId))
      .returning();
    return updatedResource || undefined;
  }
  
  async deleteResource(id: number): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return result.count > 0;
  }
  
  async clearResources(): Promise<void> {
    await db.delete(resources);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Team methods
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }
  
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }
  
  async getPartnerBySlug(slug: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
    return team || undefined;
  }
  
  async createPartner(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values({
      ...insertTeam,
      lastPasswordUpdate: new Date()
    }).returning();
    return team;
  }
  
  async updatePartnerPassword(id: number, passwordData: UpdateTeamPassword): Promise<Team | undefined> {
    const [updatedTeam] = await db
      .update(teams)
      .set({
        password: passwordData.password,
        lastPasswordUpdate: new Date()
      })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam || undefined;
  }
  
  async verifyPartnerPassword(slug: string, password: string): Promise<boolean> {
    const partner = await this.getPartnerBySlug(slug);
    if (!partner) return false;
    if (!partner.password) return false;
    return partner.password === password;
  }
  
  async deletePartner(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.count > 0;
  }
  
  // Resource usage tracking methods
  async incrementResourceViews(id: number): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set({
        viewCount: db.select({ value: resources.viewCount }).from(resources).where(eq(resources.id, id)).limit(1).then(rows => (rows[0]?.value || 0) + 1)
      })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }
  
  async incrementResourceShares(id: number): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set({
        shareCount: db.select({ value: resources.shareCount }).from(resources).where(eq(resources.id, id)).limit(1).then(rows => (rows[0]?.value || 0) + 1)
      })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }
  
  async incrementResourceDownloads(id: number): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set({
        downloadCount: db.select({ value: resources.downloadCount }).from(resources).where(eq(resources.id, id)).limit(1).then(rows => (rows[0]?.value || 0) + 1)
      })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }
  
  async getPopularResources(limit: number = 5): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .orderBy(resources.viewCount, { direction: 'desc' })
      .limit(limit);
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();