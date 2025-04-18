/**
 * Utility function to determine badge/label color by resource type
 * This ensures consistent styling across different components
 * 
 * @param type The resource type string
 * @param variant Whether to return classes for badge or text styling
 * @returns A string of CSS classes for styling
 */

/**
 * Get color classes for card header bars based on resource type
 * 
 * @param type The resource type string
 * @returns A string of CSS classes for styling the header bar
 */
export const getResourceGradient = (type: string): string => {
  const typeKey = type.toLowerCase();
  
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-400"; // Changed from blue-300 to cyan-400 to make it more distinct
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
  } else if (typeKey.includes('media')) {
    return "bg-fuchsia-300";
  } else if (typeKey.includes('partner enablement')) {
    return "bg-green-300";
  } else if (typeKey.includes('webpage')) {
    return "bg-orange-300";
  } else if (typeKey.includes('branding')) {
    return "bg-pink-300";
  } else if (typeKey.includes('one-pager')) {
    return "bg-green-500"; // Kelly green color for One-Pager
  } else if (typeKey.includes('guide')) {
    return "bg-lime-300";
  } else if (typeKey.includes('fact sheet')) {
    return "bg-violet-300";
  } else if (typeKey.includes('infographic')) {
    return "bg-emerald-300";
  } else if (typeKey.includes('report')) {
    return "bg-rose-300";
  } else if (typeKey.includes('case study')) {
    return "bg-sky-300";
  } else if (typeKey.includes('spec')) {
    return "bg-green-300";
  } else if (typeKey.includes('booklet') || typeKey === 'booklet') {
    return "bg-indigo-300";
  } else if (typeKey.includes('other') || typeKey === 'other') {
    return "bg-neutral-300";
  } else {
    return "bg-blue-300";
  }
};
export const getResourceTypeClasses = (type: string, variant: 'badge' | 'text' = 'badge'): string => {
  const typeKey = type.toLowerCase();
  
  // Text class definitions (for use in inline text)
  if (variant === 'text') {
    if (typeKey.includes('webinar') || typeKey === 'webinar') {
      return "text-cyan-700"; // Changed from blue-700 to cyan-700 to match the new color
    } else if (typeKey.includes('slide') || typeKey === 'slides') {
      return "text-teal-700";
    } else if (typeKey.includes('customer story') || typeKey === 'customer story') {
      return "text-indigo-700";
    } else if (typeKey.includes('blog') || typeKey === 'blog post') {
      return "text-amber-700";
    } else if (typeKey.includes('whitepaper') || typeKey.includes('research paper')) {
      return "text-purple-700";
    } else if (typeKey.includes('video')) {
      return "text-red-700";
    } else if (typeKey.includes('media')) {
      return "text-fuchsia-700";
    } else if (typeKey.includes('partner enablement')) {
      return "text-green-700";
    } else if (typeKey.includes('webpage')) {
      return "text-orange-700";
    } else if (typeKey.includes('branding')) {
      return "text-pink-700";
    } else if (typeKey.includes('one-pager')) {
      return "text-green-700";
    } else if (typeKey.includes('guide')) {
      return "text-lime-700";
    } else if (typeKey.includes('fact sheet')) {
      return "text-violet-700";
    } else if (typeKey.includes('infographic')) {
      return "text-emerald-700";
    } else if (typeKey.includes('report')) {
      return "text-rose-700";
    } else if (typeKey.includes('case study')) {
      return "text-sky-700";
    } else if (typeKey.includes('spec')) {
      return "text-green-700";
    } else if (typeKey.includes('booklet') || typeKey === 'booklet') {
      return "text-indigo-700 font-medium";
    } else {
      return "text-neutral-700";
    }
  }

  // Badge class definitions (for use in badges/labels)
  if (typeKey.includes('webinar') || typeKey === 'webinar') {
    return "bg-cyan-100 text-cyan-700 border-cyan-200"; // Changed from blue to cyan for consistency
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
  } else if (typeKey.includes('media')) {
    return "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200";
  } else if (typeKey.includes('partner enablement')) {
    return "bg-green-100 text-green-700 border-green-200";
  } else if (typeKey.includes('webpage')) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  } else if (typeKey.includes('branding')) {
    return "bg-pink-100 text-pink-700 border-pink-200";
  } else if (typeKey.includes('one-pager')) {
    return "bg-green-100 text-green-700 border-green-200";
  } else if (typeKey.includes('guide')) {
    return "bg-lime-100 text-lime-700 border-lime-200";
  } else if (typeKey.includes('fact sheet')) {
    return "bg-violet-100 text-violet-700 border-violet-200";
  } else if (typeKey.includes('infographic')) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (typeKey.includes('report')) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  } else if (typeKey.includes('case study')) {
    return "bg-sky-100 text-sky-700 border-sky-200";
  } else if (typeKey.includes('spec')) {
    return "bg-green-100 text-green-700 border-green-200";
  } else if (typeKey.includes('booklet') || typeKey === 'booklet') {
    return "bg-indigo-100 text-indigo-700 border-indigo-200 font-medium";
  } else {
    return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
};