import { useState, useEffect } from "react";
import { Resource } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  EyeIcon, 
  Download, 
  Share2, 
  BarChart2, 
  TrendingUp, 
  Calendar,
  Clock,
  RefreshCcw
} from "lucide-react";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { format } from "date-fns";

export default function AnalyticsDashboard() {
  const [popularResources, setPopularResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("popular");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const fetchPopularResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/resources/popular?limit=20");
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setPopularResources(data);
        setLastSyncTime(new Date());
      } else {
        console.error("Received non-array response:", data);
        setPopularResources([]);
      }
    } catch (error) {
      console.error("Error fetching popular resources:", error);
      setPopularResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularResources();
  }, []);

  const refreshData = () => {
    fetchPopularResources();
  };

  const chartData = popularResources.slice(0, 10).map(resource => ({
    name: resource.name.length > 20 ? resource.name.substring(0, 20) + '...' : resource.name,
    views: resource.viewCount || 0,
    shares: resource.shareCount || 0,
    downloads: resource.downloadCount || 0
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-neutral-500 mt-1">
            Track resource usage and popularity across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSyncTime && (
            <div className="text-sm text-neutral-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {format(lastSyncTime, "MMM d, yyyy h:mm a")}
            </div>
          )}
          <Button onClick={refreshData} variant="outline" className="ml-4">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="popular" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="popular">
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular Resources
          </TabsTrigger>
          <TabsTrigger value="chart">
            <BarChart2 className="h-4 w-4 mr-2" />
            Usage Charts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Most Viewed Resources</CardTitle>
              <CardDescription>Resources ranked by number of views</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-3 items-center">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-center">Shares</TableHead>
                      <TableHead className="text-center">Downloads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                          >
                            {resource.name}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getResourceTypeClasses(resource.type)}>
                            {resource.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center">
                            <EyeIcon className="h-3 w-3 mr-1 text-blue-500" />
                            {resource.viewCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center">
                            <Share2 className="h-3 w-3 mr-1 text-green-500" />
                            {resource.shareCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center">
                            <Download className="h-3 w-3 mr-1 text-purple-500" />
                            {resource.downloadCount || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Overview</CardTitle>
              <CardDescription>Comparison of views, shares, and downloads for top resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 120,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#3b82f6" name="Views" />
                    <Bar dataKey="shares" fill="#10b981" name="Shares" />
                    <Bar dataKey="downloads" fill="#8b5cf6" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}