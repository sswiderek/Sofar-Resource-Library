import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertCircle,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowDownAZ,
  ArrowUpAZ,
  TrendingUp,
  CalendarDays,
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

// Interface for paginated response
interface PaginatedResourcesResponse {
  resources: Resource[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Home() {
  // State
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 30; // Resources per page

  // Hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Build query string for API request
  const filterQuery = buildFilterQueryString(filters) + 
    `&page=${currentPage}&limit=${limit}`;

  // Log the filter query for debugging
  console.log("Filter query:", filterQuery);
  console.log("Filters:", filters);

  // State for sync loading indicator
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Check if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Fetch resources based on filter with pagination
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedResourcesResponse>({
    queryKey: [`/api/resources?${filterQuery}${isInitialLoad ? '&sync=true' : ''}`],
  });
  
  // After first successful load, mark as non-initial
  useEffect(() => {
    if (data && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [data, isInitialLoad]);

  // Extract resources and pagination info
  const resources = data?.resources || [];
  const pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };
  
  // Navigate between pages
  const handlePageChange = (newPage: number) => {
    window.scrollTo(0, 0); // Scroll to top on page change
    setCurrentPage(newPage);
  };

  // Force sync with Notion
  const handleSync = async () => {
    if (isSyncing) return; // Prevent multiple sync requests
    
    setIsSyncing(true);
    try {
      await apiRequest("POST", "/api/sync", {});
      await refetch();
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
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (
    newFilters: ResourceFilters,
  ) => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilters({
      ...initialFilters,
    });
  };

  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setShowMobileFilters((prev) => !prev);
  };

  return (
    <div className="flex md:flex-row">
      {/* Filter Sidebar - Desktop */}
      <aside className="hidden md:block bg-white border-r border-neutral-200 w-64 sticky top-0 h-screen overflow-y-auto">
        <FilterSidebar
          filter={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isMobile={false}
        />
      </aside>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setShowMobileFilters(false)}
        >
          <div 
            className="absolute left-0 top-0 h-full w-80 max-w-full bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <FilterSidebar
              filter={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile={true}
              onMobileClose={() => setShowMobileFilters(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 bg-neutral-50 p-4 md:p-6 lg:p-8">
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

        {/* Resource header with just the title */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-1">
            Resource Library
          </h2>
          {resources && (
            <p className="text-sm text-neutral-600">
              Showing {resources.length} resources
            </p>
          )}
        </div>

        {/* Welcome Hero - show when showWelcome is true - Condensed version */}
        {showWelcome && (
          <div className="mb-4 bg-gradient-to-r from-primary/10 to-white border border-primary/20 rounded-lg overflow-hidden relative">
            <div className="flex items-center p-3">
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-semibold text-primary">
                    Welcome to the Sofar Resource Library
                  </h2>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => setShowWelcome(false)}
                  >
                    <X className="h-3 w-3 text-neutral-500" />
                  </Button>
                </div>
                <p className="text-neutral-600 text-sm mt-1">
                  Find Sofar resources through search, filters, or AI assistance
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Question Box */}
        <QuestionBox resources={resources} />
        
        {/* View controls, sort and sync buttons */}
        <div className="flex items-center justify-between mb-6 mt-6 bg-white p-4 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-600">Sort by:</span>
            <Select
              value={filters.sortBy || "relevance"}
              onValueChange={(value) => {
                const sortBy = value as 'relevance' | 'popularity' | 'newest' | 'oldest';
                handleFilterChange({
                  ...filters,
                  sortBy: sortBy === "relevance" ? undefined : sortBy,
                });
              }}
            >
              <SelectTrigger className="w-[180px] h-9 bg-white">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="relevance" className="flex items-center">
                    <ArrowDownAZ className="mr-2 h-4 w-4" />
                    <span>Relevance</span>
                  </SelectItem>
                  <SelectItem value="popularity" className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Most Popular</span>
                  </SelectItem>
                  <SelectItem value="newest" className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Newest First</span>
                  </SelectItem>
                  <SelectItem value="oldest" className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Oldest First</span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="flex items-center h-9"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync
                </>
              )}
            </Button>

            <div className="flex border border-neutral-200 rounded-md overflow-hidden h-9">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                className="rounded-none px-2 h-full"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none px-2 h-full"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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

        {/* Pagination UI */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              
              <div className="text-sm text-neutral-600">
                Page {pagination.page} of {pagination.totalPages}
                <span className="mx-2">·</span>
                <span className="text-neutral-500">
                  {pagination.total} resources total
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-2"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}