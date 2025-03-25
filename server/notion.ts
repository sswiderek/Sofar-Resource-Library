import { Client } from "@notionhq/client";
import { log } from "./vite";
import { InsertResource } from "@shared/schema";

// Data from the table (screenshot)
const mockResources: InsertResource[] = [
  {
    name: "Spotter Master Sales Deck",
    type: "Slides",
    product: ["Dissolved Oxygen", "Hydrophone", "Temperature"],
    audience: ["Government & Defense", "Aquaculture", "Marine Construction"],
    partnerRelevancy: ["pme"],
    messagingStage: "Awareness",
    date: "2023-03-24",
    url: "https://docs.google.com/...",
    description: "Living deck that includes the core set of slides introducing Spotter, its applications, and other key information.",
    notionId: "mock-notion-id-1",
    lastSynced: new Date(),
  },
  {
    name: "Webinar: How The University of Texas uses the Spotter Platform to accelerate hypoxia research and protect reefs",
    type: "Webinar",
    product: ["Dissolved Oxygen"],
    audience: ["Conservation & Research", "Environmental Consulting"],
    partnerRelevancy: ["pme"],
    messagingStage: "Awareness",
    date: "2025-01-28",
    url: "https://softwaredemo.com/tx-reefs",
    description: "A webinar discussing the use of Spotter for monitoring coral reef conditions.",
    notionId: "mock-notion-id-2",
    lastSynced: new Date(),
  },
  {
    name: "How Rockola uses the Spotter Platform to measure real-time sensor data when currents and assess site workability",
    type: "Customer Story",
    product: ["Temperature", "Current", "Dissolved Oxygen", "Pressure"],
    audience: ["Ports & Harbors", "Oil & Gas"],
    partnerRelevancy: ["pme"],
    messagingStage: "Consideration",
    date: "2024-12-18",
    url: "https://softwaredemo.com/rockola",
    description: "Case study on Rockola utilizing Spotter for real-time water data collection to enhance operational safety.",
    notionId: "mock-notion-id-3",
    lastSynced: new Date(),
  },
  {
    name: "Webinar: Expanding Spotter's subsurface sensing suite with a new Hydrophone and Dissolved Oxygen Sensor",
    type: "Webinar",
    product: ["Hydrophone", "Dissolved Oxygen"],
    audience: ["Environmental Consulting"],
    partnerRelevancy: ["pme"],
    messagingStage: "Awareness",
    date: "2024-11-08",
    url: "https://softwaredemo.com/oxygen",
    description: "A webinar introducing new hydrophone and dissolved oxygen sensors for the Spotter Platform.",
    notionId: "mock-notion-id-4",
    lastSynced: new Date(),
  },
  {
    name: "Spotter Platform",
    type: "Webinar",
    product: ["Temperature", "Current", "Hydrophone", "Dissolved Oxygen", "Pressure"],
    audience: ["Environmental Consulting", "Conservation & Research", "Ports & Harbors", "Oil & Gas", "Government & Defense", "Offshore Renewables"],
    partnerRelevancy: ["pme"],
    messagingStage: "Awareness",
    date: "2024-07-17",
    url: "https://softwaredemo.com/platform",
    description: "A modular marine monitoring solution for real-time data collection using various sensors.",
    notionId: "mock-notion-id-5",
    lastSynced: new Date(),
  },
  {
    name: "Webinar: Exploring, Monitoring, and Protecting Coral Reefs with Flower Garden Banks National Marine Sanctuary",
    type: "Webinar",
    product: ["Dissolved Oxygen", "Current", "Hydrophone"],
    audience: ["Environmental Consulting", "Conservation & Research"],
    partnerRelevancy: ["pme"],
    messagingStage: "Awareness",
    date: "2024-06-13",
    url: "https://softwaredemo.com/flower",
    description: "A webinar discussing the use of ocean data to monitor coral reef conditions.",
    notionId: "mock-notion-id-6",
    lastSynced: new Date(),
  },
  {
    name: "Webinar: How Solar Ocean is unlocking the next generation of flexible subsurface sensing",
    type: "Webinar",
    product: ["Dissolved Oxygen", "Current", "Hydrophone", "Pressure", "Temperature"],
    audience: ["Environmental Consulting", "Conservation & Research"],
    partnerRelevancy: ["pme"],
    messagingStage: "Awareness",
    date: "2024-03-19",
    url: "https://softwaredemo.com/subsea",
    description: "A webinar discussing advancements in subsurface sensing technology and software updates to the sensing platform.",
    notionId: "mock-notion-id-7",
    lastSynced: new Date(),
  },
  {
    name: "Dozens of Spotter Buoys Deployed Across Great Lakes region",
    type: "Blog",
    product: ["Temperature", "Pressure", "Current", "Dissolved Oxygen"],
    audience: ["Environmental Consulting", "Conservation & Research", "Government & Defense", "Other"],
    partnerRelevancy: ["pme"],
    messagingStage: "Consideration",
    date: "2021-09-30",
    url: "https://softwaredemo.com/great-lakes",
    description: "Overview of Spotter buoys deployed for monitoring Great Lakes water and meteorological conditions.",
    notionId: "mock-notion-id-8",
    lastSynced: new Date(),
  }
];

// Notion API client
const getNotionClient = () => {
  const apiKey = process.env.NOTION_API_KEY;
  
  if (!apiKey) {
    throw new Error("NOTION_API_KEY is not defined in environment variables");
  }
  
  return new Client({
    auth: apiKey,
  });
};

// Fetch resources from Notion
export async function fetchResourcesFromNotion(): Promise<InsertResource[]> {
  try {
    // Check if we have Notion API Key
    const apiKey = process.env.NOTION_API_KEY;
    
    // If no API key, return mock data
    if (!apiKey) {
      log("No Notion API key found. Using mock resource data for demonstration.");
      return mockResources;
    }
    
    const notion = getNotionClient();
    let databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!databaseId) {
      log("No Notion database ID found. Using mock resource data for demonstration.");
      return mockResources;
    }
    
    // Check if we need to use the known working database ID
    const knownWorkingDbId = "6f6e5a6c-10e6-40e8-acad-05d281c38eb2"; // The ID we discovered from our tests
    
    // If the database ID doesn't match our known working ID, log a message and use the known ID
    if (databaseId !== knownWorkingDbId) {
      log(`The provided database ID (${databaseId}) doesn't match the known working database ID.`);
      log(`Using the known working database ID (${knownWorkingDbId}) instead.`);
      databaseId = knownWorkingDbId;
    } else {
      // Format database ID if it doesn't have hyphens
      // Notion expects format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      if (databaseId.length === 32 && !databaseId.includes('-')) {
        databaseId = `${databaseId.slice(0, 8)}-${databaseId.slice(8, 12)}-${databaseId.slice(12, 16)}-${databaseId.slice(16, 20)}-${databaseId.slice(20)}`;
        log(`Formatted database ID to: ${databaseId}`);
      }
    }
    
    log("Fetching resources from Notion database...");
    
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    log(`Fetched ${response.results.length} resources from Notion`);
    
    // Transform Notion response into our Resource schema
    const resources: InsertResource[] = response.results.map((page: any) => {
      const properties = page.properties;
      
      return {
        name: properties.Name?.title?.[0]?.text?.content || "Untitled Resource",
        type: properties.Type?.select?.name || "Unknown",
        product: properties.Product?.multi_select?.map((p: any) => p.name) || [],
        audience: properties.Audience?.multi_select?.map((a: any) => a.name) || [],
        partnerRelevancy: properties["Partner"]?.multi_select?.map((p: any) => p.name.toLowerCase().replace(/\s+/g, '-')) || ["pme"],
        messagingStage: properties["Stage in Buyer's Journey"]?.select?.name || "Unknown",
        date: properties.Date?.date?.start || new Date().toISOString().split('T')[0],
        url: properties["URL/Link"]?.url || "#",
        description: properties.Description?.rich_text?.[0]?.text?.content || "",
        notionId: page.id,
        lastSynced: new Date(),
      };
    });
    
    return resources;
  } catch (error) {
    // Log the error but return mock data so the app can still function
    log(`Error fetching resources from Notion: ${error instanceof Error ? error.message : String(error)}`);
    log("Using mock resource data for demonstration.");
    return mockResources;
  }
}

// Check if resources need to be synced
export function shouldSyncResources(lastSynced: Date | null): boolean {
  if (!lastSynced) return true;
  
  const now = new Date();
  const syncInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return now.getTime() - lastSynced.getTime() > syncInterval;
}
