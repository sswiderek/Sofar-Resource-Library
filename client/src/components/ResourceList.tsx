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
    case 'document':
      return 'bg-green-100 text-green-800';
    case 'message':
      return 'bg-purple-100 text-purple-800';
    case 'meeting recap':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
};

export default function ResourceList({ resource }: ResourceListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="outline" className={`${getTypeBadgeClasses(resource.type)} border-0`}>
              {resource.type}
            </Badge>
            <span className="text-xs text-neutral-500">{resource.date}</span>
            <span className="text-xs text-neutral-500 hidden sm:inline-block">•</span>
            <span className="text-xs text-neutral-500">
              Messaging: <span className="font-medium">{resource.messagingStage}</span>
            </span>
          </div>
          
          <h3 className="text-lg font-medium text-neutral-700">
            {resource.name}
          </h3>
          
          <p className="mt-1 text-sm text-neutral-500">
            {resource.description}
          </p>
          
          <div className="mt-3 flex flex-wrap gap-1">
            {resource.product.map((prod) => (
              <Badge key={prod} variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                {prod}
              </Badge>
            ))}
            
            {resource.audience.map((aud) => (
              <Badge key={aud} variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                {aud}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-6 flex sm:flex-col sm:justify-center">
          <Button 
            asChild
            className="w-full"
          >
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View resource
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
