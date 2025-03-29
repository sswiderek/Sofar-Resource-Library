import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Info, AlertCircle, Filter, RefreshCw, LayoutGrid, List, Search, Sparkles, X } from "lucide-react";
import PartnerSelector from "@/components/PartnerSelector";
import FilterSidebar from "@/components/FilterSidebar";
import ResourceCard from "@/components/ResourceCard";
import ResourceList from "@/components/ResourceList";
import QuestionBox from "@/components/QuestionBox";
import PartnerPasswordModal from "@/components/PartnerPasswordModal";
import { Resource, Partner } from "@shared/schema";
import { ResourceFilters, initialFilters, buildFilterQueryString } from "@/lib/resourceFilters";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  // State
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedPartnerObj, setSelectedPartnerObj] = useState<Partner | null>(null);
  const [authorizedPartners, setAuthorizedPartners] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Fetch partners for the password modal
  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });
  
  // Handle partner selection change
  const handlePartnerChange = (partnerId: string) => {
    console.log("Partner changed to:", partnerId);
    
    // Find the partner object for the password modal
    const partnerObj = partners.find(p => p.slug === partnerId) || null;
    setSelectedPartnerObj(partnerObj);
    
    // Reset welcome message visibility when changing partners
    setShowWelcome(true);
    
    // Check if this partner is already authorized
    if (authorizedPartners.includes(partnerId)) {
      // Already authorized, no need for password verification
      setSelectedPartner(partnerId);
      setFilters({
        ...initialFilters,
        partnerId: partnerId
      });
    } else {
      // Not authorized, show password modal
      setIsPasswordModalOpen(true);
      // Don't set the selected partner yet until password is verified
    }
  };
  
  // Check if a partner is already authorized when the component mounts
  useEffect(() => {
    const checkPartnerAuthorization = async () => {
      if (selectedPartnerObj?.slug) {
        try {
          const response = await apiRequest('GET', `/api/partner-access/${selectedPartnerObj.slug}`);
          const data = await response.json();
          
          if (data.authorized) {
            // If already authorized, add to the authorized list
            setAuthorizedPartners(prev => 
              prev.includes(selectedPartnerObj.slug) 
                ? prev 
                : [...prev, selectedPartnerObj.slug]
            );
          }
        } catch (error) {
          console.error("Failed to check partner authorization:", error);
        }
      }
    };
    
    checkPartnerAuthorization();
  }, [selectedPartnerObj]);
  
  // Handle password verification
  const handlePasswordVerified = () => {
    if (selectedPartnerObj?.slug) {
      // Add to authorized partners list
      setAuthorizedPartners(prev => 
        prev.includes(selectedPartnerObj.slug) 
          ? prev 
          : [...prev, selectedPartnerObj.slug]
      );
      
      // Close modal
      setIsPasswordModalOpen(false);
      
      // Now set the selected partner to load resources
      setSelectedPartner(selectedPartnerObj.slug);
      setFilters({
        ...initialFilters,
        partnerId: selectedPartnerObj.slug
      });
    }
  };

  // Build query string for API request
  const filterQuery = buildFilterQueryString(filters);
  
  // Log the filter query for debugging
  console.log("Filter query:", filterQuery);
  console.log("Selected partner:", selectedPartner);
  console.log("Filters:", filters);
  
  // Fetch resources based on filter
  const { 
    data: resources = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Resource[]>({
    queryKey: [`/api/resources?${filterQuery}`],
    enabled: !!selectedPartner, // Only run query if partner is selected
    retry: 1, // Limit retries on failure
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
      {/* Partner Password Modal */}
      <PartnerPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        partner={selectedPartnerObj}
        onPasswordVerified={handlePasswordVerified}
      />
      
      {/* Filter Sidebar - Desktop */}
      <aside className="hidden md:block bg-white border-r border-neutral-200 w-64 md:flex-shrink-0 overflow-y-auto h-screen">
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
      <div className="flex-grow overflow-auto p-4 md:p-6 lg:p-8 bg-neutral-50">
        {/* Partner Selector */}
        <div className="md:hidden mb-6">
          <PartnerSelector
            selectedPartner={selectedPartner}
            onPartnerChange={handlePartnerChange}
          />
        </div>

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
            <h2 className="text-2xl font-semibold text-neutral-800 mb-1">Resources</h2>
            {resources && (
              <p className="text-sm text-neutral-600">
                Showing {resources.length} resources relevant to your partnership
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-4 mt-3 md:mt-0">
            <div className="hidden md:block md:self-center">
              <PartnerSelector
                selectedPartner={selectedPartner}
                onPartnerChange={handlePartnerChange}
              />
            </div>
            
            <div className="flex items-center gap-2 self-end">
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
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="default"
                  className="rounded-none px-2 h-full"
                  onClick={() => setViewMode('card')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="default"
                  className="rounded-none px-2 h-full"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Hero - show when partner is selected and showWelcome is true */}
        {selectedPartner && partners.length > 0 && showWelcome && (
          <div className="mb-6 bg-gradient-to-r from-primary/10 to-white border border-primary/20 rounded-lg overflow-hidden relative">
            <div className="flex items-center p-6">
              <div className="flex-shrink-0 mr-6">
                {selectedPartner === 'pme' ? (
                  <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center border border-primary/20 overflow-hidden">
                    <img src="/pme-logo.png" alt="PME Logo" className="h-10 w-10 object-contain" />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center border border-primary/20">
                    <Info className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-primary">
                  Welcome, {partners.find(p => p.slug === selectedPartner)?.name || ''}
                </h2>
                <p className="text-neutral-600 mt-1">
                  This portal provides exclusive access to Sofar Ocean resources tailored for your needs. Browse, search, or ask questions about any resource.
                </p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <LayoutGrid className="h-3 w-3 mr-1" /> Browse Resources
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <Search className="h-3 w-3 mr-1" /> Search Content
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" /> Ask AI Questions
                  </span>
                </div>
              </div>
              
              {/* Close button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2" 
                onClick={() => setShowWelcome(false)}
              >
                <X className="h-4 w-4 text-neutral-500" />
              </Button>
            </div>
          </div>
        )}
        
        {/* AI Question Box */}
        {selectedPartner && (
          <QuestionBox
            partnerId={selectedPartner}
            resources={resources}
          />
        )}
        
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-300">
            {resources.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Resources List View */}
        {viewMode === 'list' && resources && resources.length > 0 && (
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