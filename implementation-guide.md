# Implementing Sofar Resource Cards in Another Replit Project

This guide provides step-by-step instructions on how to implement the resource card styling from this project in another Replit application. We've created three documents to help with this implementation:

1. **resource-card-styling-guide.md** - Comprehensive explanation of card design principles and implementation details
2. **resource-card-visual-guide.md** - Visual representation of card components with CSS breakdowns
3. **resource-card-code-snippet.tsx** - Ready-to-use code snippet that can be adapted for your project

## Quick Start Implementation Guide

### Step 1: Set Up Required Dependencies

Ensure your project has these dependencies installed:

```bash
npm install lucide-react tailwindcss
```

If you're using shadcn UI components (recommended):

```bash
npm install class-variance-authority clsx tailwind-merge
```

### Step 2: Configure Tailwind CSS

Make sure your Tailwind configuration includes the necessary color palette and screen breakpoints:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
```

### Step 3: Copy Resource Type Color Utilities

Create a utility file (e.g., `resourceTypeColors.ts`) with color mapping functions for the resource type color indicators:

```typescript
export const getResourceTypeColor = (type: string): string => {
  const typeKey = type.toLowerCase();
  
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-400";
  } else if (typeKey.includes('slide') || typeKey === 'slides') {
    return "bg-teal-300";
  }
  // Add other type mappings as needed
  return "bg-blue-300"; // Default
};

export const getResourceTypeBadgeClasses = (type: string): string => {
  const typeKey = type.toLowerCase();
  
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-100 text-cyan-700 border-cyan-200";
  } else if (typeKey.includes('slide') || typeKey === 'slides') {
    return "bg-teal-100 text-teal-700 border-teal-200";
  }
  // Add other type mappings as needed
  return "bg-neutral-100 text-neutral-700 border-neutral-200"; // Default
};
```

### Step 4: Implement the Resource Card Component

Create a `ResourceCard.tsx` component by adapting the code from `resource-card-code-snippet.tsx`. The main structure is:

1. A card container with hover effects
2. A color bar at the top based on resource type
3. Optional internal-only indicator
4. Card content with type badge, date, title, and description
5. Card footer with view count and action button

### Step 5: Integrate View Count Tracking (Optional)

If you want to implement view count tracking, create a custom hook similar to `useResourceTracking.ts` and set up the necessary server endpoints.

## Key Design Principles

1. **Consistent Color System** - Each resource type has a specific color identity, making it easy to visually identify resource types
2. **Clean Visual Hierarchy** - Card elements are carefully spaced and sized to create a clear visual hierarchy
3. **Subtle Interactive Elements** - Hover effects and transitions provide feedback without being distracting
4. **Responsive Design** - Cards adapt seamlessly to different screen sizes with appropriate text truncation
5. **Special Indicators** - Visual cues for special resource types (like internal-only resources) with clear visual distinction

## Customization Options

The card design can be customized to match your application's branding:

1. **Color Palette** - Modify the color mapping in the utility functions to match your brand colors
2. **Typography** - Adjust font sizes, weights, and colors to match your typography system
3. **Card Shape** - Modify border radius, shadows, and padding to match your design language
4. **Badge Style** - Customize badge appearance by modifying the border, background, and text colors

## Additional Resources

For detailed implementation, refer to the full code files in this project:

- `client/src/components/ResourceCard.tsx` - Complete resource card implementation
- `client/src/lib/resourceTypeColors.ts` - Type-specific color utilities
- `client/src/hooks/use-resource-tracking.ts` - View count tracking logic

## Live Example

You can see the cards in action in this application. Study how they respond to different screen sizes and interaction states to better understand the design principles.
