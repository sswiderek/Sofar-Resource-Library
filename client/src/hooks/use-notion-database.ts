import { useQuery } from "@tanstack/react-query";

interface NotionDatabaseResponse {
  url: string;
  success: boolean;
}

/**
 * Hook to get the Notion database URL for the resources.
 * This allows users to access the Notion database directly for editing resources.
 */
export function useNotionDatabase() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/notion/database-url"],
    queryFn: async () => {
      const response = await fetch("/api/notion/database-url");
      return await response.json() as NotionDatabaseResponse;
    },
  });

  return {
    url: data?.url,
    isLoading,
    error,
    isAvailable: !!data?.success
  };
}