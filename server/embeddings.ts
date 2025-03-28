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

/**
 * Creates embeddings for resources using OpenAI's embeddings API
 */
export async function createResourceEmbeddings(resources: Resource[]): Promise<ResourceWithEmbedding[]> {
  const resourcesWithEmbeddings: ResourceWithEmbedding[] = [];
  
  log(`Creating embeddings for ${resources.length} resources...`);
  
  for (const resource of resources) {
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
      
      resourcesWithEmbeddings.push({
        resource,
        embedding: response.data[0].embedding,
      });
      
    } catch (error) {
      log(`Error creating embedding for resource "${resource.name}": ${error instanceof Error ? error.message : String(error)}`);
      // Continue with other resources even if one fails
    }
  }
  
  log(`Created embeddings for ${resourcesWithEmbeddings.length} resources`);
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
    // Create embedding for the query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
    
    // Calculate similarity scores
    const scoredResources = resourcesWithEmbeddings.map(resourceWithEmbedding => {
      const similarity = cosineSimilarity(queryEmbedding, resourceWithEmbedding.embedding);
      return {
        resource: resourceWithEmbedding.resource,
        similarity,
      };
    });
    
    // Filter by minimum similarity threshold (0.7), then sort by similarity and limit to topK
    const similarityThreshold = 0.7;
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