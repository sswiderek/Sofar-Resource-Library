import { ArrowRight, Share2, Download, Eye } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ResourceListProps {
  resource: Resource;
}

export default function ResourceList({ resource }: ResourceListProps) {
  const { trackView, trackShare, trackDownload } = useResourceTracking();
  const { toast } = useToast();
  const [viewCounted, setViewCounted] = useState(false);

  // Track view once when component is mounted
  useEffect(() => {
    const trackResourceView = async () => {
      if (!viewCounted) {
        await trackView(resource.id);
        setViewCounted(true);
      }
    };
    
    trackResourceView();
  }, [resource.id, trackView, viewCounted]);

  // Handle resource sharing
  const handleShare = async () => {
    try {
      // Track the share action
      await trackShare(resource.id);
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: resource.name,
          text: resource.description,
          url: resource.url,
        });
      } else {
        // Fallback to copying the URL to clipboard
        await navigator.clipboard.writeText(resource.url);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share this resource with others",
        });
      }
    } catch (error) {
      console.error("Error sharing resource:", error);
    }
  };

  // Handle resource download/open
  const handleDownload = async () => {
    // Track the download/view action
    await trackDownload(resource.id);
    
    // Open the resource URL in a new tab
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] hover:border-blue-200">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} border px-3 py-1 rounded-md text-xs font-medium`}>
              {resource.type}
            </Badge>
            <span className="text-xs text-neutral-500 font-medium">{resource.date}</span>
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-700 leading-tight">
            {resource.name}
          </h3>
          
          <p className="mt-2 text-sm text-neutral-500 mb-3">
            {resource.description}
          </p>
          
          {resource.audience && resource.audience.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {resource.audience.map((segment, index) => (
                <span key={index} className="inline-flex text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                  {segment}
                </span>
              ))}
            </div>
          )}
          
          {/* Usage statistics */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
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
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-6 flex sm:flex-col sm:items-end gap-2">
          <Button 
            onClick={handleDownload}
            className="px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all"
          >
            <Download className="mr-1 h-4 w-4" />
            Download
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleShare}
            className="px-4"
          >
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
