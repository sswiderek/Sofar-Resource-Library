# Notion Integration Guide

This guide explains how the Sofar Resource Library integrates with Notion and how to effectively manage resources through the Notion database.

## Overview

The Sofar Resource Library automatically synchronizes with a designated Notion database to display and manage resources. This integration allows for easy content management while providing a polished, searchable interface for users.

## Notion Database Structure

The Notion database should have the following properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| Name | Title | The name/title of the resource |
| Type | Select | Resource type (e.g., Slides, Blog, One-Pager, Webinar) |
| Product | Multi-select | Related Sofar products |
| Solutions | Multi-select | Business solutions the resource addresses |
| Audience | Multi-select | Target audiences for the resource |
| Team Relevancy | Multi-select | Internal teams the resource is relevant to |
| Messaging Stage | Select | Stage in the messaging funnel (Awareness, Consideration, Decision) |
| Content Visibility | Select | Whether the resource is for external or internal use |
| Date | Date | Publication or last update date |
| URL | URL | Link to the actual resource |
| Description | Text | Brief description of the resource |
| Detailed Description | Text | More comprehensive description or content summary |
| Exclude from Library | Checkbox | When checked, the resource won't appear in the library |
| View Count | Number | Number of views (managed by the application, don't modify manually) |

## How to Add a New Resource

1. Navigate to the [Sofar Resource Library Notion Database](https://www.notion.so/sofarocean/1ac8ff95945081eda6d6d0538f2eed87?v=1ac8ff9594508161bf7c000c0d182979&pvs=4)
2. Click the "+ New" button to create a new entry
3. Fill in all the required fields:
   - Name (required)
   - Type (required)
   - URL (required)
   - Description (required)
4. Fill in as many optional fields as possible for better searchability:
   - Product
   - Solutions
   - Audience
   - Messaging Stage
   - Content Visibility (set to "internal" if the resource is for internal use only)
   - Date
   - Detailed Description
5. Leave the "View Count" field untouched as this is managed by the application
6. The new resource will appear in the Resource Library after the next sync

## How to Edit an Existing Resource

### Method 1: From the Resource Library Interface
1. Find the resource you want to edit in the Resource Library
2. Click on the edit icon (pencil) in the bottom left of the resource card
3. Select "Edit in Notion" from the dropdown menu
4. Make your changes in the Notion page that opens
5. Changes will be reflected in the Resource Library after the next sync

### Method 2: Directly in Notion
1. Navigate to the [Sofar Resource Library Notion Database](https://www.notion.so/sofarocean/1ac8ff95945081eda6d6d0538f2eed87?v=1ac8ff9594508161bf7c000c0d182979&pvs=4)
2. Find the resource you want to edit
3. Click on it to open the detailed view
4. Make your changes
5. Changes will be reflected in the Resource Library after the next sync

## How to Remove a Resource

If you want to remove a resource from the Resource Library without deleting it from the Notion database:

1. Find the resource in the Notion database
2. Check the "Exclude from Library" checkbox
3. The resource will be removed from the Resource Library after the next sync

To permanently delete a resource:

1. Find the resource in the Notion database
2. Delete the entry
3. The resource will be removed from the Resource Library after the next sync

## Resource Synchronization

The Resource Library automatically synchronizes with the Notion database:

- Sync occurs automatically every 30 minutes
- Administrators can manually trigger a sync from the admin interface
- View counts are preserved during syncs

## Best Practices

1. **Consistent Categorization**: Use consistent terminology for Types, Products, and other categorizations
2. **Clear Descriptions**: Write clear, concise descriptions that help users understand the resource content
3. **Internal Use Marking**: Always mark sensitive or internal-only resources with "internal" content visibility
4. **Detailed Descriptions**: Provide comprehensive detailed descriptions for better AI-powered resource discovery
5. **Resource Dating**: Always include a publication date to help with sorting and relevance
6. **URL Verification**: Ensure all resource URLs are valid and accessible

## Troubleshooting

If resources aren't appearing in the library as expected:

1. Check that all required fields are filled out
2. Verify the "Exclude from Library" checkbox is not checked
3. Ensure the resource has a valid URL
4. Wait for the next automatic sync or ask an administrator to manually trigger a sync
5. Check if the resource is marked as "internal" which will only show to authenticated users

For any issues with the Notion integration, please contact the Sofar Ocean development team.