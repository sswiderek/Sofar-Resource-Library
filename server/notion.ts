import { Client } from "@notionhq/client";
import { log } from "./vite";
import { InsertResource } from "@shared/schema";

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
    const notion = getNotionClient();
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!databaseId) {
      throw new Error("NOTION_DATABASE_ID is not defined in environment variables");
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
    log(`Error fetching resources from Notion: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Check if resources need to be synced
export function shouldSyncResources(lastSynced: Date | null): boolean {
  if (!lastSynced) return true;
  
  const now = new Date();
  const syncInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return now.getTime() - lastSynced.getTime() > syncInterval;
}
