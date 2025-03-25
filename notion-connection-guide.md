# Notion Integration Setup Guide

## Issue Identified
The Notion integration is correctly configured with:
- Valid API key ✅
- Correct database ID format ✅

However, the integration doesn't have access to the database. The error message indicates:
> Could not find database with ID: 1ac8ff95-9450-81ed-a6d6-d0538f2eed87. Make sure the relevant pages and databases are shared with your integration.

## Steps to Fix

### 1. Share Your Database with the Integration

1. **Open your Notion database**
2. **Click "Share" in the top right corner**
3. **In the "Share" popup, click on "Add people, emails, groups, or integrations"**
4. **Search for your integration name** (the name you gave when creating the integration)
5. **Select your integration and click "Invite"**

This will give your integration access to the database.

### 2. Verify Database ID

Make sure the database ID in your environment variables (`NOTION_DATABASE_ID`) matches the actual database ID:

1. **Open your Notion database in a browser**
2. **Look at the URL**:
   ```
   https://www.notion.so/workspace/[workspace-name]/[database-id]?v=[view-id]
   ```
   or
   ```
   https://www.notion.so/[database-id]?v=[view-id]
   ```
3. **The database ID is the part before `?v=`**
   - It should be a 32-character alphanumeric string or formatted with hyphens

### 3. Check Integration Permissions

When you created your Notion integration:

1. Make sure it has "Read content" capabilities
2. If you're planning to write to Notion later, it also needs "Update content" capabilities
3. If you're planning to create pages, it needs "Insert content" capabilities

You can check and modify these in the Notion API dashboard under your integration settings.

## Testing After Changes

After making these changes:

1. Run the test script again:
   ```
   node notion-test.js
   ```

2. You should see:
   - List of accessible databases
   - Successful connection to your database
   - Database properties
   - Sample records

## Additional Troubleshooting

If you're still having issues:

1. Check if you need to re-generate your API key
2. Verify the integration is still active
3. Make sure the database actually contains data
4. Wait a few minutes after making permission changes, as they sometimes take time to propagate