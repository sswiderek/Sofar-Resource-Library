import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertCircle,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  X,
  Mail,
} from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import ResourceCard from "@/components/ResourceCard";
import ResourceList from "@/components/ResourceList";
import QuestionBox from "@/components/QuestionBox";
import { Resource } from "@shared/schema";
import {
  ResourceFilters,
  initialFilters,
  buildFilterQueryString,
} from "@/lib/resourceFilters";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  // State
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLeadsCallout, setShowLeadsCallout] = useState(true);

  // Hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Build query string for API request
  const filterQuery = buildFilterQueryString(filters);

  // Log the filter query for debugging
  console.log("Filter query:", filterQuery);
  console.log("Filters:", filters);

  // Fetch resources based on filter
  const {
    data: resources = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Resource[]>({
    queryKey: [`/api/resources?${filterQuery}`],
  });

  // Force sync with Notion
  const handleSync = async () => {
    try {
      await apiRequest("POST", "/api/sync", {});
      refetch();
      toast({
        title: "Sync completed",
        description: "Resources have been updated from Notion.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (
    newFilters: ResourceFilters,
  ) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      ...initialFilters,
    });
  };

  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setShowMobileFilters((prev) => !prev);
  };

  return (
    <div className="flex flex-col md:flex-row overflow-hidden h-screen">
      {/* Filter Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col bg-white border-r border-neutral-200 w-64 flex-shrink-0">
        <FilterSidebar
          filter={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isMobile={false}
        />
      </aside>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <FilterSidebar
          filter={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isMobile={true}
          onMobileClose={() => setShowMobileFilters(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-grow overflow-auto p-4 md:p-6 lg:p-8 bg-neutral-50">
        {/* Filter button for mobile */}
        <div className="md:hidden mb-6">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex-grow">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-1">
              Sales Resources
            </h2>
            {resources && (
              <p className="text-sm text-neutral-600">
                Showing {resources.length} resources
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <Button
              variant="outline"
              size="default"
              onClick={handleSync}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync
            </Button>

            <div className="flex border border-neutral-300 rounded-md overflow-hidden h-10">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="default"
                className="rounded-none px-2 h-full"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="default"
                className="rounded-none px-2 h-full"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome Hero - show when showWelcome is true */}
        {showWelcome && (
          <div className="mb-6 bg-gradient-to-r from-black/90 to-neutral-800 border border-neutral-700 rounded-lg overflow-hidden relative shadow-lg">
            <div className="flex items-center p-6">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-white">
                  Welcome to the Sales Enablement Portal
                </h2>
                <p className="text-neutral-300 mt-1">
                  This portal provides access to Sofar Ocean resources to help you succeed.
                  Browse, search, or ask questions about any resource.
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
                    <LayoutGrid className="h-3 w-3 mr-1" /> Browse Resources
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                    <Search className="h-3 w-3 mr-1" /> Search Content
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
                    <Sparkles className="h-3 w-3 mr-1" /> Ask AI Questions
                  </span>
                </div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-neutral-700/50"
                onClick={() => setShowWelcome(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Sales Lead Callout removed */}

        {/* AI Question Box */}
        <QuestionBox resources={resources} />

        {/* No Results Message */}
        {resources?.length === 0 && !isLoading && (
          <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm text-center">
            <AlertCircle className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-neutral-700 mb-1">
              No Resources Found
            </h3>
            <p className="text-neutral-500">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={handleClearFilters} className="mt-4">
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
        {viewMode === "card" && resources && resources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-300">
            {resources.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Resources List View */}
        {viewMode === "list" && resources && resources.length > 0 && (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            {resources.map((resource: Resource) => (
              <ResourceList key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}