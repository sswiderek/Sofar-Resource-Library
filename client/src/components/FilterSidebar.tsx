import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ResourceFilters } from "@/lib/resourceFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Partner } from "@shared/schema";

interface Metadata {
  types: string[];
  products: string[];
  audiences: string[];
  messagingStages: string[];
  lastSynced?: string;
}

interface FilterSidebarProps {
  filter: ResourceFilters;
  onFilterChange: (filter: ResourceFilters) => void;
  onClearFilters: () => void;
  isMobile: boolean;
  onMobileClose?: () => void;
}

export default function FilterSidebar({
  filter,
  onFilterChange,
  onClearFilters,
  isMobile,
  onMobileClose
}: FilterSidebarProps) {
  const [search, setSearch] = useState(filter.search);

  // Get metadata for filling filter options with partner-specific data
  const { data, isLoading } = useQuery<Metadata>({
    queryKey: ['/api/resources/metadata', filter.partnerId ? { partnerId: filter.partnerId } : undefined],
    enabled: !!filter.partnerId, // Only fetch metadata if a partner is selected
  });
  
  // Get partner data
  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });
  
  // Find the selected partner
  const selectedPartner = filter.partnerId 
    ? partners.find(p => p.slug === filter.partnerId)
    : null;

  // Ensure we have default values for the metadata
  const metadata: Metadata = data || {
    types: [],
    products: [],
    audiences: [],
    messagingStages: []
  };

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        ...filter,
        search,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Type-safe checkbox change handler
  const handleCheckboxChange = (
    category: 'types' | 'products' | 'audiences' | 'messagingStages',
    value: string,
    checked: boolean
  ) => {
    const currentValues = [...filter[category]];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    onFilterChange({
      ...filter,
      [category]: newValues,
    });
  };

  // Type-safe helper function to check if a value is selected
  const isSelected = (
    category: 'types' | 'products' | 'audiences' | 'messagingStages',
    value: string
  ) => {
    return filter[category].includes(value);
  };

  // Classes for mobile sidebar
  const mobileClasses = isMobile
    ? "fixed inset-0 z-40 bg-white p-4 overflow-y-auto"
    : "bg-white border-r border-neutral-200 w-full md:w-64 md:flex-shrink-0 overflow-y-auto p-4";

  return (
    <div className={mobileClasses}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-neutral-700">Filters</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-primary hover:text-primary-dark"
          >
            Clear all
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileClose}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Welcome Message - only show when a partner is selected */}
      {filter.partnerId && selectedPartner && (
        <Card className="mb-6 border-l-4 border-l-primary overflow-hidden bg-gradient-to-br from-white to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1 flex-shrink-0">
                {selectedPartner.slug === 'pme' ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <img src="/pme-logo.png" alt="PME Logo" className="h-5 w-auto" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary">
                  Welcome, {selectedPartner.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This portal provides exclusive access to Sofar Ocean resources tailored specifically for your needs. Browse, search, or ask questions about any resource.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Browse Resources
                  </span>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Search Content
                  </span>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Ask AI Questions
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="mb-5">
        <Label htmlFor="search" className="text-sm font-medium text-neutral-500 mb-1">
          Search
        </Label>
        <div className="relative">
          <Input
            type="text"
            id="search"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3 pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
        </div>
      </div>

      {isLoading ? (
        // Loading state
        <>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-5">
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {/* Resource Type Filter - only show if there are options */}
          {metadata.types && metadata.types.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Resource Type</h3>
              {metadata.types.map((type: string) => (
                <div key={type} className="flex items-center mb-2">
                  <Checkbox
                    id={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('types', type)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('types', type, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-600"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Product Filter - only show if there are options */}
          {metadata.products && metadata.products.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Product</h3>
              {metadata.products.map((product: string) => (
                <div key={product} className="flex items-center mb-2">
                  <Checkbox
                    id={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('products', product)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('products', product, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-600"
                  >
                    {product}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Audience Filter - only show if there are options */}
          {metadata.audiences && metadata.audiences.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Audience</h3>
              {metadata.audiences.map((audience: string) => (
                <div key={audience} className="flex items-center mb-2">
                  <Checkbox
                    id={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('audiences', audience)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('audiences', audience, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-600"
                  >
                    {audience}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Buyer's Journey Filter - only show if there are options */}
          {metadata.messagingStages && metadata.messagingStages.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Buyer's Journey</h3>
              {metadata.messagingStages.map((stage: string) => (
                <div key={stage} className="flex items-center mb-2">
                  <Checkbox
                    id={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('messagingStages', stage)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('messagingStages', stage, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-600"
                  >
                    {stage}
                  </Label>
                </div>
              ))}
            </div>
          )}
          
          {/* If no filters available for this partner, show a message */}
          {filter.partnerId && 
           !metadata.types.length && 
           !metadata.products.length && 
           !metadata.audiences.length && 
           !metadata.messagingStages.length && (
            <div className="text-neutral-500 text-sm italic mt-4">
              No additional filters available for this partner.
            </div>
          )}
        </>
      )}
    </div>
  );
}
