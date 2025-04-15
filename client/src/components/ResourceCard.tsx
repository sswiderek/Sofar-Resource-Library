import { ArrowRight, Share2, Download } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
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
    <Card className="bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border border-neutral-200 hover:border-blue-200 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} border px-3 py-1 rounded-md text-xs font-medium`}>
            {resource.type}
          </Badge>
          {resource.date && (
            <span className="text-xs text-neutral-500 font-medium">{resource.date}</span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-800 line-clamp-3 leading-tight mb-3">
          {resource.name}
        </h3>
        
        <p className="text-sm text-neutral-600 line-clamp-4 flex-grow">
          {resource.description}
        </p>
        
        <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-neutral-600 hover:text-neutral-900" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex items-center text-sm font-medium text-[#0066CC] hover:text-[#004B95] transition-colors"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
