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
      const url = resource.url.toLowerCase();
      // Most URLs can be embedded, but some services might restrict embedding
      if (!url) return false;
      
      // Check for common sites that block embedding
      const nonEmbeddableDomains = [
        'linkedin.com',
        'facebook.com',
        'twitter.com',
        'instagram.com'
      ];
      
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      return !nonEmbeddableDomains.some(domain => hostname.includes(domain));
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
        <div className="flex flex-col items-center justify-center h-full p-6 bg-neutral-100">
          <div className="relative w-32 h-32 bg-neutral-200 rounded-full flex items-center justify-center mb-4">
            <ExternalLink className="h-12 w-12 text-primary" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-opacity-30"></div>
          </div>
          <h3 className="text-lg font-medium mb-2">Webinar Recording</h3>
          <p className="text-neutral-600 mb-4 max-w-md text-center">
            Click below to view the full webinar content
          </p>
        </div>
      );
    }
    
    if (type.includes('pdf') || type.includes('document') || type.includes('one-pager')) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-neutral-100">
          <div className="w-48 h-64 bg-white rounded-lg shadow-md flex items-center justify-center mb-4 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 skew-y-[20deg] origin-top-right"></div>
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Document Preview</h3>
          <p className="text-neutral-600 mb-4 max-w-md text-center">
            Click below to view the full document
          </p>
        </div>
      );
    }
    
    // Default preview
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-neutral-100">
        <div className="w-32 h-32 rounded-lg bg-neutral-200 flex items-center justify-center mb-4">
          <ExternalLink className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">Resource Preview</h3>
        <p className="text-neutral-600 mb-4 max-w-md text-center">
          Click below to access this resource
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start mb-2">
            <Badge 
              variant="outline" 
              className={`${getResourceTypeClasses(resource.type)} px-3 py-1 rounded-md text-xs font-medium`}
            >
              {resource.type}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-neutral-700 hover:bg-neutral-100" 
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
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
            <div className="text-neutral-700 mt-2">
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