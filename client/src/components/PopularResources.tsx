import { useEffect, useState } from "react";
import { Resource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { EyeIcon, Share2, Download, TrendingUp } from "lucide-react";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";

export default function PopularResources() {
  const [popularResources, setPopularResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getPopularResources } = useResourceTracking();

  useEffect(() => {
    const fetchPopularResources = async () => {
      try {
        setIsLoading(true);
        const resources = await getPopularResources(5);
        setPopularResources(resources);
      } catch (error) {
        console.error("Error fetching popular resources:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularResources();
  }, [getPopularResources]);

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
            No usage data available yet. Resources will appear here as they are viewed, shared, and downloaded.
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
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800 line-clamp-1 flex-grow">
                    {resource.name}
                  </span>
                  <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} shrink-0 ml-2 text-xs`}>
                    {resource.type}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-neutral-500">
                  <div className="flex items-center">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    <span>{resource.viewCount || 0} views</span>
                  </div>
                  <div className="flex items-center">
                    <Share2 className="h-3 w-3 mr-1" />
                    <span>{resource.shareCount || 0} shares</span>
                  </div>
                  <div className="flex items-center">
                    <Download className="h-3 w-3 mr-1" />
                    <span>{resource.downloadCount || 0} downloads</span>
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