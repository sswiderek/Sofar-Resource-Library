# Sofar Resource Library

A dynamic web portal for marine intelligence resource management that combines intelligent content discovery with an engaging user experience and streamlined content governance.

![Sofar Resource Library](generated-icon.png)

## Overview

The Sofar Resource Library is a centralized platform that makes it easy for partners and team members to discover, access, and share Sofar Ocean's extensive collection of resources. The application synchronizes with a Notion database to ensure content is always up-to-date, while providing powerful filtering, sorting, and search capabilities to help users quickly find relevant resources.

## Features

- **Notion Integration**: Automatically syncs with the Sofar Resource Library Notion database
- **Advanced Filtering**: Filter resources by type, product, audience, messaging stage, content visibility, and solutions
- **Intelligent Search**: Find resources using natural language or keyword searches
- **AI-Powered Discovery**: Ask questions about resources to get intelligent recommendations
- **Resource Analytics**: Track view counts and popularity metrics
- **Content Governance**: Visual indicators for internal-only resources
- **Direct Editing**: Edit resources directly in Notion with one click
- **Mobile Responsive**: Optimized viewing experience across all device sizes
- **Feedback System**: Simple feedback mechanism for users to report issues or suggestions

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Express.js server with PostgreSQL database
- **APIs**: 
  - Notion API for content synchronization
  - OpenAI API for intelligent resource discovery
- **Search**: Semantic search capabilities using vector embeddings
- **Database**: PostgreSQL for persistent storage of view counts and usage metrics

## Key Components

- **Resource Cards**: Visually appealing cards with color-coded resource types
- **Filter Sidebar**: Dynamic filtering based on available metadata
- **Question Box**: AI-powered assistant for natural language resource discovery
- **Analytics Dashboard**: View usage metrics and popular resources

## Environment Configuration

The application requires the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
NOTION_API_KEY=your_notion_api_key
NOTION_FEEDBACK_DATABASE_ID=your_notion_feedback_database_id
VITE_NOTION_DATABASE_URL=https://www.notion.so/sofarocean/1ac8ff95945081eda6d6d0538f2eed87?v=1ac8ff9594508161bf7c000c0d182979&pvs=4
DATABASE_URL=postgresql_connection_string
```

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env` file
4. Run the development server with `npm run dev`
5. The application will be available at http://localhost:5000

## Deployment

The application can be deployed using Replit's built-in deployment system. Simply click the deploy button to create a live instance of the application.

## Resource Content Flow

1. Resources are managed in the Notion database
2. The application syncs with Notion at regular intervals
3. Changes made in Notion are reflected in the application after sync
4. View counts are tracked in the PostgreSQL database and preserved during syncs

## User Workflows

### Discovering Resources
- Browse resources by scrolling through the main page
- Filter resources using the sidebar options
- Search for specific terms in the search bar
- Ask questions using the AI-powered assistant

### Managing Resources
- Click "Edit in Notion" on any resource to modify its details
- Use the "Notion Database" link in the header to access the full database
- Internal resources are clearly marked with a lock icon

### Providing Feedback
- Click the feedback button in the header
- Fill out the simple form with your name and feedback
- Feedback is stored in a dedicated Notion database

## Notes

- Internal-only resources are visually distinguished with a lock icon and amber/gold border
- View counts persist across application restarts and Notion syncs
- The application defaults to sorting by "Newest First" for regular browsing
- When using search, results are automatically sorted by relevance

## Support

For issues or questions about the Sofar Resource Library, please contact the Sofar Ocean team or submit feedback through the in-app feedback form.