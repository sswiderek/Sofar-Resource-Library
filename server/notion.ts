import { Client } from "@notionhq/client";
import { log } from "./vite";
import { InsertResource } from "@shared/schema";

// Sample mock data for development/testing
const mockResources: InsertResource[] = [
  {
    name: "Training Webinar: Ship Safety Protocols",
    type: "Webinar",
    product: ["Safety Training", "Certification"],
    audience: ["Ship Captains", "Crew"],
    partnerRelevancy: ["oceanic-shipping", "coastal-maritime", "naval-operations"],
    messagingStage: "Awareness",
    date: "2025-03-20",
    url: "https://example.com/webinar-safety",
    description: "A comprehensive training webinar on the latest safety protocols for maritime vessels.",
    notionId: "mock-notion-id-1",
    lastSynced: new Date(),
  },
  {
    name: "Oil Tanker Operations Manual",
    type: "Document",
    product: ["Operations", "Safety Training"],
    audience: ["Ship Captains", "Engineers"],
    partnerRelevancy: ["oceanic-shipping", "coastal-maritime", "global-logistics"],
    messagingStage: "Education",
    date: "2025-03-15",
    url: "https://example.com/tanker-manual",
    description: "Detailed manual covering all aspects of oil tanker operations including loading, transport, and emergency procedures.",
    notionId: "mock-notion-id-2",
    lastSynced: new Date(),
  },
  {
    name: "Harbor Navigation Guidelines",
    type: "Document",
    product: ["Navigation", "Port Services"],
    audience: ["Ship Captains", "Harbor Masters"],
    partnerRelevancy: ["harbor-authority", "naval-operations", "coastal-maritime"],
    messagingStage: "Guidance",
    date: "2025-03-10",
    url: "https://example.com/harbor-navigation",
    description: "Guidelines for navigating busy harbor environments safely and efficiently.",
    notionId: "mock-notion-id-3",
    lastSynced: new Date(),
  },
  {
    name: "Fleet Management Solutions Presentation",
    type: "Presentation",
    product: ["Fleet Management", "Logistics"],
    audience: ["Executives", "Fleet Managers"],
    partnerRelevancy: ["global-logistics", "oceanic-shipping"],
    messagingStage: "Consideration",
    date: "2025-03-05",
    url: "https://example.com/fleet-presentation",
    description: "Presentation on our cutting-edge fleet management solutions to optimize operations.",
    notionId: "mock-notion-id-4",
    lastSynced: new Date(),
  },
  {
    name: "Maritime Regulations Update",
    type: "Newsletter",
    product: ["Compliance", "Legal Services"],
    audience: ["Compliance Officers", "Legal Teams"],
    partnerRelevancy: ["harbor-authority", "naval-operations", "oceanic-shipping", "coastal-maritime", "global-logistics"],
    messagingStage: "Awareness",
    date: "2025-03-01",
    url: "https://example.com/regulations-update",
    description: "Latest updates on maritime regulations and compliance requirements.",
    notionId: "mock-notion-id-5",
    lastSynced: new Date(),
  },
  {
    name: "Crew Training Certification Program",
    type: "Course",
    product: ["Training", "Certification"],
    audience: ["HR Managers", "Crew"],
    partnerRelevancy: ["oceanic-shipping", "coastal-maritime", "naval-operations"],
    messagingStage: "Decision",
    date: "2025-02-25",
    url: "https://example.com/crew-certification",
    description: "Comprehensive certification program for maritime crew members at all levels.",
    notionId: "mock-notion-id-6",
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
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!databaseId) {
      log("No Notion database ID found. Using mock resource data for demonstration.");
      return mockResources;
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
        partnerRelevancy: properties["Partner Relevancy"]?.multi_select?.map((p: any) => p.name.toLowerCase().replace(/\s+/g, '-')) || [],
        messagingStage: properties["Key Topic or Messaging Stage"]?.select?.name || "Unknown",
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
