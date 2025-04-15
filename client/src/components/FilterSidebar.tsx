import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ResourceFilters } from "@/lib/resourceFilters";

interface Metadata {
  types: string[];
  products: string[];
  audiences: string[];
  messagingStages: string[];
  contentVisibility: string[];
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

  // Get metadata for filling filter options
  const { data, isLoading } = useQuery<Metadata>({
    queryKey: ['/api/resources/metadata'],
  });

  // Ensure we have default values for the metadata
  const metadata: Metadata = data || {
    types: [],
    products: [],
    audiences: [],
    messagingStages: [],
    contentVisibility: [],
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
    category: 'types' | 'products' | 'audiences' | 'messagingStages' | 'contentVisibility',
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
    category: 'types' | 'products' | 'audiences' | 'messagingStages' | 'contentVisibility',
    value: string
  ) => {
    return filter[category].includes(value);
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40 bg-white h-screen flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-white">
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
            {onMobileClose && (
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
        
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Search input */}
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
          
          {/* Filter options */}
          {renderFilterOptions()}
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-700">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-primary hover:text-primary-dark"
        >
          Clear all
        </Button>
      </div>
      
      <div className="p-4 overflow-y-auto flex-grow">
        {/* Search input */}
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
        
        {/* Filter options */}
        {renderFilterOptions()}
      </div>
    </div>
  );
  
  // Helper function to render filter options
  function renderFilterOptions() {
    if (isLoading) {
      // Loading state
      return (
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
      );
    }
    
    return (
      <>
        {/* Content Visibility Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-primary rounded-full mr-2"></span>
            Content Type
          </h3>
          <div className="space-y-2.5">
            {["internal", "external", "both"].map((visibility) => (
              <div key={visibility} className="flex items-center">
                <Checkbox
                  id={`visibility-${visibility}`}
                  checked={isSelected('contentVisibility', visibility)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('contentVisibility', visibility, checked as boolean)
                  }
                  className="data-[state=checked]:bg-primary"
                />
                <Label
                  htmlFor={`visibility-${visibility}`}
                  className="ml-2 text-sm text-neutral-700"
                >
                  {visibility === 'internal' ? 'Internal Resources' : 
                   visibility === 'external' ? 'Customer-Facing' : 
                   'All Content'}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Resource Type Filter - show even with empty data */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
            Resource Type
          </h3>
          {metadata.types && metadata.types.length > 0 ? (
            <div className="space-y-2.5">
              {metadata.types.map((type: string) => (
                <div key={type} className="flex items-center">
                  <Checkbox
                    id={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('types', type)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('types', type, checked as boolean)
                    }
                    className="data-[state=checked]:bg-indigo-500"
                  />
                  <Label
                    htmlFor={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-500 italic">
              Loading types from Notion...
            </div>
          )}
        </div>

        {/* Product Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Sofar Product
          </h3>
          {metadata.products && metadata.products.length > 0 ? (
            <div className="space-y-2.5">
              {metadata.products.map((product: string) => (
                <div key={product} className="flex items-center">
                  <Checkbox
                    id={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('products', product)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('products', product, checked as boolean)
                    }
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label
                    htmlFor={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {product}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-500 italic">
              Loading products from Notion...
            </div>
          )}
        </div>

        {/* Audience Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Target Market
          </h3>
          {metadata.audiences && metadata.audiences.length > 0 ? (
            <div className="space-y-2.5">
              {metadata.audiences.map((audience: string) => (
                <div key={audience} className="flex items-center">
                  <Checkbox
                    id={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('audiences', audience)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('audiences', audience, checked as boolean)
                    }
                    className="data-[state=checked]:bg-green-500"
                  />
                  <Label
                    htmlFor={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {audience}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-500 italic">
              Loading target markets from Notion...
            </div>
          )}
        </div>

        {/* Buyer's Journey Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
            Buyer's Journey
          </h3>
          {metadata.messagingStages && metadata.messagingStages.length > 0 ? (
            <div className="space-y-2.5">
              {metadata.messagingStages.map((stage: string) => (
                <div key={stage} className="flex items-center">
                  <Checkbox
                    id={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('messagingStages', stage)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('messagingStages', stage, checked as boolean)
                    }
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <Label
                    htmlFor={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {stage}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-500 italic">
              Loading journey stages from Notion...
            </div>
          )}
        </div>
        
        {/* Bottom spacing */}
        <div className="h-4" />
      </>
    );
  }
}