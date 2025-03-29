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
    case 'one-pager':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'guide':
      return 'bg-lime-100 text-lime-700 border-lime-200';
    case 'fact sheet':
      return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'infographic':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'report':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'case study':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

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
