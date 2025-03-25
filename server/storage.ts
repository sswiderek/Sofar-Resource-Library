import { 
  users, type User, type InsertUser,
  resources, type Resource, type InsertResource,
  partners, type Partner, type InsertPartner,
  type ResourceFilter
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
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
  getFilteredResources(filter: ResourceFilter): Promise<Resource[]>;
  
  // Partner methods
  getPartners(): Promise<Partner[]>;
  getPartnerBySlug(slug: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  deletePartner(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resources: Map<number, Resource>;
  private partners: Map<number, Partner>;
  currentUserId: number;
  currentResourceId: number;
  currentPartnerId: number;

  constructor() {
    this.users = new Map();
    this.resources = new Map();
    this.partners = new Map();
    this.currentUserId = 1;
    this.currentResourceId = 1;
    this.currentPartnerId = 1;
    
    // Initialize with some partner data
    this.initializePartners();
  }

  // Initialize with common partners
  private initializePartners() {
    const defaultPartners: InsertPartner[] = [
      { name: "PME", slug: "pme" }
    ];
    
    for (const partner of defaultPartners) {
      this.createPartner(partner);
    }
  }

  // User methods (keeping existing ones)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getResourceByNotionId(notionId: string): Promise<Resource | undefined> {
    return Array.from(this.resources.values()).find(
      (resource) => resource.notionId === notionId
    );
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

  async getFilteredResources(filter: ResourceFilter): Promise<Resource[]> {
    console.log(`Filtering resources with filter:`, JSON.stringify(filter, null, 2));
    
    const allResources = Array.from(this.resources.values());
    console.log(`Total resources before filtering: ${allResources.length}`);
    
    // Log partner relevancy info for debugging
    const partnerRelevancies = new Set<string>();
    allResources.forEach(r => r.partnerRelevancy.forEach(p => partnerRelevancies.add(p)));
    console.log(`Available partner relevancies:`, Array.from(partnerRelevancies));
    
    const filtered = allResources.filter(resource => {
      // Filter by partner relevancy first
      const partnerMatch = resource.partnerRelevancy.includes(filter.partnerId);
      if (!partnerMatch) {
        return false;
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
          resource.description.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
    
    console.log(`Filtered results count: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(`First result: ${filtered[0].name}`);
    }
    
    return filtered;
  }

  // Partner methods
  async getPartners(): Promise<Partner[]> {
    return Array.from(this.partners.values());
  }

  async getPartnerBySlug(slug: string): Promise<Partner | undefined> {
    return Array.from(this.partners.values()).find(
      (partner) => partner.slug === slug
    );
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const id = this.currentPartnerId++;
    const partner: Partner = { ...insertPartner, id };
    this.partners.set(id, partner);
    return partner;
  }

  async deletePartner(id: number): Promise<boolean> {
    return this.partners.delete(id);
  }
}

export const storage = new MemStorage();
