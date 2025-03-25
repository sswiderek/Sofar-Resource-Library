// This is a simple script to test the Notion API connection
import { Client } from '@notionhq/client';

// Initialize the Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function testNotionConnection() {
  try {
    console.log("Testing Notion connection with API key:", 
                process.env.NOTION_API_KEY ? "API key is set" : "API key is missing");
    
    console.log("Using Database ID:", process.env.NOTION_DATABASE_ID);
    
    // Format database ID if needed
    let databaseId = process.env.NOTION_DATABASE_ID;
    if (databaseId.length === 32 && !databaseId.includes('-')) {
      databaseId = `${databaseId.slice(0, 8)}-${databaseId.slice(8, 12)}-${databaseId.slice(12, 16)}-${databaseId.slice(16, 20)}-${databaseId.slice(20)}`;
      console.log("Formatted Database ID:", databaseId);
    }
    
    // List all databases the integration has access to
    console.log("Fetching all accessible databases...");
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      }
    });
    
    if (response.results.length === 0) {
      console.log("No databases found. Your integration doesn't have access to any databases.");
    } else {
      console.log(`Found ${response.results.length} accessible databases:`);
      response.results.forEach((db, index) => {
        console.log(`[${index + 1}] ID: ${db.id}`);
        console.log(`    Title: ${db.title[0]?.plain_text || 'Untitled'}`);
      });
    }
    
    // Try to access the specific database
    console.log("\nAttempting to access the specified database...");
    try {
      const dbResponse = await notion.databases.retrieve({
        database_id: databaseId,
      });
      
      console.log("✅ Successfully connected to database!");
      console.log("Database title:", dbResponse.title[0]?.plain_text || "Untitled");
      
      // List the database properties
      console.log("\nDatabase properties:");
      Object.entries(dbResponse.properties).forEach(([name, property]) => {
        console.log(`- ${name} (${property.type})`);
      });
      
      // Query the database
      console.log("\nFetching database records...");
      const queryResponse = await notion.databases.query({
        database_id: databaseId,
      });
      
      console.log(`Found ${queryResponse.results.length} records`);
      
      if (queryResponse.results.length > 0) {
        const firstPage = queryResponse.results[0];
        console.log("\nSample record properties:");
        console.log("Available properties:", Object.keys(firstPage.properties).join(", "));
      }
      
    } catch (dbError) {
      console.error("❌ Failed to access the database:", dbError.message);
    }
    
  } catch (error) {
    console.error("Error testing Notion connection:", error.message);
  }
}

testNotionConnection();