import { Client } from "@notionhq/client";
import { log } from "./vite";
import { InsertResource } from "@shared/schema";

/**
 * Helper function to extract and combine all rich text blocks from a Notion rich text field
 * @param richTextArray The rich_text array from a Notion property
 * @returns Combined string of all text content or empty string if no content
 */
function extractRichText(richTextArray: any[] | undefined): string {
  if (!richTextArray || !Array.isArray(richTextArray) || richTextArray.length === 0) {
    return "";
  }
  
  // Combine all rich text blocks into a single string
  return richTextArray.map(rt => rt.text?.content || "").join("");
}

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
    detailedDescription: "This comprehensive sales deck details the Spotter platform with specific information about the Dissolved Oxygen, Hydrophone, and Temperature sensors. The deck covers technical specifications, deployment methods, data collection capabilities, and real-world applications. It includes comparative analysis with competing products and highlights the key value propositions for government, defense, aquaculture, and marine construction sectors. The presentation explains data transmission protocols, battery life, maintenance requirements, and integration with existing systems.",
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
    
    // Format database ID if it doesn't have hyphens
    // Notion expects format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    if (databaseId.length === 32 && !databaseId.includes('-')) {
      databaseId = `${databaseId.slice(0, 8)}-${databaseId.slice(8, 12)}-${databaseId.slice(12, 16)}-${databaseId.slice(16, 20)}-${databaseId.slice(20)}`;
      log(`Formatted database ID to: ${databaseId}`);
    }
    
    log(`Using Notion database ID: ${databaseId}`);
    
    log("Fetching resources from Notion database...");
    
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    log(`Fetched ${response.results.length} resources from Notion`);
    
    // Transform Notion response into our Resource schema
    const resources: InsertResource[] = response.results.map((page: any) => {
      const properties = page.properties;
      
      // Log all property names once for debugging
      if (page === response.results[0]) {
        log("Available Notion properties: " + Object.keys(properties).join(", "));
      }
      
      return {
        name: properties.Title?.title?.[0]?.text?.content || 
              properties.Name?.title?.[0]?.text?.content || 
              "Untitled Resource",
              
        type: properties["Content Type"]?.select?.name || 
              properties.Type?.select?.name || 
              "Unknown",
              
        product: properties["Smart Mooring Sensor(s)"]?.multi_select?.map((p: any) => p.name) || 
                 properties.Solution?.multi_select?.map((p: any) => p.name) || 
                 properties.Product?.multi_select?.map((p: any) => p.name) || 
                 [],
                
        audience: properties["Market Segment(s)"]?.multi_select?.map((a: any) => a.name) || 
                 properties.Audience?.multi_select?.map((a: any) => a.name) || 
                 [],
                 
        teamRelevancy: properties.Partner?.multi_select?.map((p: any) => p.name.toLowerCase().replace(/\s+/g, '-')) || 
                         properties["Partner Relevancy"]?.multi_select?.map((p: any) => p.name.toLowerCase().replace(/\s+/g, '-')) || 
                         ["pme"],
                         
        messagingStage: properties["Stage in Buyer's Journey"]?.multi_select?.[0]?.name || 
                       properties["Key Topic or Messaging Stage"]?.select?.name || 
                       "Unknown",
                       
        // Map "Internal Use Only?" field to contentVisibility
        contentVisibility: properties["Internal Use Only?"]?.select?.name === "Y" ? "internal" :
                         properties["Internal Use Only?"]?.select?.name === "N" ? "external" :
                         "both",
                       
        date: properties["Last Updated"]?.date?.start || 
              properties.Date?.date?.start || 
              new Date().toISOString().split('T')[0],
              
        url: properties.Link?.url || 
            properties["URL/Link"]?.url || 
            "#",
            
        description: extractRichText(properties.Summary?.rich_text) || 
                    extractRichText(properties["AI-Generated Podcast"]?.rich_text) || 
                    extractRichText(properties.Description?.rich_text) || 
                    "",
                    
        detailedDescription: extractRichText(properties["Detailed description (for AI parsing)"]?.rich_text) || 
                            "",
                    
        notionId: page.id,
        lastSynced: new Date(),
      };
    });
    
    return resources;
  } catch (error) {
    // Log the error but return mock data so the app can still function
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error fetching resources from Notion: ${errorMessage}`);
    
    if (errorMessage.includes("Could not find database") || errorMessage.includes("object_not_found")) {
      log("INTEGRATION ACCESS ISSUE: Your Notion integration doesn't have access to the database.");
      log("Please follow the steps in notion-connection-guide.md to share your database with the integration.");
    } else if (errorMessage.includes("unauthorized") || errorMessage.includes("invalid_auth")) {
      log("AUTHENTICATION ISSUE: Your Notion API key may be invalid or expired.");
      log("Please check your NOTION_API_KEY environment variable and make sure it's correct.");
    } else {
      log("Unexpected error. Please check the error message above for details.");
    }
    
    log("Using mock resource data for demonstration until the Notion connection is fixed.");
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
