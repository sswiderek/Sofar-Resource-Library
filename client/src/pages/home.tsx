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
import Footer from "@/components/Footer";
import { ResourceLoadingGrid, ResourceLoadingList } from "@/components/LoadingSkeleton";
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
      <aside className="hidden md:block bg-white border-r border-neutral-200 w-64 sticky top-0 h-screen overflow-y-auto shadow-sm">
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
            className="absolute left-0 top-0 h-full w-[85%] max-w-xs bg-white shadow-xl overflow-hidden"
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

        {/* Resource header with title */}
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-[#1e5bb0] mb-1">
            Resource Library
          </h2>
          {resources && (
            <p className="text-sm text-neutral-600 flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Showing {resources.length} resources
            </p>
          )}
        </div>

        {/* Welcome Hero - show when showWelcome is true - Toned down version */}
        {showWelcome && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden relative">
            <div className="flex items-center p-3 relative z-10">
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-medium text-blue-700">
                    Welcome to the Sofar Resource Library
                  </h2>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-blue-100/50 text-blue-500"
                    onClick={() => setShowWelcome(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-blue-600 text-xs mt-1">
                  Find Sofar resources through search, filters, or AI assistance
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Question Box */}
        <QuestionBox resources={resources} />
        
        {/* View controls, sort and sync buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mt-6 bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 shadow-sm gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-[#1e5bb0] whitespace-nowrap">Sort by:</span>
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
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white border-blue-200 hover:border-blue-300 focus:ring-blue-200">
                <SelectValue placeholder="Relevance">
                  {filters.sortBy === "relevance" || !filters.sortBy ? (
                    <div className="flex items-center">
                      <ArrowDownAZ className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Relevance</span>
                    </div>
                  ) : filters.sortBy === "popularity" ? (
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Most Popular</span>
                    </div>
                  ) : filters.sortBy === "newest" ? (
                    <div className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Newest First</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Oldest First</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="relevance">
                    <div className="flex items-center">
                      <ArrowDownAZ className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Relevance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="popularity">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Most Popular</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Newest First</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Oldest First</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="flex items-center h-9 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Syncing...</span>
                  <span className="sm:hidden">Sync</span>
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sync</span>
                  <span className="sm:hidden">Sync</span>
                </>
              )}
            </Button>

            <div className="flex border border-blue-200 rounded-md overflow-hidden h-9 shadow-sm">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                className={`rounded-none px-2 h-full ${viewMode === "card" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 text-blue-700"}`}
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className={`rounded-none px-2 h-full ${viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 text-blue-700"}`}
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

        {/* Loading State - Using skeleton placeholders for better UX */}
        {isLoading && (
          <>
            {viewMode === "card" ? (
              <ResourceLoadingGrid count={12} />
            ) : (
              <ResourceLoadingList count={6} />
            )}
          </>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 md:gap-6 px-2 xs:px-3 sm:px-4 md:px-6 animate-in fade-in-0 duration-300">
            {resources.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Resources List View */}
        {viewMode === "list" && resources && resources.length > 0 && (
          <div className="space-y-3 xs:space-y-4 px-2 xs:px-3 sm:px-4 md:px-6 animate-in fade-in-0 duration-300">
            {resources.map((resource: Resource) => (
              <ResourceList key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="mt-5 sm:mt-6 md:mt-8 flex items-center justify-center px-2 xs:px-3 sm:px-4 md:px-6">
            <div className="flex items-center space-x-2 xs:space-x-3 bg-white py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg shadow-sm border border-blue-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="px-1.5 sm:px-2 h-7 sm:h-8 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 disabled:text-gray-400"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              
              <div className="text-xs sm:text-sm">
                <span className="font-medium text-blue-700">Page {pagination.page}</span> 
                <span className="text-neutral-600"> of {pagination.totalPages}</span>
                <span className="mx-1 sm:mx-2 text-blue-300">•</span>
                <span className="text-neutral-500 hidden xs:inline">
                  {pagination.total} resources
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-1.5 sm:px-2 h-7 sm:h-8 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 disabled:text-gray-400"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}