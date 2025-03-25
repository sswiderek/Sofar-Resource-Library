// Simple test script for Notion API
import { Client } from "@notionhq/client";

async function testNotionConnection() {
  try {
    // Log the API key (first few characters only for security)
    const apiKey = process.env.NOTION_API_KEY;
    console.log(`Using API key starting with: ${apiKey.substring(0, 4)}...`);
    
    // Create Notion client
    const notion = new Client({
      auth: apiKey,
    });
    
    // Get the database ID
    let databaseId = process.env.NOTION_DATABASE_ID;
    console.log(`Original database ID: ${databaseId}`);
    
    // Format database ID if needed (adding hyphens)
    if (databaseId.length === 32 && !databaseId.includes('-')) {
      databaseId = `${databaseId.slice(0, 8)}-${databaseId.slice(8, 12)}-${databaseId.slice(12, 16)}-${databaseId.slice(16, 20)}-${databaseId.slice(20)}`;
      console.log(`Formatted database ID: ${databaseId}`);
    }
    
    // Test 1: List all users and bots
    console.log("Testing user list API...");
    const userList = await notion.users.list();
    console.log(`Successfully connected to Notion API. Found ${userList.results.length} users/bots.`);
    console.log("First user/bot:", userList.results[0]?.name || "No name available");
    
    // Test 2: List all the databases that this integration has access to
    console.log("\nListing all accessible databases...");
    try {
      const response = await notion.search({
        filter: {
          value: "database",
          property: "object"
        }
      });
      
      console.log(`Found ${response.results.length} accessible databases:`);
      
      for (const db of response.results) {
        console.log(`- Database ID: ${db.id}`);
        console.log(`  Title: ${db.title?.[0]?.plain_text || "Untitled"}`);
        console.log(`  URL: https://notion.so/${db.id.replace(/-/g, "")}`);
      }
      
      if (response.results.length > 0) {
        console.log("\nIf you see your Resource Library database above, please use that database ID instead.");
      } else {
        console.log("\nYou don't have any databases shared with this integration yet.");
        console.log("Please make sure to share your database with the integration:");
        console.log("1. Open your Notion database");
        console.log("2. Click the '...' menu at the top right");
        console.log("3. Select 'Add connections'");
        console.log("4. Find and select your integration");
      }
    } catch (searchError) {
      console.error("Database search failed:", searchError.message);
    }
    
    // Test 3: Still try the original database ID
    console.log(`\nTrying to query the provided database ID: ${databaseId}`);
    try {
      const dbQuery = await notion.databases.query({
        database_id: databaseId,
      });
      
      console.log(`Successfully queried database. Found ${dbQuery.results.length} records.`);
    } catch (dbError) {
      console.error("Database query failed:", dbError.message);
    }
    
  } catch (error) {
    console.error("Error connecting to Notion API:", error.message);
  }
}

// Run the test
testNotionConnection();