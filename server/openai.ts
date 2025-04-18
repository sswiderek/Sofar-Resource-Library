import OpenAI from 'openai';
import { Resource } from '../shared/schema';
import { createResourceEmbeddings, findSimilarResources } from './embeddings';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Prepares resources for context by converting them to a format usable by OpenAI
 */
export function prepareResourcesContext(resources: Resource[]): string {
  return resources.map(resource => {
    // Always include regular description
    const description = resource.description || 'No description provided';
    
    // Include detailed description as separate field when available
    const hasDetailedDescription = resource.detailedDescription && resource.detailedDescription.trim().length > 0;
      
    return `
RESOURCE: ${resource.name}
DESCRIPTION: ${description}
${hasDetailedDescription ? `DETAILED DESCRIPTION: ${resource.detailedDescription}` : ''}
TYPE: ${resource.type || 'Unknown'}
PRODUCT: ${resource.product.join(', ') || 'Unknown'}
AUDIENCE: ${resource.audience.join(', ') || 'Unknown'}
MESSAGING STAGE: ${resource.messagingStage || 'Unknown'}
LINK: ${resource.url || 'No link available'}
`;
  }).join('\n----------------------------------\n');
}

/**
 * Process a question using OpenAI's API and provide a response based on resources
 * Uses embeddings to find the most relevant resources first
 */
export async function processQuestion(
  question: string,
  resources: Resource[],
  streamHandler?: (chunk: string, done: boolean) => void
): Promise<{ answer: string; relevantResourceIds: number[] }> {
  try {
    // Step 1: Create embeddings for all resources
    const resourcesWithEmbeddings = await createResourceEmbeddings(resources);
    
    // Step 2: Find the most relevant resources using embeddings
    const topK = Math.min(20, resources.length); // Use top 20 resources or all if fewer
    const mostRelevantResources = await findSimilarResources(question, resourcesWithEmbeddings, topK);
    
    // Step 3: Prepare context with the most relevant resources only
    const contextText = prepareResourcesContext(mostRelevantResources);
    
    // System message for the AI
    const systemMessage = `You are a helpful assistant that answers questions about Sofar Ocean's resources in a partner portal. 
          
You'll be given resource information and a question from a user.
Answer the question based ONLY on the provided resources information.

IMPORTANT INFORMATION ABOUT INTENT RECOGNITION:
- First, determine if the user is looking for specific resources or asking a general information question.
- For resource-seeking questions (e.g., "Do we have case studies on X?"), focus on recommending specific resources.
- For information questions (e.g., "How does X technology work?"), provide a comprehensive answer and cite resources.

GUIDELINES FOR ANSWERING:
1. Answer concisely but completely, keeping responses under 300 words.
2. Structure complex answers with bullet points or numbered lists.
3. Refer to specific resources by name when they support your answer.
4. Always connect your answer back to Sofar's marine intelligence products.
5. If asked about specific metrics or results, include precise numbers from resources.

KEY SOFAR PRODUCTS TO BE AWARE OF:
- Spotter buoys: Ocean data collection devices
- Smart Mooring: Subsurface ocean sensing technology
- Wayfinder: Voyage optimization software for shipping

VERY IMPORTANT: When referencing specific resources, mention them ONLY by name, NEVER include any ID numbers.
Include a "RELEVANT_RESOURCES" section at the end, listing resource names in order of relevance.

Format for RELEVANT_RESOURCES: ["Resource Name 1", "Resource Name 2", ...]`;

    // User query with context
    const userContent = `RESOURCES INFORMATION:\n${contextText}\n\nQUESTION: ${question}`;
    
    // If streaming is requested, use the stream option
    if (streamHandler) {
      // Send initial searching message to improve user experience
      streamHandler("Searching for relevant resources to answer your question...\n\n", false);
      
      // For streaming, we'll collect the full response text as it comes in
      let fullResponseText = '';
      
      // After finding resources, update the user
      streamHandler(`Found ${mostRelevantResources.length} potentially relevant resources. Analyzing content to answer your question...\n\n`, false);
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1-nano", // Using the newest cost-effective GPT model with period in name
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 800,
        stream: true
      });
      
      // Process the stream
      for await (const chunk of stream) {
        // Get the content delta if available
        const content = chunk.choices[0]?.delta?.content || '';
        
        // Append to our full response
        fullResponseText += content;
        
        // Send the chunk to the handler
        streamHandler(content, false);
      }
      
      // Signal completion
      streamHandler('', true);
      
      // Process the collected full response for resource IDs
      return processResponseText(fullResponseText, mostRelevantResources);
    } 
    // Non-streaming mode
    else {
      // Step 4: Generate answer using OpenAI (using the latest gpt-4.1-nano model)
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano", // Using the newest cost-effective GPT model with period in name
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const responseText = completion.choices[0].message.content || '';
      return processResponseText(responseText, mostRelevantResources);
    }
  } catch (error) {
    console.error('Error processing question with OpenAI:', error);
    throw new Error('Failed to process your question. Please try again later.');
  }
}

/**
 * Helper function to process the response text and extract resource IDs
 */
function processResponseText(responseText: string, mostRelevantResources: Resource[]): { answer: string; relevantResourceIds: number[] } {
  // Parse relevant resource names from the response and map them to IDs
  const relevantResourceIds: number[] = [];
  const relevantMatch = responseText.match(/RELEVANT_RESOURCES:\s*\[(.*?)\]/);
  
  if (relevantMatch && relevantMatch[1]) {
    // Extract resource names (possibly in quotes)
    const nameRegex = /"([^"]+)"|'([^']+)'|([^,]+)/g;
    
    const resourceNames: string[] = [];
    let match;
    while ((match = nameRegex.exec(relevantMatch[1])) !== null) {
      // Use the first non-undefined group (either quoted or unquoted)
      const name = match[1] || match[2] || match[3];
      if (name && name.trim()) {
        resourceNames.push(name.trim());
      }
    }
    
    // Map names to IDs by looking up in resources
    resourceNames.forEach(name => {
      const matchingResource = mostRelevantResources.find(r => 
        r.name.toLowerCase() === name.toLowerCase() ||
        r.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(r.name.toLowerCase())
      );
      
      if (matchingResource) {
        relevantResourceIds.push(matchingResource.id);
      }
    });
  }
  
  // If no relevant resources were identified,
  // use the IDs from the most relevant resources found by embeddings
  if (relevantResourceIds.length === 0) {
    mostRelevantResources.forEach(resource => {
      relevantResourceIds.push(resource.id);
    });
  }
  
  // Remove the RELEVANT_RESOURCES section from the displayed answer
  const relevantResourcesIndex = responseText.indexOf('RELEVANT_RESOURCES:');
  let answer = responseText;
  
  if (relevantResourcesIndex !== -1) {
    answer = responseText.substring(0, relevantResourcesIndex).trim();
  }

  return {
    answer,
    relevantResourceIds
  };
}