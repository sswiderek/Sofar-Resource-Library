import OpenAI from 'openai';
import { Resource } from '../shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Prepares resources for context by converting them to a format usable by OpenAI
 */
export function prepareResourcesContext(resources: Resource[]): string {
  return resources.map(resource => {
    return `
RESOURCE ID: ${resource.id}
TITLE: ${resource.name}
DESCRIPTION: ${resource.description || 'No description provided'}
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
 */
export async function processQuestion(
  question: string,
  resources: Resource[]
): Promise<{ answer: string; relevantResourceIds: number[] }> {
  try {
    const contextText = prepareResourcesContext(resources);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions about resources in a partner portal. 
          
You'll be given resource information and a question from a user.
Answer the question based ONLY on the provided resources information.
If you can't answer from the provided information, say that you don't have enough information.

When referencing specific resources, mention them by name and ID.
Keep responses concise but informative.
Include a "RELEVANT_RESOURCES" section at the end with IDs of resources most relevant to the question.

Format for RELEVANT_RESOURCES: [ID1, ID2, ...]`
        },
        {
          role: "user",
          content: `RESOURCES INFORMATION:\n${contextText}\n\nQUESTION: ${question}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const responseText = completion.choices[0].message.content || '';
    
    // Parse relevant resource IDs
    const relevantResourceIds: number[] = [];
    const relevantMatch = responseText.match(/RELEVANT_RESOURCES:\s*\[(.*?)\]/);
    
    if (relevantMatch && relevantMatch[1]) {
      const idStrings = relevantMatch[1].split(',').map(str => str.trim());
      for (const idStr of idStrings) {
        const id = parseInt(idStr);
        if (!isNaN(id)) {
          relevantResourceIds.push(id);
        }
      }
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
  } catch (error) {
    console.error('Error processing question with OpenAI:', error);
    throw new Error('Failed to process your question. Please try again later.');
  }
}