import { ArrowRight, Eye } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useState } from "react";

interface ResourceListProps {
  resource: Resource;
}

export default function ResourceList({ resource }: ResourceListProps) {
  const { trackView } = useResourceTracking();
  const [viewCounted, setViewCounted] = useState(false);

  // Handle resource click to open it
  const handleResourceClick = async () => {
    // Track the view action
    if (!viewCounted) {
      await trackView(resource.id);
      setViewCounted(true);
    }
    
    // Open the resource URL in a new tab
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] hover:border-blue-200 cursor-pointer"
      onClick={handleResourceClick}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} border px-2 py-1 rounded-md text-xs font-medium max-w-[200px] truncate`}>
              {resource.type}
            </Badge>
            <span className="text-xs text-neutral-500 font-medium shrink-0">{resource.date}</span>
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
          
          {/* Only show view statistics */}
          <div className="flex items-center mt-2 text-xs text-neutral-500">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              <span>{resource.viewCount || 0} views</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-6 flex sm:flex-col sm:items-end">
          <Button 
            variant="default"
            className="px-4"
            onClick={(e) => {
              e.stopPropagation(); // Prevent double-firing the parent click
              // We need to make sure we also track the view when the button is clicked directly
              if (!viewCounted) {
                trackView(resource.id);
                setViewCounted(true);
              }
              window.open(resource.url, "_blank", "noopener,noreferrer");
            }}
          >
            View Resource
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
