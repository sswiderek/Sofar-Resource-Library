import { Resource } from "@shared/schema";

// Interface for the filter state
export interface ResourceFilters {
  partnerId: string | null;
  types: string[];
  products: string[];
  audiences: string[];
  messagingStages: string[];
  search: string;
}

// Initialize empty filters
export const initialFilters: ResourceFilters = {
  partnerId: null,
  types: [],
  products: [],
  audiences: [],
  messagingStages: [],
  search: '',
};

// Builds the URL query string from filter state
export const buildFilterQueryString = (filters: ResourceFilters): string => {
  if (!filters.partnerId) return '';

  const params = new URLSearchParams();
  params.append('partnerId', filters.partnerId);

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
  
  return {
    types,
    products,
    audiences,
    messagingStages
  };
};
