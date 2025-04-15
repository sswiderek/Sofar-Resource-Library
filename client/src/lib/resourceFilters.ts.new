import { Resource } from "@shared/schema";

// Interface for the filter state
export interface ResourceFilters {
  types: string[];
  products: string[];
  audiences: string[];
  messagingStages: string[];
  contentVisibility: string[]; // Add for internal/external filtering
  search: string;
}

// Initialize empty filters
export const initialFilters: ResourceFilters = {
  types: [],
  products: [],
  audiences: [],
  messagingStages: [],
  contentVisibility: [], // No default selection for content visibility
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
  
  return {
    types,
    products,
    audiences,
    messagingStages,
    contentVisibility
  };
};