import { ArrowRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ResourceCardProps {
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

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className={`${getTypeBadgeClasses(resource.type)} border-0`}>
            {resource.type}
          </Badge>
          <span className="text-xs text-neutral-500">{resource.date}</span>
        </div>
        
        <h3 className="mt-2 text-lg font-medium text-neutral-700 line-clamp-2">
          {resource.name}
        </h3>
        
        <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
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
        
        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center">
          <span className="text-xs text-neutral-500">
            Messaging: <span className="font-medium">{resource.messagingStage}</span>
          </span>
          
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark"
          >
            View resource
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
