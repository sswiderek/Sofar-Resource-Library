import { ArrowRight, Eye } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getResourceTypeClasses, getResourceGradient } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useState } from "react";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const { trackView } = useResourceTracking();
  const [viewCounted, setViewCounted] = useState(false);

  // Track view when resource is clicked
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
    <Card 
      className="bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border border-neutral-200 hover:border-blue-200 h-full flex flex-col cursor-pointer"
      onClick={handleResourceClick}
    >
      <div className={`h-1.5 ${getResourceGradient(resource.type)}`}></div>
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3 gap-2">
          <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} border px-2 py-1 rounded-md text-xs font-medium max-w-[65%] truncate`}>
            {resource.type}
          </Badge>
          {resource.date && (
            <span className="text-xs text-neutral-500 font-medium shrink-0">{resource.date}</span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-[#1e5bb0] line-clamp-3 leading-tight mb-3 hover:text-blue-700">
          {resource.name}
        </h3>
        
        <p className="text-sm text-neutral-600 line-clamp-4 flex-grow">
          {resource.description}
        </p>
        
        <div className="mt-3 pt-3 border-t border-blue-50 flex justify-between items-center">
          <div className="flex items-center text-xs text-neutral-500">
            <Eye className="h-3.5 w-3.5 mr-1 opacity-70" />
            <span>{resource.viewCount || 0} views</span>
          </div>
          <div className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
            <span>View Resource</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
