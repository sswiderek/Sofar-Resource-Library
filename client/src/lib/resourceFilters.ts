import { Resource } from "@shared/schema";

// Interface for the filter state
export interface ResourceFilters {
  types: string[];            // Maps to "Content Type" in Notion
  products: string[];         // Maps to "Smart Mooring Sensor(s)" in Notion
  audiences: string[];        // Maps to "Market Segment(s)" in Notion
  messagingStages: string[];  // Maps to "Stage in Buyer's Journey" in Notion
  contentVisibility: string[]; // Maps to "Internal Use Only?" in Notion
  solutions: string[];        // Maps to Solution in Notion (major product groupings)
  search: string;
  sortBy?: 'relevance' | 'popularity' | 'newest' | 'oldest'; // Optional sort parameter
}

// Initialize empty filters with 'newest' as the default sort
export const initialFilters: ResourceFilters = {
  types: [],
  products: [],
  audiences: [],
  messagingStages: [],
  contentVisibility: [], // No default selection for content visibility
  solutions: [],
  search: '',
  sortBy: 'newest', // Setting "Newest First" as the default sort
};

// Builds the URL query string from filter state
export const buildFilterQueryString = (filters: ResourceFilters): string => {
  const params = new URLSearchParams();

  if (filters.types.length > 0) {
    params.append('types', filters.types.join(','));
  }

  if (filters.products.length > 0) {
    params.append('products', filters.products.join(','));
  }

  if (filters.audiences.length > 0) {
    params.append('audiences', filters.audiences.join(','));
  }

  if (filters.messagingStages.length > 0) {
    params.append('messagingStages', filters.messagingStages.join(','));
  }
  
  if (filters.contentVisibility.length > 0) {
    params.append('contentVisibility', filters.contentVisibility.join(','));
  }
  
  if (filters.solutions.length > 0) {
    params.append('solutions', filters.solutions.join(','));
  }

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.sortBy && filters.sortBy !== 'relevance') {
    params.append('sortBy', filters.sortBy);
  }

  return params.toString();
};

// Extract metadata from resources for filter options
export const extractMetadata = (resources: Resource[]) => {
  // Using Array.from instead of spread operator to avoid TypeScript errors
  const typesSet = new Set(resources.map(r => r.type));
  const productsSet = new Set(resources.flatMap(r => r.product));
  const audiencesSet = new Set(resources.flatMap(r => r.audience));
  const messagingStagesSet = new Set(resources.map(r => r.messagingStage));
  const contentVisibilitySet = new Set(resources.map(r => r.contentVisibility || 'both'));
  
  // Extract solutions from products (Wayfinder, Spotter, Smart Mooring)
  const solutionsSet = new Set(resources.flatMap(r => 
    r.product.filter(p => p.includes('Wayfinder') || p.includes('Spotter') || p.includes('Smart Mooring'))
  ));
  
  // Convert sets to arrays
  const types = Array.from(typesSet);
  const products = Array.from(productsSet);
  const audiences = Array.from(audiencesSet);
  const messagingStages = Array.from(messagingStagesSet);
  const contentVisibility = Array.from(contentVisibilitySet);
  const solutions = Array.from(solutionsSet);
  
  return {
    types,
    products,
    audiences,
    messagingStages,
    contentVisibility,
    solutions
  };
};