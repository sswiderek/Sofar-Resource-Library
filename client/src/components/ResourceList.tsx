import { ArrowRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResourceListProps {
  resource: Resource;
}

// Helper function to determine badge color by resource type
const getTypeBadgeClasses = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'webinar':
      return 'bg-blue-100 text-blue-800';
    case 'slides':
      return 'bg-green-100 text-green-800';
    case 'customer story':
      return 'bg-purple-100 text-purple-800';
    case 'blog':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
};

export default function ResourceList({ resource }: ResourceListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] hover:border-blue-200">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="outline" className={`${getTypeBadgeClasses(resource.type)} border-0 px-3 py-1 rounded-full font-medium`}>
              {resource.type}
            </Badge>
            <span className="text-xs text-neutral-500 font-medium">{resource.date}</span>
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-700 leading-tight">
            {resource.name}
          </h3>
          
          <p className="mt-2 text-sm text-neutral-500 mb-2">
            {resource.description}
          </p>
          
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.audience.slice(0, 3).map((aud) => (
              <Badge key={aud} variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full text-xs px-2.5 py-1">
                {aud}
              </Badge>
            ))}
            {resource.audience.length > 3 && (
              <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full text-xs px-2.5 py-1">
                +{resource.audience.length - 3} more
              </Badge>
            )}
          </div>
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
