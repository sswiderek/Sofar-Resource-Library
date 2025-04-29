import { ArrowRight, Eye, Lock, ExternalLink, Edit } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getResourceTypeClasses, getResourceGradient } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useNotionDatabase } from "@/hooks/use-notion-database";
import { useState } from "react";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const { trackView } = useResourceTracking();
  const { url: notionDatabaseUrl, isAvailable: notionAvailable } = useNotionDatabase();
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
  
  // Handle edit in Notion click
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    if (notionDatabaseUrl) {
      window.open(notionDatabaseUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Check if resource is internal only
  const isInternalOnly = resource.contentVisibility === "internal";

  return (
    <Card 
      className={`bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border h-full flex flex-col cursor-pointer
        ${isInternalOnly ? 'border-amber-300' : 'border-neutral-200 hover:border-blue-200'}`}
      onClick={handleResourceClick}
    >
      <div className={`h-1.5 ${getResourceGradient(resource.type)}`}></div>
      {isInternalOnly && (
        <div 
          className="bg-amber-50 px-3 py-1.5 border-b border-amber-100 flex items-center justify-center" 
          title="This resource is for internal use only and should not be shared with external parties"
        >
          <div className="flex items-center text-amber-700 text-xs font-medium cursor-help">
            <Lock className="h-3 w-3 mr-1" />
            <span>Internal Use Only</span>
          </div>
        </div>
      )}
      <CardContent className="p-3 sm:p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3 gap-2">
          <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} border px-2 py-1 rounded-md text-xs font-medium max-w-[65%] truncate`}>
            {resource.type}
          </Badge>
          {resource.date && (
            <span className="text-xs text-neutral-500 font-medium shrink-0">{resource.date}</span>
          )}
        </div>
        
        <h3 className="text-base sm:text-lg font-semibold text-[#1e5bb0] line-clamp-3 leading-tight mb-2 sm:mb-3 hover:text-blue-700">
          {resource.name}
        </h3>
        
        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 sm:line-clamp-4 flex-grow">
          {resource.description}
        </p>
        
        <div className="mt-3 pt-3 border-t border-blue-50 flex justify-between items-center">
          <div className="flex items-center text-xs text-neutral-500">
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
            <span>{resource.viewCount || 0} views</span>
          </div>
          <div className="flex items-center gap-3">
            {notionAvailable && (
              <button 
                onClick={handleEditClick}
                className="flex items-center text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
                title="Edit in Notion Database"
              >
                <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <div className="flex items-center text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700">
              <span>View Resource</span>
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
