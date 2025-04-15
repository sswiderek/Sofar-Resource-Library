import { useState, useEffect } from "react";
import { Resource } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Sector
} from "recharts";
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
  RefreshCcw,
  PieChart as PieChartIcon,
  LayoutList
} from "lucide-react";
import { getResourceTypeClasses } from "@/lib/resourceTypeColors";
import { format } from "date-fns";

export default function AnalyticsDashboard() {
  const [popularResources, setPopularResources] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("popular");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Array of colors for pie chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
  
  // Function to calculate category statistics
  const calculateCategoryStats = () => {
    if (!allResources || allResources.length === 0) return [];
    
    // Group resources by type
    const typeCount: { [key: string]: number } = {};
    const typeViews: { [key: string]: number } = {};
    const typeShares: { [key: string]: number } = {};
    const typeDownloads: { [key: string]: number } = {};
    
    allResources.forEach(resource => {
      const type = resource.type;
      // Count resources by type
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // Sum metrics by type
      typeViews[type] = (typeViews[type] || 0) + (resource.viewCount || 0);
      typeShares[type] = (typeShares[type] || 0) + (resource.shareCount || 0);
      typeDownloads[type] = (typeDownloads[type] || 0) + (resource.downloadCount || 0);
    });
    
    // Convert to array for charts
    return Object.keys(typeCount).map((type, index) => ({
      name: type,
      value: typeViews[type], // Using views as the primary metric
      count: typeCount[type],
      views: typeViews[type],
      shares: typeShares[type],
      downloads: typeDownloads[type],
      color: COLORS[index % COLORS.length]
    }));
  };
  
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

  // Fetch all resources for category analysis
  const fetchAllResources = async () => {
    try {
      const response = await fetch("/api/resources");
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllResources(data);
      } else {
        console.error("Received non-array response for all resources:", data);
        setAllResources([]);
      }
    } catch (error) {
      console.error("Error fetching all resources:", error);
      setAllResources([]);
    }
  };

  useEffect(() => {
    fetchPopularResources();
    fetchAllResources();
  }, []);

  const refreshData = () => {
    fetchPopularResources();
    fetchAllResources();
  };
  
  // Pie chart active segment handler
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  // Render active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
    return (
      <g>
        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#666">
          {`${value} views (${(percent * 100).toFixed(1)}%)`}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#999" fontSize={12}>
          {`${payload.count} resources`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 5}
          outerRadius={innerRadius - 2}
          fill={fill}
        />
      </g>
    );
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
          <TabsTrigger value="categories">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Resource Categories
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
        
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
                <CardDescription>
                  Distribution of views by content type - click segments for details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {isLoading || allResources.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={calculateCategoryStats()}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                        >
                          {calculateCategoryStats().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Table Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Resources grouped by content type and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || allResources.length === 0 ? (
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
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Resources</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Avg Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculateCategoryStats()
                        .sort((a, b) => b.value - a.value) // Sort by views
                        .map((category) => (
                          <TableRow key={category.name}>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={getResourceTypeClasses(category.name)}
                                style={{ backgroundColor: category.color + '20' }}
                              >
                                {category.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {category.count}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="flex items-center justify-center">
                                <EyeIcon className="h-3 w-3 mr-1 text-blue-500" />
                                {category.views}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {(category.views / category.count).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
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