import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Database, RefreshCcw, Settings, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSyncWithNotion = async () => {
    try {
      setIsSyncing(true);
      toast({
        title: "Sync started",
        description: "Syncing resources with Notion database...",
      });
      
      await apiRequest("POST", "/api/sync", {});
      
      toast({
        title: "Sync completed",
        description: "Resources have been updated from Notion.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync with Notion",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-primary" />
              Resource Analytics
            </CardTitle>
            <CardDescription>
              View usage statistics and resource popularity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Track views, shares, and downloads across all resources. Identify which content
              is most engaging and useful to your users.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/analytics">
              <Button className="w-full">
                View Analytics
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary" />
              Notion Sync
            </CardTitle>
            <CardDescription>
              Sync resources with Notion database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Manually trigger synchronization with your Notion database to update resources
              with the latest content and metadata.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSyncWithNotion} 
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Sync Resources
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary" />
              Admin Settings
            </CardTitle>
            <CardDescription>
              Configure application settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Manage admin users, API integrations, and configure general settings
              for the resource library.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Manage Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}