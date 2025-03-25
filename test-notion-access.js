// Simple test script for Notion API
import { Client } from "@notionhq/client";

async function testNotionDatabaseAccess() {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = "6f6e5a6c-10e6-40e8-acad-05d281c38eb2"; // The one we found
    
    console.log(`Using database ID: ${databaseId}`);
    
    // Create Notion client
    const notion = new Client({
      auth: apiKey,
    });
    
    // Test 1: Try getting the database details directly
    console.log("Testing get database API...");
    try {
      const database = await notion.databases.retrieve({
        database_id: databaseId,
      });
      
      console.log("✅ Successfully accessed database details:");
      console.log(`- Title: ${database.title?.[0]?.plain_text || "Untitled"}`);
      console.log(`- Last edited time: ${database.last_edited_time}`);
    } catch (retrieveError) {
      console.error("❌ Database retrieval failed:", retrieveError.message);
      console.log("\nTroubleshooting steps:");
      console.log("1. Make sure you've shared the database with your integration");
      console.log("2. Open your Notion database");
      console.log("3. Click the '...' menu at the top right");
      console.log("4. Select 'Add connections'");
      console.log("5. Find and select your integration");
      console.log("6. After sharing, wait a minute or two for permissions to propagate");
    }
    
  } catch (error) {
    console.error("General error:", error.message);
  }
}

// Run the test
testNotionDatabaseAccess();