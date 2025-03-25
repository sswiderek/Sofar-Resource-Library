import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Info, AlertCircle, Filter, RefreshCw, LayoutGrid, List } from "lucide-react";
import PartnerSelector from "@/components/PartnerSelector";
import FilterSidebar from "@/components/FilterSidebar";
import ResourceCard from "@/components/ResourceCard";
import ResourceList from "@/components/ResourceList";
import { Resource } from "@shared/schema";
import { ResourceFilters, initialFilters, buildFilterQueryString } from "@/lib/resourceFilters";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  // State
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Update the filter state when partner changes
  useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      partnerId: selectedPartner
    }));
  }, [selectedPartner]);

  // Build query string for API request
  const filterQuery = buildFilterQueryString(filters);
  
  // Fetch resources based on filter
  const { 
    data: resources, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [`/api/resources?${filterQuery}`],
    enabled: !!selectedPartner, // Only run query if partner is selected
  });

  // Force sync with Notion
  const handleSync = async () => {
    try {
      await apiRequest('POST', '/api/sync', {});
      refetch();
      toast({
        title: "Sync completed",
        description: "Resources have been updated from Notion.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Omit<ResourceFilters, 'partnerId'>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      ...initialFilters,
      partnerId: selectedPartner
    });
  };

  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setShowMobileFilters(prev => !prev);
  };

  return (
    <div className="flex flex-col md:flex-row overflow-hidden">
      {/* Filter Sidebar - Desktop */}
      <aside className="hidden md:block bg-white border-r border-neutral-200 w-64 md:flex-shrink-0 overflow-y-auto">
        {selectedPartner && (
          <FilterSidebar
            filter={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isMobile={false}
          />
        )}
      </aside>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && selectedPartner && (
        <FilterSidebar
          filter={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isMobile={true}
          onMobileClose={() => setShowMobileFilters(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-grow overflow-auto p-4 md:p-6 bg-neutral-50">
        {/* Partner Selector */}
        <div className="md:hidden mb-4">
          <PartnerSelector
            selectedPartner={selectedPartner}
            onPartnerChange={setSelectedPartner}
          />
        </div>

        {/* Filter button for mobile */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center bg-white"
            onClick={toggleMobileFilters}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* View toggle and resource info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-700">Resources</h2>
              {resources && (
                <p className="text-sm text-neutral-500">
                  Showing {resources.length} resources
                </p>
              )}
            </div>

            <div className="hidden md:block">
              <PartnerSelector
                selectedPartner={selectedPartner}
                onPartnerChange={setSelectedPartner}
              />
            </div>
          </div>

          <div className="flex items-center mt-3 md:mt-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync
            </Button>

            <div className="flex border border-neutral-300 rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none px-2"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Partner Selection Warning */}
        {!selectedPartner && (
          <Alert className="bg-amber-50 border-amber-400 mb-6">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-700">Please select your partner organization</AlertTitle>
            <AlertDescription className="text-amber-700">
              To view resources relevant to your organization, please select your partner name from the dropdown menu above.
            </AlertDescription>
          </Alert>
        )}

        {/* No Results Message */}
        {selectedPartner && resources?.length === 0 && !isLoading && (
          <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm text-center">
            <AlertCircle className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-neutral-700 mb-1">No Resources Found</h3>
            <p className="text-neutral-500">Try adjusting your filters or search terms</p>
            <Button
              onClick={handleClearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load resources. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Resources Grid View */}
        {viewMode === 'card' && resources && resources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-0 slide-in-from-bottom-5">
            {resources.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Resources List View */}
        {viewMode === 'list' && resources && resources.length > 0 && (
          <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-5">
            {resources.map((resource: Resource) => (
              <ResourceList key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
