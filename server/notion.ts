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

// No mock resources, we will only use real data from Notion
// This ensures we never see stale or inaccurate data

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
    
    // If no API key, return empty array to ensure we only show accurate data
    if (!apiKey) {
      log("IMPORTANT: No Notion API key found. Returning empty array.");
      log("Please set NOTION_API_KEY in your environment variables.");
      log("See notion-connection-guide.md for setup instructions.");
      return [];
    }
    
    const notion = getNotionClient();
    let databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!databaseId) {
      log("IMPORTANT: No Notion database ID found. Returning empty array.");
      log("Please set NOTION_DATABASE_ID in your environment variables.");
      log("See notion-connection-guide.md for setup instructions.");
      return [];
    }
    
    // Format database ID if it doesn't have hyphens
    // Notion expects format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    if (databaseId.length === 32 && !databaseId.includes('-')) {
      databaseId = `${databaseId.slice(0, 8)}-${databaseId.slice(8, 12)}-${databaseId.slice(12, 16)}-${databaseId.slice(16, 20)}-${databaseId.slice(20)}`;
      log(`Formatted database ID to: ${databaseId}`);
    }
    
    log(`Using Notion database ID: ${databaseId}`);
    
    log("Fetching resources from Notion database...");
    
    log(`Making real Notion API request to database: ${databaseId}`);
    // Force a fresh query with no caching
    const response = await notion.databases.query({
      database_id: databaseId,
      // No additional parameters - just a basic query
      // Adding a debug query param with timestamp to avoid any caching
      page_size: 100 // Ensure we get all results (up to 100) in a single query
    });
    
    log(`Fetched ${response.results.length} resources from Notion`);
    log(`Response timestamp: ${new Date().toISOString()}`); // Log when we got this response
    // Log ALL resource names for troubleshooting
    if (response.results.length > 0) {
      // Get all resource names for thorough debugging
      const allResources = response.results.map(page => {
        const properties = page.properties;
        return properties.Title?.title?.[0]?.text?.content || 
              properties.Name?.title?.[0]?.text?.content || 
              "Untitled Resource";
      });
      
      // Log all resources for thorough debugging
      log(`All resource names from Notion API (${allResources.length} total):`);
      for (let i = 0; i < allResources.length; i++) {
        log(`${i+1}. ${allResources[i]}`);
      }
      
      // Special check for problematic resources
      const problematicResources = allResources.filter(name => 
        name.includes("Temperature Sensor") || 
        name.includes("Spec Sheet")
      );
      
      if (problematicResources.length > 0) {
        log(`IMPORTANT - Found these problematic resources from Notion API: ${problematicResources.join(', ')}`);
      }
    }
    
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
              "",
              
        product: properties["Smart Mooring Sensor(s)"]?.multi_select?.map((p: any) => p.name) || 
                 properties.Product?.multi_select?.map((p: any) => p.name) || 
                 [],
                 
        solutions: properties.Solution?.multi_select?.map((s: any) => s.name) || 
                  [],
                
        audience: properties["Market Segment(s)"]?.multi_select?.map((a: any) => a.name) || 
                 properties.Audience?.multi_select?.map((a: any) => a.name) || 
                 [],
                 
        teamRelevancy: properties.Partner?.multi_select?.map((p: any) => p.name.toLowerCase().replace(/\s+/g, '-')) || 
                         properties["Partner Relevancy"]?.multi_select?.map((p: any) => p.name.toLowerCase().replace(/\s+/g, '-')) || 
                         ["pme"],
                         
        messagingStage: properties["Stage in Buyer's Journey"]?.multi_select?.[0]?.name || 
                       properties["Key Topic or Messaging Stage"]?.select?.name || 
                       "",
                       
        // Map "Publicly Shareable?" field to contentVisibility
        contentVisibility: properties["Publicly Shareable?"]?.select?.name === "No" ? "internal" :
                         properties["Publicly Shareable?"]?.select?.name === "Yes" ? "external" :
                         properties["Publicly Shareable?"]?.select?.name === "N" ? "internal" : // For backward compatibility
                         properties["Publicly Shareable?"]?.select?.name === "Y" ? "external" : // For backward compatibility
                         properties["Internal Use Only?"]?.select?.name === "Yes" ? "internal" : // For backward compatibility
                         properties["Internal Use Only?"]?.select?.name === "No" ? "external" : // For backward compatibility
                         "both",
                         
        // Check if this resource is "Partners Only"
        partnersOnly: (() => {
          // Get the resource name for logging
          const resourceName = properties.Title?.title?.[0]?.text?.content || 
                              properties.Name?.title?.[0]?.text?.content || 
                              "Untitled";
          
          // Log all properties for debugging
          const partnerOnlyField = properties["Partners Only?"];
          log(`DEBUG [${resourceName}] - Partners Only field exists: ${!!partnerOnlyField}`);
          
          if (partnerOnlyField) {
            log(`DEBUG [${resourceName}] - Partners Only field type: ${typeof partnerOnlyField}`);
            log(`DEBUG [${resourceName}] - Partners Only field value: ${JSON.stringify(partnerOnlyField)}`);
            
            // Check the 'select' property
            if (partnerOnlyField.select) {
              log(`DEBUG [${resourceName}] - Select exists, value: ${JSON.stringify(partnerOnlyField.select)}`);
              
              // Check if the select name is "Y"
              const isPartnerOnly = partnerOnlyField.select.name === "Y";
              log(`DEBUG [${resourceName}] - Is partner only? ${isPartnerOnly}`);
              
              if (isPartnerOnly) {
                log(`PARTNERS ONLY: Resource "${resourceName}" is marked as Partners Only with value Y`);
              }
              
              return isPartnerOnly;
            } else {
              log(`DEBUG [${resourceName}] - No select property found in Partners Only field`);
            }
          }
          
          return false;
        })(),
                       
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
    // Log the error but don't return mock data for production
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
    
    // ALWAYS return empty array instead of mock data to ensure we show accurate data
    log("IMPORTANT: Returning empty array because Notion API failed.");
    log("Please check your Notion API key and database ID to ensure they are correct.");
    log("See notion-connection-guide.md for setup instructions.");
    return [];
  }
}

// Check if resources need to be synced
export function shouldSyncResources(lastSynced: Date | null): boolean {
  if (!lastSynced) return true;
  
  const now = new Date();
  const syncInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return now.getTime() - lastSynced.getTime() > syncInterval;
}
