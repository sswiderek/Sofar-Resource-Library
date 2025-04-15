import { ArrowRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";

interface ResourceListProps {
  resource: Resource;
}

export default function ResourceList({ resource }: ResourceListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] hover:border-blue-200">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="outline" className={`${getTypeBadgeClasses(resource.type)} border px-3 py-1 rounded-md text-xs font-medium`}>
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
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-6 flex sm:flex-col sm:justify-center">
          <Button 
            asChild
            className="px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all"
          >
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              View resource
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
