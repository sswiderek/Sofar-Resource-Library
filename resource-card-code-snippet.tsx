// ========================================================================
// Resource Card Component - Simplified Code Snippet for easy copying
// ========================================================================

import React from 'react';
import { ArrowRight, Eye, Lock, ExternalLink } from "lucide-react";

// Types
interface Resource {
  id: number;
  name: string;
  type: string;
  description: string;
  url: string;
  date?: string;
  viewCount?: number;
  contentVisibility?: string;
}

interface ResourceCardProps {
  resource: Resource;
}

// Color Utility Functions
const getResourceTypeColor = (type: string): string => {
  const typeKey = type.toLowerCase();
  
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-400";
  } else if (typeKey.includes('slide') || typeKey === 'slides') {
    return "bg-teal-300";
  } else if (typeKey.includes('customer story') || typeKey === 'customer story') {
    return "bg-indigo-300";
  } else if (typeKey.includes('blog') || typeKey === 'blog post') {
    return "bg-amber-300";
  } else if (typeKey.includes('whitepaper') || typeKey.includes('research paper')) {
    return "bg-purple-300";
  } else if (typeKey.includes('video')) {
    return "bg-red-300";
  } else if (typeKey.includes('one-pager')) {
    return "bg-green-500"; // Kelly green for One-Pager
  }
  return "bg-blue-300";
};

const getResourceTypeBadgeClasses = (type: string): string => {
  const typeKey = type.toLowerCase();
  
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-100 text-cyan-700 border-cyan-200";
  } else if (typeKey.includes('slide') || typeKey === 'slides') {
    return "bg-teal-100 text-teal-700 border-teal-200";
  } else if (typeKey.includes('customer story') || typeKey === 'customer story') {
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  } else if (typeKey.includes('blog') || typeKey === 'blog post') {
    return "bg-amber-100 text-amber-700 border-amber-200";
  } else if (typeKey.includes('whitepaper') || typeKey.includes('research paper')) {
    return "bg-purple-100 text-purple-700 border-purple-200";
  } else if (typeKey.includes('video')) {
    return "bg-red-100 text-red-700 border-red-200";
  } else if (typeKey.includes('one-pager')) {
    return "bg-green-100 text-green-700 border-green-200";
  }
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
};

// Resource Card Component
export default function ResourceCard({ resource }: ResourceCardProps) {
  // Check if resource is internal only
  const isInternalOnly = resource.contentVisibility === "internal";

  // Handle resource click (open URL & track view)
  const handleResourceClick = () => {
    // Track view logic would go here
    
    // Open the resource URL in a new tab
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div 
      className={`bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border h-full flex flex-col cursor-pointer
        ${isInternalOnly ? 'border-amber-300' : 'border-neutral-200 hover:border-blue-200'}`}
      onClick={handleResourceClick}
    >
      {/* Color bar at top of card */}
      <div className={`h-1.5 ${getResourceTypeColor(resource.type)}`}></div>
      
      {/* Internal use indicator */}
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
      
      {/* Card content */}
      <div className="p-3 sm:p-5 flex flex-col h-full">
        {/* Card header with type badge and date */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className={`${getResourceTypeBadgeClasses(resource.type)} border px-2 py-1 rounded-md text-xs font-medium max-w-[65%] truncate`}>
            {resource.type}
          </div>
          {resource.date && (
            <span className="text-xs text-neutral-500 font-medium shrink-0">{resource.date}</span>
          )}
        </div>
        
        {/* Resource title */}
        <h3 className="text-base sm:text-lg font-semibold text-[#1e5bb0] line-clamp-3 leading-tight mb-2 sm:mb-3 hover:text-blue-700">
          {resource.name}
        </h3>
        
        {/* Resource description */}
        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 sm:line-clamp-4 flex-grow">
          {resource.description}
        </p>
        
        {/* Card footer with view count and actions */}
        <div className="mt-3 pt-3 border-t border-blue-50 flex justify-between items-center">
          <div className="flex items-center text-xs text-neutral-500">
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
            <span>{resource.viewCount || 0} views</span>
          </div>
          
          <div className="flex items-center text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700">
            <span>View Resource</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
