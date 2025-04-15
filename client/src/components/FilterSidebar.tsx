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
  const { data, isLoading, isError } = useQuery<Metadata>({
    queryKey: ['/api/resources/metadata'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

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
      <div className="fixed inset-0 z-40 bg-neutral-900 h-screen flex flex-col">
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-black">
          <h2 className="font-semibold text-white">Filters</h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800"
            >
              Clear all
            </Button>
            {onMobileClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="md:hidden text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Search input */}
          <div className="mb-5">
            <Label htmlFor="search" className="text-sm font-medium text-neutral-300 mb-1">
              Search
            </Label>
            <div className="relative">
              <Input
                type="text"
                id="search"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-3 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus-visible:ring-cyan-700 focus-visible:ring-offset-neutral-900"
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
    <div className="h-full flex flex-col bg-neutral-900 border-r border-neutral-800">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black">
        <h2 className="font-semibold text-white">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800"
        >
          Clear all
        </Button>
      </div>
      
      <div className="p-4 overflow-y-auto flex-grow">
        {/* Search input */}
        <div className="mb-5">
          <Label htmlFor="search" className="text-sm font-medium text-neutral-300 mb-1">
            Search
          </Label>
          <div className="relative">
            <Input
              type="text"
              id="search"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus-visible:ring-cyan-700 focus-visible:ring-offset-neutral-900"
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
              <Skeleton className="h-5 w-24 mb-2 bg-neutral-800" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-neutral-800" />
                <Skeleton className="h-4 w-full bg-neutral-800" />
                <Skeleton className="h-4 w-full bg-neutral-800" />
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
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></span>
            Content Type
          </h3>
          <div className="space-y-2.5">
            {["internal", "external"].map((visibility) => (
              <div key={visibility} className="flex items-center">
                <Checkbox
                  id={`visibility-${visibility}`}
                  checked={isSelected('contentVisibility', visibility)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('contentVisibility', visibility, checked as boolean)
                  }
                  className="border-neutral-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <Label
                  htmlFor={`visibility-${visibility}`}
                  className="ml-2 text-sm text-neutral-300"
                >
                  {visibility === 'internal' ? 'Internal Resources' : 'Customer-Facing'}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Resource Type Filter - show even with empty data */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
            Resource Type
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
                    className="border-neutral-600 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  <Label
                    htmlFor={`type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-300"
                  >
                    {type}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-400 italic">
                Loading types...
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                No resource types available
              </div>
            )}
          </div>
        </div>

        {/* Product Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Sofar Product
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
                    className="border-neutral-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <Label
                    htmlFor={`product-${product.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-300"
                  >
                    {product}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-400 italic">
                Loading products...
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                No products available
              </div>
            )}
          </div>
        </div>

        {/* Audience Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Target Market
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
                    className="border-neutral-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <Label
                    htmlFor={`audience-${audience.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-300"
                  >
                    {audience}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-400 italic">
                Loading target markets...
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                No target markets available
              </div>
            )}
          </div>
        </div>

        {/* Buyer's Journey Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
            Buyer's Journey
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
                    className="border-neutral-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <Label
                    htmlFor={`stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-300"
                  >
                    {stage}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-400 italic">
                Loading journey stages...
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                No journey stages available
              </div>
            )}
          </div>
        </div>

        {/* Solutions Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
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
                    className="border-neutral-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                  <Label
                    htmlFor={`solution-${solution.toLowerCase().replace(/\s+/g, '-')}`}
                    className="ml-2 text-sm text-neutral-300"
                  >
                    {solution}
                  </Label>
                </div>
              ))
            ) : isLoading ? (
              <div className="text-xs text-neutral-400 italic">
                Loading solutions...
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                No solutions available
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