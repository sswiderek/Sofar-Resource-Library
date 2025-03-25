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

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border border-transparent hover:border-blue-200">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className={`${getTypeBadgeClasses(resource.type)} border-0 px-3 py-1 rounded-full font-medium`}>
            {resource.type}
          </Badge>
          <span className="text-xs text-neutral-500 font-medium">{resource.date}</span>
        </div>
        
        <h3 className="mt-3 text-lg font-semibold text-neutral-700 line-clamp-2 leading-tight">
          {resource.name}
        </h3>
        
        <p className="mt-2 text-sm text-neutral-500 line-clamp-3 mb-4">
          {resource.description}
        </p>
        
        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end items-center">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View resource
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
