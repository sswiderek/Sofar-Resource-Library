import { useState } from "react";
import { Resource } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, X, ExternalLink, Calendar, Users, BookOpen } from "lucide-react";
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
    }
  };

  // Handle resource download/open
  const handleDownload = async () => {
    // Track the download/view action
    await trackDownload(resource.id);
    
    // Open the resource URL in a new tab
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  // Handle iframe load complete
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Determine if the content should be embedded or displayed with iframe
  const canEmbed = () => {
    const url = resource.url.toLowerCase();
    // Most URLs can be embedded, but some services might restrict embedding
    // URLs from YouTube, Vimeo, PDFs, etc. can typically be embedded
    return !url.includes("linkedin.com"); // Example of a site that typically blocks embedding
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
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
              className="h-8 w-8" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-xl">{resource.name}</DialogTitle>
          <DialogDescription>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm my-2">
              {resource.date && (
                <div className="flex items-center text-neutral-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{resource.date}</span>
                </div>
              )}
              {resource.audience && Array.isArray(resource.audience) && resource.audience.length > 0 && (
                <div className="flex items-center text-neutral-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{resource.audience.join(', ')}</span>
                </div>
              )}
              {resource.product && Array.isArray(resource.product) && resource.product.length > 0 && (
                <div className="flex items-center text-neutral-600">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{resource.product.join(', ')}</span>
                </div>
              )}
            </div>
            <p className="text-neutral-700 mt-2">{resource.description}</p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow min-h-[400px] relative rounded-md overflow-hidden border border-neutral-200 my-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          )}
          
          {canEmbed() ? (
            <iframe
              src={resource.url}
              className="w-full h-full"
              onLoad={handleIframeLoad}
              title={resource.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ExternalLink className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                This content needs to be viewed directly
              </h3>
              <p className="text-neutral-600 mb-4">
                Some resources can't be embedded within our portal. Click the button below to view the full content.
              </p>
              <Button onClick={handleDownload}>
                View Content
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}