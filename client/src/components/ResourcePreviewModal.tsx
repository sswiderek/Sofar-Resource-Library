import { useState, useEffect } from "react";
import { Resource } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, X, ExternalLink, Calendar, Users, BookOpen, AlertTriangle } from "lucide-react";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { useResourceTracking } from "@/hooks/use-resource-tracking";
import { useToast } from "@/hooks/use-toast";

interface ResourcePreviewModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourcePreviewModal({ 
  resource, 
  isOpen, 
  onClose 
}: ResourcePreviewModalProps) {
  const { trackShare, trackDownload } = useResourceTracking();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  // Reset loading and error states when a new resource is opened
  useEffect(() => {
    if (isOpen && resource) {
      setIsLoading(true);
      setLoadError(false);
    }
  }, [isOpen, resource?.id]);

  if (!resource) return null;

  // Handle resource sharing
  const handleShare = async () => {
    try {
      // Track the share action
      await trackShare(resource.id);
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: resource.name,
          text: resource.description,
          url: resource.url,
        });
      } else {
        // Fallback to copying the URL to clipboard
        await navigator.clipboard.writeText(resource.url);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share this resource with others",
        });
      }
    } catch (error) {
      console.error("Error sharing resource:", error);
      toast({
        title: "Sharing failed",
        description: "Could not share this resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle resource download/open
  const handleDownload = async () => {
    try {
      // Track the download/view action
      await trackDownload(resource.id);
      
      // Open the resource URL in a new tab
      window.open(resource.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening resource:", error);
      toast({
        title: "Failed to open resource",
        description: "Could not open this resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle iframe load complete
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  // Determine if the content should be embedded or displayed with iframe
  const canEmbed = () => {
    try {
      const url = resource.url?.toLowerCase();
      // Most URLs can't be embedded properly, so we'll default to our custom previews
      // This ensures a consistent user experience across different resource types
      
      // Only attempt to embed content in these specific cases
      if (!url) return false;
      
      // YouTube and Vimeo videos are safe to embed
      if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
        return true;
      }
      
      // Google Docs/Slides/Sheets with proper embed links
      if (url.includes('docs.google.com') && url.includes('pub?embedded=true')) {
        return true;
      }
      
      // Known embeddable PDF URLs
      if (url.endsWith('.pdf') && (url.includes('drive.google.com') || url.includes('storage.googleapis.com'))) {
        return true;
      }
      
      // For all other URLs, use our custom previews
      return false;
    } catch (e) {
      // If the URL is invalid, don't try to embed
      console.error("Invalid URL:", resource.url);
      return false;
    }
  };

  // Generate a thumbnail/preview based on resource type
  const getResourcePreview = () => {
    const type = resource.type?.toLowerCase() || '';
    
    if (type.includes('webinar') || type.includes('video')) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-blue-50 to-blue-100">
          <div className="relative w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">{type.includes('webinar') ? 'Webinar Recording' : 'Video Content'}</h3>
          <p className="text-gray-600 mb-4 max-w-md text-center">
            {resource.name}
          </p>
          <div className="text-sm text-gray-500 mb-2">
            {resource.date && <span>Recorded on {resource.date}</span>}
          </div>
        </div>
      );
    }
    
    if (type.includes('blog')) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-amber-50 to-amber-100">
          <div className="w-64 max-w-full bg-white rounded-lg shadow-lg flex flex-col mb-6 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-amber-400 to-orange-400 p-4 flex items-end">
              <div className="text-white font-bold">{resource.type}</div>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-800 line-clamp-2">{resource.name}</h4>
              <p className="text-xs text-gray-500 mt-2">{resource.date}</p>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">Blog Article</h3>
          <p className="text-gray-600 mb-2 max-w-md text-center line-clamp-2">
            {resource.description}
          </p>
        </div>
      );
    }
    
    if (type.includes('pdf') || type.includes('document') || type.includes('one-pager') || type.includes('case study')) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="w-52 h-72 bg-white rounded-lg shadow-lg flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 shadow-md"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-600 skew-y-[20deg] origin-top-right shadow-sm"></div>
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-gray-100 to-gray-200"></div>
            <div className="absolute inset-x-8 top-28 h-2 bg-gray-200 rounded"></div>
            <div className="absolute inset-x-8 top-32 h-2 bg-gray-200 rounded"></div>
            <div className="absolute inset-x-8 top-36 h-2 bg-gray-200 rounded"></div>
            <div className="absolute inset-x-8 top-40 h-2 bg-gray-200 rounded"></div>
            <div className="absolute inset-x-8 top-44 h-2 bg-gray-200 rounded"></div>
            <div className="z-10">
              <BookOpen className="h-16 w-16 text-primary opacity-60" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">
            {type.includes('case study') ? 'Case Study' : 
             type.includes('one-pager') ? 'One-Pager' : 'Document'}
          </h3>
          <p className="text-gray-600 mb-2 max-w-md text-center">
            {resource.name}
          </p>
          <div className="text-sm text-gray-500">
            {resource.date && <span>{resource.date}</span>}
          </div>
        </div>
      );
    }
    
    // Default preview
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="w-40 h-40 rounded-lg bg-white shadow-lg flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20"></div>
          <div className="z-10 p-4 rounded-full bg-white">
            {type.toLowerCase().includes('spec sheet') ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-primary">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            ) : (
              <ExternalLink className="h-12 w-12 text-primary" />
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800">{resource.type || 'Resource'}</h3>
        <p className="text-gray-600 mb-2 max-w-md text-center line-clamp-2">
          {resource.name}
        </p>
        <div className="text-sm text-gray-500">
          {resource.date && <span>{resource.date}</span>}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent 
        className="max-w-5xl w-full max-h-[90vh] flex flex-col" 
        onInteractOutside={(e) => {
          // Prevent the modal from reopening when mouse is released
          e.preventDefault();
        }}
        aria-describedby="resource-description">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start mb-2">
            <Badge 
              variant="outline" 
              className={`${getResourceTypeClasses(resource.type)} px-3 py-1 rounded-md text-xs font-medium`}
            >
              {resource.type}
            </Badge>
            {/* We're removing this button since DialogContent already has a built-in close button */}
          </div>
          <DialogTitle className="text-xl font-bold">{resource.name}</DialogTitle>
          <div className="mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm my-2">
              {resource.date && (
                <div className="flex items-center text-neutral-600">
                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{resource.date}</span>
                </div>
              )}
              {resource.audience && Array.isArray(resource.audience) && resource.audience.length > 0 && (
                <div className="flex items-center text-neutral-600">
                  <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{resource.audience.join(', ')}</span>
                </div>
              )}
              {resource.product && Array.isArray(resource.product) && resource.product.length > 0 && (
                <div className="flex items-center text-neutral-600">
                  <BookOpen className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{resource.product.join(', ')}</span>
                </div>
              )}
            </div>
            <div id="resource-description" className="text-neutral-700 mt-2">
              {resource.description}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow min-h-[400px] relative rounded-md overflow-hidden border border-neutral-200 my-4 bg-neutral-50">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-opacity-30 border-t-primary rounded-full mb-4"></div>
                <p className="text-sm text-neutral-600">Loading preview...</p>
              </div>
            </div>
          )}
          
          {canEmbed() ? (
            <>
              <iframe
                src={resource.url}
                className="w-full h-full"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title={resource.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
              
              {loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 bg-opacity-90">
                  <div className="flex flex-col items-center text-center max-w-md p-6">
                    <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Unable to display content
                    </h3>
                    <div className="text-neutral-600 mb-4">
                      We couldn't embed this resource. This may be due to security restrictions or content limitations.
                    </div>
                    <Button onClick={handleDownload}>
                      Open in New Tab
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {getResourcePreview()}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 bg-gradient-to-t from-neutral-100 to-transparent">
                <Button onClick={handleDownload} className="shadow-md">
                  View Full Content
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}