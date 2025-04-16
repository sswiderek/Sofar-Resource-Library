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
  types: string[];      // Maps to "Content Type" in Notion
  products: string[];   // Maps to "Smart Mooring Sensor(s)" in Notion
  audiences: string[];  // Maps to "Market Segment(s)" in Notion
  messagingStages: string[]; // Maps to "Stage in Buyer's Journey" in Notion
  contentVisibility: string[]; // Maps to "Internal Use Only?" in Notion
  solutions: string[];  // Maps to "Solution" in Notion
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
  const { data, isLoading, isError, refetch } = useQuery<Metadata>({
    queryKey: ['/api/resources/metadata'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    // Increase retry attempts for preview environments
    retry: 3,
    retryDelay: 1000,
  });

  // Force a refetch if data is empty but should be available
  useEffect(() => {
    if (!isLoading && data && 
        (data.types.length === 0 || 
         data.products.length === 0 || 
         data.audiences.length === 0)) {
      // If data is empty after loading, try refetching once
      console.log("Metadata appears empty, refetching...");
      refetch();
    }
  }, [data, isLoading, refetch]);

  // Ensure we have default values for the metadata
  const metadata: Metadata = data || {
    types: [],
    products: [],
    audiences: [],
    messagingStages: [],
    contentVisibility: [],
    solutions: [],
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
    category: 'types' | 'products' | 'audiences' | 'messagingStages' | 'contentVisibility' | 'solutions',
    value: string,
    checked: boolean
  ) => {
    const currentValues = [...(filter[category] || [])];
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
    category: 'types' | 'products' | 'audiences' | 'messagingStages' | 'contentVisibility' | 'solutions',
    value: string
  ) => {
    return filter[category]?.includes(value) || false;
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
        {/* Publicly Shareable Filter (renamed from "Content Type") */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-rose-600 rounded-full mr-2"></span>
            Publicly Shareable?
          </h3>
          <div className="space-y-2.5">
            {[
              { value: "external", label: "Yes" },
              { value: "internal", label: "No" }
            ].map((option) => (
              <div key={option.value} className="flex items-center">
                <Checkbox
                  id={`visibility-${option.value}`}
                  checked={isSelected('contentVisibility', option.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('contentVisibility', option.value, checked as boolean)
                  }
                  className="data-[state=checked]:bg-rose-600"
                />
                <Label
                  htmlFor={`visibility-${option.value}`}
                  className="ml-2 text-sm text-neutral-700"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Solutions Filter - Moved to the top as requested */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-fuchsia-600 rounded-full mr-2"></span>
            Solution
          </h3>
          <div className="space-y-2.5">
            {metadata.solutions && metadata.solutions.length > 0 ? (
              metadata.solutions.map((solution: string) => (
                <div key={solution} className="flex items-center">
                  <Checkbox
                    id={`solution-${solution.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('solutions', solution)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('solutions', solution, checked as boolean)
                    }
                    className="data-[state=checked]:bg-fuchsia-600"
                  />
                  <Label
                    htmlFor={`solution-${solution.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {solution}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-500 italic">
                Loading solutions...
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                No solutions available
              </div>
            )}
          </div>
        </div>
        
        {/* Resource Type Filter - show even with empty data */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></span>
            Content Type
          </h3>
          <div className="space-y-2.5">
            {metadata.types && metadata.types.length > 0 ? (
              metadata.types.map((type: string) => (
                <div key={type} className="flex items-center">
                  <Checkbox
                    id={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('types', type)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('types', type, checked as boolean)
                    }
                    className="data-[state=checked]:bg-indigo-600"
                  />
                  <Label
                    htmlFor={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {type}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-500 italic">
                Loading types...
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                No resource types available
              </div>
            )}
          </div>
        </div>

        {/* Product Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
            Smart Mooring Sensor(s)
          </h3>
          <div className="space-y-2.5">
            {metadata.products && metadata.products.length > 0 ? (
              metadata.products.map((product: string) => (
                <div key={product} className="flex items-center">
                  <Checkbox
                    id={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('products', product)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('products', product, checked as boolean)
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label
                    htmlFor={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {product}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-500 italic">
                Loading products...
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                No products available
              </div>
            )}
          </div>
        </div>

        {/* Audience Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-emerald-600 rounded-full mr-2"></span>
            Market Segment(s)
          </h3>
          <div className="space-y-2.5">
            {metadata.audiences && metadata.audiences.length > 0 ? (
              metadata.audiences.map((audience: string) => (
                <div key={audience} className="flex items-center">
                  <Checkbox
                    id={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('audiences', audience)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('audiences', audience, checked as boolean)
                    }
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <Label
                    htmlFor={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {audience}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-500 italic">
                Loading target markets...
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                No target markets available
              </div>
            )}
          </div>
        </div>

        {/* Buyer's Journey Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-amber-600 rounded-full mr-2"></span>
            Stage in Buyer's Journey
          </h3>
          <div className="space-y-2.5">
            {metadata.messagingStages && metadata.messagingStages.length > 0 ? (
              metadata.messagingStages.map((stage: string) => (
                <div key={stage} className="flex items-center">
                  <Checkbox
                    id={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={isSelected('messagingStages', stage)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('messagingStages', stage, checked as boolean)
                    }
                    className="data-[state=checked]:bg-amber-600"
                  />
                  <Label
                    htmlFor={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-700"
                  >
                    {stage}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-500 italic">
                Loading journey stages...
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                No journey stages available
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom spacing */}
        <div className="h-4" />
      </>
    );
  }
}