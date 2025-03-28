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
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'slides':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'customer story':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'blog':
    case 'blog post':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'whitepaper':
    case 'whitepaper / research paper':
    case 'research paper':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'video':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'media':
      return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
    case 'partner enablement':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'webpage':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'branding':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border border-neutral-200 hover:border-blue-200 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={`${getTypeBadgeClasses(resource.type)} border px-3 py-1 rounded-md text-xs font-medium`}>
            {resource.type}
          </Badge>
          {resource.date && (
            <span className="text-xs text-neutral-500 font-medium">{resource.date}</span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-800 line-clamp-2 leading-tight mb-2">
          {resource.name}
        </h3>
        
        <p className="text-sm text-neutral-600 line-clamp-3 flex-grow">
          {resource.description}
        </p>
        
        <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end items-center">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-[#0066CC] hover:text-[#004B95] transition-colors"
          >
            View resource
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
