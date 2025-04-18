import { Client } from "@notionhq/client";
import { Feedback } from "@shared/schema";
import { log } from "./vite";

// Initialize Notion client for feedback
const notionFeedbackClient = new Client({
  auth: process.env.NOTION_API_KEY
});

// The Notion database ID where feedback will be stored
const FEEDBACK_DATABASE_ID = process.env.NOTION_FEEDBACK_DATABASE_ID;

/**
 * Submit feedback to a Notion database
 * 
 * @param feedback The feedback data to submit
 * @returns A promise that resolves when the feedback is submitted
 */
export async function submitFeedbackToNotion(feedback: Feedback): Promise<void> {
  if (!FEEDBACK_DATABASE_ID) {
    throw new Error("Notion Feedback Database ID not configured. Please set NOTION_FEEDBACK_DATABASE_ID environment variable.");
  }

  try {
    const timestamp = feedback.timestamp || new Date();
    
    // Clean the database ID by removing any trailing question mark
    const cleanDatabaseId = FEEDBACK_DATABASE_ID.replace(/\?$/, '');
    
    // Create a new page (row) in the Notion database
    await notionFeedbackClient.pages.create({
      parent: {
        database_id: cleanDatabaseId
      },
      properties: {
        // Map to exact column names in the Notion database
        "Submitter's Name": {
          title: [
            {
              text: {
                content: feedback.name
              }
            }
          ]
        },
        "Feedback": {
          rich_text: [
            {
              text: {
                content: feedback.feedback
              }
            }
          ]
        }
      }
    });
    
    log(`Successfully submitted feedback from ${feedback.name}`);
  } catch (error) {
    log(`Error submitting feedback to Notion: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}