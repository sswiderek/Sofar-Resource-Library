import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkIcon, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddResourceUrlProps {
  onResourceAdded?: () => void;
}

export default function AddResourceUrl({ onResourceAdded }: AddResourceUrlProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // To control the expanded state
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to analyze",
        variant: "destructive"
      });
      return;
    }

    // Add http/https if missing
    let processedUrl = url;
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = 'https://' + processedUrl;
    }

    setIsLoading(true);

    try {
      // Open the external relevance AI service in a new window/tab
      window.open("https://app.relevanceai.com/agents/bcbe5a/a54932ac-b885-4893-8dc3-29eb24fb0e09/8b7579d3-1d1e-45cc-bb39-9ffa7bff2adb/embed-chat?hide_tool_steps=false&hide_file_uploads=true&hide_conversation_list=true&bubble_style=agent&primary_color=%231E5BB0&bubble_icon=pd%2Fchat&input_placeholder_text=Simply+insert+a+URL+and+click+Submit%21&hide_logo=false&hide_description=false", "_blank");

      // Reset form
      setUrl('');
      setIsOpen(false);
      
      // Notify parent if needed
      if (onResourceAdded) {
        onResourceAdded();
      }

      toast({
        title: "Analysis Started",
        description: "The URL analysis tool has been opened in a new tab."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white border-blue-100 hover:border-blue-200 transition-all overflow-hidden shadow-sm hover:shadow-md">
      {!isOpen ? (
        <CardHeader className="cursor-pointer pb-3" onClick={() => setIsOpen(true)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <LinkIcon className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-medium text-blue-700">Add Resource by URL</CardTitle>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-500" />
          </div>
          <CardDescription className="text-xs mt-1 text-neutral-500">
            Automatically analyze content from any URL and create a new resource
          </CardDescription>
        </CardHeader>
      ) : (
        <>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Add Resource by URL</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Paste a URL to analyze and create a new resource
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Input
                  type="text"
                  placeholder="https://example.com/resource"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <div className="text-xs text-neutral-500">
                  Our AI will analyze the content and extract relevant metadata
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)} 
                  type="button"
                  disabled={isLoading}
                  className="text-xs border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !url.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze URL'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
}
