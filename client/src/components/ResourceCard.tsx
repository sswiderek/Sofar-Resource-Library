import { ArrowRight } from "lucide-react";
import { Resource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="bg-gradient-to-br from-neutral-900 to-black overflow-hidden hover:shadow-lg transition-all duration-200 hover:translate-y-[-2px] border border-neutral-800 hover:border-cyan-900 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={`${getResourceTypeClasses(resource.type)} border px-3 py-1 rounded-md text-xs font-medium`}>
            {resource.type}
          </Badge>
          {resource.date && (
            <span className="text-xs text-neutral-400 font-medium">{resource.date}</span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-white line-clamp-3 leading-tight mb-3">
          {resource.name}
        </h3>
        
        <p className="text-sm text-neutral-300 line-clamp-4 flex-grow">
          {resource.description}
        </p>
        
        <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-end items-center">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View resource
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
