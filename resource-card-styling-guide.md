# Sofar Resource Card Styling Guide

This document provides detailed instructions on how to implement the resource card styling from the Sofar Resource Library in other Replit projects.

## Card Design Overview

The resource cards in our application have the following key features:

1. **Color-coded top border** - Thin color strip at the top of each card that corresponds to the resource type
2. **Consistent spacing and typography** - Careful padding and font sizing for optimal readability
3. **Visual indicators** - Lock icon for internal-only resources with amber/gold border
4. **Interactive elements** - Hover effects, view counts, and edit options
5. **Responsive design** - Cards adapt well to different screen sizes

## Implementation Steps

### 1. Required Dependencies

Ensure your project has the following dependencies installed:

```bash
npm install lucide-react @radix-ui/react-dropdown-menu tailwindcss tailwind-merge
```

### 2. Card Component Implementation

Create a `ResourceCard.tsx` component with the following structure:

```tsx
import { ArrowRight, Eye, Lock, ExternalLink, Edit } from "lucide-react";

interface Resource {
  id: number;
  name: string;
  type: string;
  description: string;
  url: string;
  date?: string;
  viewCount?: number;
  contentVisibility?: string;
  notionId?: string;
}

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  // Implementation of click handlers and other functionality...
  
  // Check if resource is internal only
  const isInternalOnly = resource.contentVisibility === "internal";

  return (
    <div 
      className={`bg-white overflow-hidden hover:shadow-md transition-all duration-200 hover:translate-y-[-2px] border h-full flex flex-col cursor-pointer
        ${isInternalOnly ? 'border-amber-300' : 'border-neutral-200 hover:border-blue-200'}`}
      onClick={() => window.open(resource.url, "_blank", "noopener,noreferrer")}
    >
      <div className={`h-1.5 ${getResourceTypeColor(resource.type)}`}></div>
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
      <div className="p-3 sm:p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className={`${getResourceTypeBadgeClasses(resource.type)} border px-2 py-1 rounded-md text-xs font-medium max-w-[65%] truncate`}>
            {resource.type}
          </div>
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
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-neutral-500">
              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
              <span>{resource.viewCount || 0} views</span>
            </div>
            
            {/* Edit button with dropdown - implementation varies */}
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
```

### 3. Resource Type Color Utilities

Create a utility file called `resourceTypeColors.ts` to handle color mapping:

```typescript
/**
 * Get color classes for card header bars based on resource type
 */
export const getResourceTypeColor = (type: string): string => {
  const typeKey = type.toLowerCase();
  
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-400"; // More distinct color for webinars
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
  // Add more type mappings as needed
  // Default fallback
  return "bg-blue-300";
};

/**
 * Get color classes for resource type badges/labels
 */
export const getResourceTypeBadgeClasses = (type: string): string => {
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
  // Add more type mappings as needed
  // Default fallback
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
};
```

### 4. View Count Implementation

To implement view count tracking, create a custom hook:

```typescript
import { useState, useCallback } from 'react';

export function useResourceTracking() {
  const [isTracking, setIsTracking] = useState(false);

  // Track a resource view
  const trackView = useCallback(async (resourceId: number) => {
    try {
      setIsTracking(true);
      const response = await fetch(`/api/resources/${resourceId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to track resource view');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking resource view:', error);
    } finally {
      setIsTracking(false);
    }
  }, []);

  return {
    isTracking,
    trackView,
  };
}
```

### 5. Responsive Layout Guidelines

Ensure your Tailwind configuration includes these breakpoints:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '480px', // Custom breakpoint for extra small devices
      },
    },
  },
  // ...
}
```

## Key Styling Features

### Color Palette for Resource Types

| Resource Type | Header Bar Color | Badge Background | Badge Text |
|---------------|------------------|-----------------|------------|
| Webinar | bg-cyan-400 | bg-cyan-100 | text-cyan-700 |
| Slides | bg-teal-300 | bg-teal-100 | text-teal-700 |
| Customer Story | bg-indigo-300 | bg-indigo-100 | text-indigo-700 |
| Blog | bg-amber-300 | bg-amber-100 | text-amber-700 |
| Whitepaper | bg-purple-300 | bg-purple-100 | text-purple-700 |
| Video | bg-red-300 | bg-red-100 | text-red-700 |
| One-Pager | bg-green-500 | bg-green-100 | text-green-700 |

### Special Visual Indicators

#### Internal-Only Resources

```tsx
// Add this to resource cards that are for internal use only
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
```

#### View Count Display

```tsx
<div className="flex items-center text-xs text-neutral-500">
  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
  <span>{resource.viewCount || 0} views</span>
</div>
```

### Interactive Elements

#### Card Hover Effect

```css
.resource-card {
  transition: all 200ms;
}

.resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border-color: #bfdbfe; /* blue-200 */
}
```

## Server-Side Implementation (Optional)

To fully implement view count tracking, you'll need server-side endpoints:

```typescript
// Example Express route
app.post("/api/resources/:id/view", async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    // Update view count in your database
    const updatedResource = await storage.incrementResourceViewCount(resourceId);
    
    return res.json(updatedResource);
  } catch (error) {
    console.error("Error updating view count:", error);
    return res.status(500).json({ error: "Failed to update view count" });
  }
});
```

## Final Notes

1. The card design emphasizes clean, minimalist aesthetics with targeted color accents
2. The thin (h-1.5) color bar at the top provides visual categorization without overwhelming the design
3. Content truncation (line-clamp-3) ensures consistent card heights while showing enough information
4. Responsive design elements ensure cards look good on all device sizes
5. Hover animations provide subtle feedback to improve user experience

Implementing these design principles will create consistent, visually appealing resource cards across different Replit projects.
