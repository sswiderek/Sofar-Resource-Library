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
}

// Initialize empty filters
export const initialFilters: ResourceFilters = {
  types: [],
  products: [],
  audiences: [],
  messagingStages: [],
  contentVisibility: [], // No default selection for content visibility
  solutions: [],
  search: '',
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

  return params.toString();
};

// Extract metadata from resources for filter options
export const extractMetadata = (resources: Resource[]) => {
  const types = [...new Set(resources.map(r => r.type))];
  const products = [...new Set(resources.flatMap(r => r.product))];
  const audiences = [...new Set(resources.flatMap(r => r.audience))];
  const messagingStages = [...new Set(resources.map(r => r.messagingStage))];
  const contentVisibility = [...new Set(resources.map(r => r.contentVisibility || 'both'))];
  
  // Extract solutions from products (Wayfinder, Spotter, Smart Mooring)
  const solutions = [...new Set(resources.flatMap(r => 
    r.product.filter(p => p.includes('Wayfinder') || p.includes('Spotter') || p.includes('Smart Mooring'))
  ))];
  
  return {
    types,
    products,
    audiences,
    messagingStages,
    contentVisibility,
    solutions
  };
};