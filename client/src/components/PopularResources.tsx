import { useEffect, useState } from "react";
import { Resource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, TrendingUp, ArrowRight } from "lucide-react";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";

export default function PopularResources() {
  const [popularResources, setPopularResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { trackView } = useResourceTracking();
  const [viewedResources, setViewedResources] = useState<Record<number, boolean>>({});
  
  // Use proper fetch directly
  useEffect(() => {
    const fetchPopularResources = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/resources/popular");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        if (Array.isArray(data)) {
          setPopularResources(data);
        } else {
          console.error("Received non-array response:", data);
          setPopularResources([]);
        }
      } catch (error) {
        console.error("Error fetching popular resources:", error);
        setPopularResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularResources();
    
    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(fetchPopularResources, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Popular Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3 items-center">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (popularResources.length === 0) {
    return (
      <Card className="bg-white border border-neutral-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Popular Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 text-sm">
            No usage data available yet. Resources will appear here as they are viewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-neutral-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Popular Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {popularResources.map((resource) => (
            <li key={resource.id} className="group">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col space-y-1 hover:bg-neutral-50 rounded-md p-2 -mx-2 transition-colors"
                onClick={(e) => {
                  // Prevent the default behavior temporarily
                  e.preventDefault();
                  
                  // If we haven't tracked a view for this resource yet, do so
                  if (!viewedResources[resource.id]) {
                    trackView(resource.id);
                    setViewedResources(prev => ({...prev, [resource.id]: true}));
                  }
                  
                  // Open the URL in a new tab
                  window.open(resource.url, "_blank", "noopener,noreferrer");
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800 line-clamp-1 flex-grow">
                    {resource.name}
                  </span>
                  <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} shrink-0 ml-2 text-xs`}>
                    {resource.type}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    <span>{resource.viewCount || 0} views</span>
                  </div>
                  <div className="flex items-center text-primary">
                    <span>View</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}