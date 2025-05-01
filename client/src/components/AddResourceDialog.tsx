import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, ExternalLink } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Link to the external resource analysis tool
const RESOURCE_TOOL_URL = "https://app.relevanceai.com/agents/bcbe5a/a54932ac-b885-4893-8dc3-29eb24fb0e09/8b7579d3-1d1e-45cc-bb39-9ffa7bff2adb/embed-chat?hide_tool_steps=false&hide_file_uploads=true&hide_conversation_list=true&bubble_style=agent&primary_color=%231E5BB0&bubble_icon=pd%2Fchat&input_placeholder_text=Simply+insert+a+URL+and+click+Submit%21&hide_logo=false&hide_description=false";

// Link to the Notion database
const NOTION_DB_URL = "https://www.notion.so/sofarocean/1ac8ff95945081eda6d6d0538f2eed87?v=1ac8ff9594508161bf7c000c0d182979&pvs=4";

export function AddResourceDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenTool = () => {
    // Open the tool in a new tab
    window.open(RESOURCE_TOOL_URL, "_blank", "noopener,noreferrer");
    
    // Close the dialog
    setOpen(false);
    
    // Show a toast with instructions
    toast({
      title: "Resource Tool Opened",
      description: "The resource creation tool is now open in a new tab."
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="text-sm font-medium gap-1.5 h-8 bg-white hover:bg-blue-50 text-blue-700 border border-blue-100 shadow-sm transition-all">
          <PlusCircle className="h-4 w-4" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add a New Resource</DialogTitle>
          <DialogDescription>
            Use our AI-powered tool to easily add resources to the library.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
            <h4 className="font-medium text-blue-700 mb-2">How it works:</h4>
            <ol className="list-decimal pl-5 text-blue-800 space-y-2">
              <li>Click the button below to open our content analysis tool</li>
              <li>Enter the URL of the resource you want to add</li>
              <li>The AI will analyze the content and create a new resource</li>
              <li>The resource will appear in the Notion database</li>
              <li>After Notion sync, it will appear in this Resource Library</li>
            </ol>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button 
              onClick={handleOpenTool}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Resource Tool
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700 gap-2"
              onClick={() => window.open(NOTION_DB_URL, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              View Notion Database
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}