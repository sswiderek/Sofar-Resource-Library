import OpenAI from 'openai';
import { Resource } from '@shared/schema';
import { log } from './vite';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface for resource with embedding
export interface ResourceWithEmbedding {
  resource: Resource;
  embedding: number[];
}

// Simple in-memory cache for query embeddings
interface QueryEmbeddingCache {
  [query: string]: {
    embedding: number[];
    timestamp: number;
  }
}

// Cache for query embeddings (lasts for 24 hours)
const queryEmbeddingCache: QueryEmbeddingCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to get a cached embedding or generate a new one
async function getCachedOrNewEmbedding(query: string): Promise<number[]> {
  const now = Date.now();
  const cacheKey = query.toLowerCase().trim();
  
  // Check if we have a cached embedding that's still valid
  if (
    queryEmbeddingCache[cacheKey] && 
    now - queryEmbeddingCache[cacheKey].timestamp < CACHE_TTL
  ) {
    log(`Using cached embedding for query: ${query.substring(0, 30)}...`);
    return queryEmbeddingCache[cacheKey].embedding;
  }
  
  // No cache or expired cache, generate a new embedding
  log(`Generating new embedding for query: ${query.substring(0, 30)}...`);
  const queryEmbeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  
  const embedding = queryEmbeddingResponse.data[0].embedding;
  
  // Cache the result
  queryEmbeddingCache[cacheKey] = {
    embedding,
    timestamp: now
  };
  
  return embedding;
}

/**
 * Creates embeddings for resources using OpenAI's embeddings API
 * Optimized to process resources in batches for better performance
 */
export async function createResourceEmbeddings(resources: Resource[]): Promise<ResourceWithEmbedding[]> {
  const resourcesWithEmbeddings: ResourceWithEmbedding[] = [];
  const batchSize = 20; // Process 20 resources at a time to improve performance
  
  log(`Creating embeddings for ${resources.length} resources in batches of ${batchSize}...`);
  
  // Split resources into batches
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(resources.length/batchSize)}`);
    
    // Process each batch in parallel with a slight delay to avoid rate limits
    const batchPromises = batch.map((resource, index) => {
      return new Promise<ResourceWithEmbedding | null>(async (resolve) => {
        // Add a slight delay for each resource to avoid rate limits
        setTimeout(async () => {
          try {
            // Combine all relevant fields into a single text for embedding
            const content = [
              resource.name,
              resource.detailedDescription || resource.description,
              resource.type,
              resource.product.join(' '),
              resource.audience.join(' '),
              resource.messagingStage
            ].filter(Boolean).join(' ');
            
            // Create embedding using OpenAI
            const response = await openai.embeddings.create({
              model: "text-embedding-ada-002",
              input: content,
            });
            
            resolve({
              resource,
              embedding: response.data[0].embedding,
            });
          } catch (error) {
            log(`Error creating embedding for resource "${resource.name}": ${error instanceof Error ? error.message : String(error)}`);
            // Return null for failed resources
            resolve(null);
          }
        }, index * 100); // Stagger requests slightly (100ms between each resource in a batch)
      });
    });
    
    // Wait for all embeddings in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add successful embeddings to the result array
    resourcesWithEmbeddings.push(...batchResults.filter(Boolean) as ResourceWithEmbedding[]);
    
    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < resources.length) {
      log(`Batch complete. Waiting briefly before processing next batch...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  log(`Created embeddings for ${resourcesWithEmbeddings.length} out of ${resources.length} resources`);
  return resourcesWithEmbeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Check for vector length mismatch
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimensions don't match: ${vecA.length} vs ${vecB.length}`);
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  // Handle edge case where one or both vectors are zero-magnitude
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find the most similar resources to a query using embeddings
 */
export async function findSimilarResources(
  query: string, 
  resourcesWithEmbeddings: ResourceWithEmbedding[],
  topK: number = 10
): Promise<Resource[]> {
  try {
    // Use cached embedding or create a new one
    const queryEmbedding = await getCachedOrNewEmbedding(query);
    
    // Calculate similarity scores
    const scoredResources = resourcesWithEmbeddings.map(resourceWithEmbedding => {
      const similarity = cosineSimilarity(queryEmbedding, resourceWithEmbedding.embedding);
      return {
        resource: resourceWithEmbedding.resource,
        similarity,
      };
    });
    
    // Filter by minimum similarity threshold (0.6), then sort by similarity and limit to topK
    const similarityThreshold = 0.6;
    const filteredResources = scoredResources.filter(item => item.similarity >= similarityThreshold);
    
    // If no resources meet the threshold, just take the top ones
    const resourcesToUse = filteredResources.length > 0 
      ? filteredResources 
      : scoredResources;
    
    const sortedResources = resourcesToUse
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    // Log the resources with their similarity scores for debugging
    sortedResources.forEach(item => {
      log(`Resource: ${item.resource.name} | Similarity: ${item.similarity.toFixed(4)}`);
    });
    
    // Return just the resources
    return sortedResources.map(item => item.resource);
    
  } catch (error) {
    log(`Error finding similar resources: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}