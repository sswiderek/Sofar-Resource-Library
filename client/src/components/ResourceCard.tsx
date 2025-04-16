import { ArrowRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useState, useEffect } from "react";

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
        
        <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end items-center">
          <div className="flex items-center text-sm font-medium text-primary">
            <span>View Resource</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
