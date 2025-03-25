import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Filter {
  types: string[];
  products: string[];
  audiences: string[];
  messagingStages: string[];
  search: string;
}

interface FilterSidebarProps {
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
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
  const { data: metadata, isLoading } = useQuery({
    queryKey: ['/api/resources/metadata'],
  });

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

  // Handle checkbox change
  const handleCheckboxChange = (
    category: keyof Omit<Filter, 'search'>,
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

  // Helper function to check if a value is selected
  const isSelected = (category: keyof Omit<Filter, 'search'>, value: string) => {
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
          {/* Resource Type Filter */}
          <div className="mb-5">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Resource Type</h3>
            {metadata?.types.map((type: string) => (
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

          {/* Product Filter */}
          <div className="mb-5">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Product</h3>
            {metadata?.products.map((product: string) => (
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

          {/* Audience Filter */}
          <div className="mb-5">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Audience</h3>
            {metadata?.audiences.map((audience: string) => (
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

          {/* Buyer's Journey Filter */}
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Buyer's Journey</h3>
            {metadata?.messagingStages.map((stage: string) => (
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
        </>
      )}
    </div>
  );
}
