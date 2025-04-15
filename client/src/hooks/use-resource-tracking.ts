import { useState, useCallback } from 'react';

/**
 * Hook for tracking resource usage (views, shares, downloads)
 */
export function useResourceTracking() {
  const [isTracking, setIsTracking] = useState(false);

  // Track a resource view
  const trackView = useCallback(async (resourceId: number) => {
    try {
      setIsTracking(true);
      const response = await fetch(`/api/resources/${resourceId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to track resource view');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking resource view:', error);
    } finally {
      setIsTracking(false);
    }
  }, []);

  // Track a resource share
  const trackShare = useCallback(async (resourceId: number) => {
    try {
      setIsTracking(true);
      const response = await fetch(`/api/resources/${resourceId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to track resource share');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking resource share:', error);
    } finally {
      setIsTracking(false);
    }
  }, []);

  // Track a resource download
  const trackDownload = useCallback(async (resourceId: number) => {
    try {
      setIsTracking(true);
      const response = await fetch(`/api/resources/${resourceId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to track resource download');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking resource download:', error);
    } finally {
      setIsTracking(false);
    }
  }, []);

  // Get popular resources
  const getPopularResources = useCallback(async (limit: number = 5) => {
    try {
      const response = await fetch(`/api/resources/popular?limit=${limit}`);
      
      if (!response.ok) {
        console.error('Failed to fetch popular resources');
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular resources:', error);
      return [];
    }
  }, []);

  return {
    isTracking,
    trackView,
    trackShare,
    trackDownload,
    getPopularResources,
  };
}