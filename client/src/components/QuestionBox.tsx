import React, { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, X, Search, Lightbulb, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Resource } from '@shared/schema';
import { getResourceTypeClasses } from '@/lib/resourceTypeColors';
import { useResourceTracking } from '@/hooks/use-resource-tracking';

// Helper function to format text with clickable links and resource references
function formatAnswerWithLinks(text: string, resources: Resource[] = [], trackViewFn?: (id: number) => Promise<any>, viewedResourcesMap?: Record<number, boolean>, setViewedResourcesFn?: (updateFn: (prev: Record<number, boolean>) => Record<number, boolean>) => void) {
  if (!text) return null;
  
  // Extract resource information mentioned in the answer
  const mentionedResources: Resource[] = [];
  
  resources.forEach(resource => {
    // Check if the resource name is mentioned in the text (case insensitive)
    if (text.toLowerCase().includes(resource.name.toLowerCase())) {
      mentionedResources.push(resource);
    }
  });
  
  // Try to identify if this is a response about specific case studies
  const isCaseStudyResponse = text.toLowerCase().includes('case stud') || 
                             text.toLowerCase().includes('customer stor') ||
                             mentionedResources.some(r => 
                               r.type.toLowerCase().includes('case stud') || 
                               r.type.toLowerCase().includes('customer stor'));
  
  // Check if text contains specific metrics or numerical benefits
  const containsMetrics = /\d+(\.\d+)?%|savings of \$\d+|reduced by \d+/.test(text);
  
  // Check if the answer appears to be a list of points (numbered or bullet points)
  const isListFormat = /(\d+\.\s+[^\n]+)/.test(text) || /•\s+[^\n]+/.test(text) || /\n-\s+[^\n]+/.test(text);
  
  // Format for answers about case studies or with specific metrics - use a more visual card-based approach
  if ((isCaseStudyResponse || containsMetrics) && mentionedResources.length > 0) {
    // Sort mentioned resources by relevance - case studies first, then other types
    const sortedResources = [...mentionedResources].sort((a, b) => {
      // Prioritize case studies and customer stories
      const aIsCaseStudy = a.type.toLowerCase().includes('case') || a.type.toLowerCase().includes('customer');
      const bIsCaseStudy = b.type.toLowerCase().includes('case') || b.type.toLowerCase().includes('customer');
      
      if (aIsCaseStudy && !bIsCaseStudy) return -1;
      if (!aIsCaseStudy && bIsCaseStudy) return 1;
      
      // For other resources, keep their natural order (as mentioned in the text)
      return 0;
    });
    
    // Extract key metrics from text
    const metricsRegex = /(\d+(\.\d+)?%|savings of \$\d+|reduced by \d+[^\s.,]+)/g;
    const metricsMatches = text.match(metricsRegex) || [];
    const metrics = metricsMatches.slice(0, 3); // Take up to 3 metrics
    
    // Extract introduction text - typically the first paragraph before specific resources are mentioned
    let introText = text.split(/\n\n|\.\s+/)[0] + '.';
    if (introText.length < 40) { // If intro is too short, take a bit more
      const parts = text.split(/\n\n|\.\s+/);
      introText = (parts[0] + '. ' + (parts[1] || '')).trim();
    }
    
    // Show a summary card with key metrics and highlights
    return (
      <div className="space-y-4">
        {/* Introduction card with metrics highlight */}
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <div className="text-sm">
            {addResourceLinks(introText, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </div>
          
          {/* Display metrics as badges if available */}
          {metrics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {metrics.map((metric, idx) => (
                <div key={`metric-${idx}`} className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">
                  {metric}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Top resources as interactive cards */}
        <div className="space-y-2 mt-1">
          <h3 className="text-sm font-semibold text-neutral-700 pl-1 flex items-center">
            <BookOpen className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Top Resources from Answer
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {sortedResources.slice(0, 3).map((resource, idx) => {
              const badgeClass = getResourceTypeClasses(resource.type);
              const isViewed = viewedResourcesMap?.[resource.id] || false;
              
              // Find a snippet from the answer that mentions this resource
              const resourceNameEscaped = resource.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const snippetRegex = new RegExp(`[^.!?]*${resourceNameEscaped}[^.!?]*[.!?]`, 'i');
              const snippetMatch = text.match(snippetRegex);
              const snippet = snippetMatch ? snippetMatch[0].trim() : '';
              
              return (
                <div 
                  key={`resource-card-${resource.id}`}
                  className="p-3 bg-white border border-neutral-200 rounded-md hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-1.5 h-full min-h-[2.5rem] self-stretch ${badgeClass.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className={`text-xs ${badgeClass} rounded-full px-2 py-0.5`}>
                          <span className="uppercase text-[10px]">{resource.type}</span>
                        </div>
                        {isViewed && (
                          <div className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                            Viewed
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm text-primary mt-1 line-clamp-2">
                        {resource.name}
                      </h4>
                      
                      {snippet ? (
                        <p className="text-xs text-neutral-600 mt-2 italic line-clamp-2">
                          "{snippet}"
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-600 mt-2 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      
                      <button
                        className={`mt-3 text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 w-full justify-center ${
                          isViewed 
                            ? 'border border-neutral-200 bg-white hover:bg-primary/5 text-neutral-700 hover:text-primary hover:border-primary/30' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                        onClick={() => {
                          // Track the view if not already viewed
                          if (trackViewFn && setViewedResourcesFn && !isViewed) {
                            trackViewFn(resource.id);
                            setViewedResourcesFn(prev => ({...prev, [resource.id]: true}));
                          }
                          
                          // Open in new tab
                          window.open(resource.url, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {isViewed ? 'View Again' : 'Access Resource'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Show full answer in expandable section if it's long */}
        {text.length > 200 && (
          <details className="group mt-2">
            <summary className="list-none cursor-pointer">
              <div className="flex items-center text-xs text-primary font-medium hover:underline">
                <div className="group-open:rotate-90 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>View full answer</span>
              </div>
            </summary>
            <div className="pt-3 pl-5 text-sm text-neutral-700">
              {addResourceLinks(text, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
            </div>
          </details>
        )}
      </div>
    );
  }
  
  // Format for list-based answers - enhance the visual hierarchy
  else if (isListFormat) {
    // Enhanced list formatting with better visual hierarchy
    
    // Try to detect numbered lists first
    const numberedListPattern = /(\d+\.\s+[^\n]+)/g;
    const hasNumberedList = numberedListPattern.test(text);
    
    if (hasNumberedList) {
      // Format text with numbered list styling
      const parts = text.split(numberedListPattern);
      const numberedItems = text.match(numberedListPattern) || [];
      
      const elements: React.ReactNode[] = [];
      
      // Add introduction text if present
      if (parts[0].trim()) {
        elements.push(
          <div key="intro-para" className="mb-4 pb-2 border-b border-neutral-100">
            {addResourceLinks(parts[0].trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </div>
        );
      }
      
      // Add numbered items with enhanced formatting
      elements.push(
        <div key="numbered-list" className="space-y-3 my-3">
          {numberedItems.map((item, idx) => {
            const number = item.split('.')[0];
            const content = item.substring(item.indexOf('.') + 1).trim();
            
            return (
              <div key={`numbered-item-${idx}`} className="flex items-start group rounded-lg hover:bg-primary/5 p-2 -ml-2 transition-colors">
                <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-xs mr-3">
                  {number}
                </div>
                <div className="flex-1 pt-0.5">
                  {addResourceLinks(content, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
                </div>
              </div>
            );
          })}
        </div>
      );
      
      // Add any conclusion text
      const finalPart = parts[parts.length - 1];
      if (finalPart && finalPart.trim() && !numberedItems.some((item: string) => item === finalPart)) {
        elements.push(
          <div key="conclusion" className="mt-4 pt-2 border-t border-neutral-100">
            {addResourceLinks(finalPart.trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </div>
        );
      }
      
      // Add clickable resource buttons at the bottom if resources are mentioned but not directly linked
      if (mentionedResources.length > 0) {
        elements.push(
          <div key="mentioned-resources" className="mt-4 pt-3 border-t border-neutral-100">
            <div className="text-xs font-medium text-neutral-600 mb-2">Mentioned Resources:</div>
            <div className="flex flex-wrap gap-2">
              {mentionedResources.slice(0, 4).map(resource => {
                const isViewed = viewedResourcesMap?.[resource.id] || false;
                return (
                  <button
                    key={`resource-btn-${resource.id}`}
                    className={`text-xs px-3 py-1.5 rounded flex items-center gap-1.5 ${
                      isViewed 
                        ? 'border border-neutral-200 bg-white hover:bg-primary/5 text-neutral-700 hover:text-primary' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                    onClick={() => {
                      // Track the view if not already viewed
                      if (trackViewFn && setViewedResourcesFn && !isViewed) {
                        trackViewFn(resource.id);
                        setViewedResourcesFn(prev => ({...prev, [resource.id]: true}));
                      }
                      
                      // Open in new tab
                      window.open(resource.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {resource.name.length > 30 ? resource.name.substring(0, 30) + '...' : resource.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
      
      return elements;
    }
    
    // Handle bullet lists
    const bulletListPattern = /(•|\*|-)\s+([^\n]+)/g;
    const hasBulletList = bulletListPattern.test(text);
    
    if (hasBulletList) {
      // Reset pattern index
      bulletListPattern.lastIndex = 0;
      
      // Split by bullet list items
      const parts = text.split(bulletListPattern);
      const bulletItems = [];
      let match;
      while ((match = bulletListPattern.exec(text)) !== null) {
        bulletItems.push(match[0]);
      }
      
      const elements: React.ReactNode[] = [];
      
      // Add introduction text if present
      if (parts[0].trim()) {
        elements.push(
          <div key="intro-para" className="mb-4">
            {addResourceLinks(parts[0].trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </div>
        );
      }
      
      // Add bullet items with enhanced formatting
      elements.push(
        <ul key="bullet-list" className="space-y-2 my-3 list-none">
          {bulletItems.map((item, idx) => {
            const content = item.replace(/^(•|\*|-)\s+/, '');
            
            return (
              <li key={`bullet-item-${idx}`} className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2.5"></div>
                <div className="flex-1">
                  {addResourceLinks(content, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
                </div>
              </li>
            );
          })}
        </ul>
      );
      
      // Add any conclusion text
      const finalPart = parts[parts.length - 1];
      if (finalPart && finalPart.trim()) {
        elements.push(
          <div key="conclusion" className="mt-3">
            {addResourceLinks(finalPart.trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </div>
        );
      }
      
      return elements;
    }
  }
  
  // Default formatting for other types of answers
  // Enhanced paragraph and URL highlighting
  
  // Split answer into paragraphs for better readability
  const paragraphs = text.split(/\n\n+/);
  
  // Format paragraphs with resource links
  const elements = paragraphs.map((paragraph, idx) => {
    if (!paragraph.trim()) return null;
    
    // Check if this is a heading-like paragraph (short, ends with colon)
    const isHeading = paragraph.trim().length < 50 && paragraph.trim().endsWith(':');
    
    if (isHeading) {
      return (
        <h4 key={`heading-${idx}`} className="font-medium text-primary mt-4 mb-2">
          {addResourceLinks(paragraph.trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
        </h4>
      );
    }
    
    // Normal paragraph
    return (
      <p key={`para-${idx}`} className={idx === 0 ? 'mb-3' : 'my-3'}>
        {addResourceLinks(paragraph.trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
      </p>
    );
  });
  
  // Add resource quick links at the bottom if resources are mentioned
  if (mentionedResources.length > 0) {
    elements.push(
      <div key="resource-quick-links" className="mt-4 pt-3 border-t border-neutral-100">
        <div className="text-xs font-medium text-neutral-700">Related Resources:</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {mentionedResources.slice(0, 3).map(resource => {
            const isViewed = viewedResourcesMap?.[resource.id] || false;
            return (
              <button
                key={`quick-link-${resource.id}`}
                className={`text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 ${
                  isViewed 
                    ? 'border border-neutral-200 bg-white hover:bg-primary/5 text-neutral-700 hover:text-primary' 
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
                onClick={() => {
                  // Track the view if not already viewed
                  if (trackViewFn && setViewedResourcesFn && !isViewed) {
                    trackViewFn(resource.id);
                    setViewedResourcesFn(prev => ({...prev, [resource.id]: true}));
                  }
                  
                  // Open in new tab
                  window.open(resource.url, "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="h-3 w-3" />
                {resource.name.length > 40 ? resource.name.substring(0, 40) + '...' : resource.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  
  return elements;
}

// Helper function to add links to resource names in text
function addResourceLinks(text: string, resources: Resource[], trackViewFn?: (id: number) => Promise<any>, viewedResourcesMap?: Record<number, boolean>, setViewedResourcesFn?: (updateFn: (prev: Record<number, boolean>) => Record<number, boolean>) => void) {
  if (!text || !resources || resources.length === 0) return text;
  
  let result: React.ReactNode[] = [text];
  
  // Extract resource titles in quotes pattern first
  const resourceQuotePattern = /\*\*(.*?)\*\*/g;
  const resourceQuotes = text.match(resourceQuotePattern) || [];
  
  // Sort resources by name length (descending) to ensure longer names are matched first
  // This prevents partial matches of shorter resource names within longer ones
  const sortedResources = [...resources].sort((a, b) => b.name.length - a.name.length);
  
  // Process quoted resource titles
  if (resourceQuotes.length > 0) {
    const newResult: React.ReactNode[] = [];
    
    for (const node of result) {
      if (typeof node !== 'string') {
        newResult.push(node);
        continue;
      }
      
      let lastIndex = 0;
      const parts: React.ReactNode[] = [];
      let match;
      
      // Reset regex search
      resourceQuotePattern.lastIndex = 0;
      
      while ((match = resourceQuotePattern.exec(node)) !== null) {
        const quoteText = match[0]; // The full **text**
        const innerText = match[1]; // Just the text inside **
        
        // Add the text before this match
        if (match.index > lastIndex) {
          parts.push(node.substring(lastIndex, match.index));
        }
        
        // Find the matching resource
        const matchedResource = sortedResources.find(r => 
          innerText.includes(r.name) || r.name.includes(innerText)
        );
        
        if (matchedResource) {
          // Add as a more visually distinct link with external icon
          parts.push(
            <a 
              key={`resource-quote-${matchedResource.id}-${match.index}`}
              href={matchedResource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-medium text-primary hover:underline group bg-primary/5 px-0.5 rounded"
              onClick={(e) => {
                e.preventDefault();
                
                // Track the view using passed functions if available
                if (trackViewFn && viewedResourcesMap && setViewedResourcesFn) {
                  if (!viewedResourcesMap[matchedResource.id]) {
                    trackViewFn(matchedResource.id);
                    setViewedResourcesFn(prev => ({...prev, [matchedResource.id]: true}));
                  }
                }
                
                // Open in new tab
                window.open(matchedResource.url, "_blank", "noopener,noreferrer");
              }}
            >
              <span className="border-b border-primary/30 group-hover:border-primary">{innerText}</span>
              <ExternalLink className="h-3 w-3 ml-0.5 inline-block flex-shrink-0" />
            </a>
          );
        } else {
          // If no match, keep original text
          parts.push(<strong key={`unmatched-${match.index}`}>{innerText}</strong>);
        }
        
        lastIndex = match.index + quoteText.length;
      }
      
      // Add remaining text
      if (lastIndex < node.length) {
        parts.push(node.substring(lastIndex));
      }
      
      // Add all parts
      newResult.push(...parts);
    }
    
    result = newResult;
  }
  
  // Also find explicit mentions of resource names
  for (const resource of sortedResources) {
    const resourceName = resource.name;
    // Skip very short resource names (avoid common words)
    if (resourceName.length < 10) continue;
    
    // Process each text fragment
    const newResult: React.ReactNode[] = [];
    
    for (const node of result) {
      // Only process string nodes
      if (typeof node !== 'string') {
        newResult.push(node);
        continue;
      }
      
      // Look for resource name in the text
      if (node.includes(resourceName)) {
        const parts = node.split(resourceName);
        
        // Reassemble with links
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) newResult.push(parts[i]);
          
          // Add resource link between parts (but not after the last part)
          if (i < parts.length - 1) {
            newResult.push(
              <a 
                key={`resource-${resource.id}-${i}`}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center font-medium text-primary hover:underline group bg-primary/5 px-0.5 rounded"
                onClick={(e) => {
                  e.preventDefault();
                  
                  // Track the view using passed functions if available
                  if (trackViewFn && viewedResourcesMap && setViewedResourcesFn) {
                    if (!viewedResourcesMap[resource.id]) {
                      trackViewFn(resource.id);
                      setViewedResourcesFn(prev => ({...prev, [resource.id]: true}));
                    }
                  }
                  
                  // Open in new tab
                  window.open(resource.url, "_blank", "noopener,noreferrer");
                }}
              >
                <span className="border-b border-primary/30 group-hover:border-primary">{resourceName}</span>
                <ExternalLink className="h-3 w-3 ml-0.5 inline-block flex-shrink-0" />
              </a>
            );
          }
        }
      } else {
        newResult.push(node);
      }
    }
    
    result = newResult;
  }
  
  return result;
}

interface QuestionBoxProps {
  onShowResource?: (resourceId: number) => void;
  resources?: Resource[];
}

interface AskResponse {
  answer: string;
  relevantResourceIds: number[];
}

export default function QuestionBox({ onShowResource, resources = [] }: QuestionBoxProps) {
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AskResponse | null>(null);
  const [streamedAnswer, setStreamedAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingStage, setLoadingStage] = useState(1);
  const { trackView } = useResourceTracking();
  const [viewedResources, setViewedResources] = useState<Record<number, boolean>>({});
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  // Mutation for handling questions with streaming support
  const { mutate, data, isPending, isError, error } = useMutation<AskResponse, Error, string>({
    mutationFn: async (question: string) => {
      // Always use streaming for a better UX
      const useStreaming = true;
      
      if (useStreaming) {
        // Reset streaming state
        setStreamedAnswer('');
        setIsStreaming(true);
        
        // Create the request with streaming enabled
        const body = JSON.stringify({ question, stream: true });
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body
        };
        
        // Make the request
        const response = await fetch('/api/ask', fetchOptions);
        
        if (!response.ok) {
          setIsStreaming(false);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get a reader for the response stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          setIsStreaming(false);
          throw new Error('Failed to get response stream reader');
        }
        
        // Process the SSE stream
        let buffer = '';
        
        while (true) {
          // Read the next chunk
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk and add it to the buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete SSE messages
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // Keep any incomplete message in the buffer
          
          // Process each complete message
          for (const message of messages) {
            if (!message) continue;
            
            // Parse the SSE format
            const lines = message.split('\n');
            const eventLine = lines.find(line => line.startsWith('event:'));
            const dataLine = lines.find(line => line.startsWith('data:'));
            
            if (!eventLine || !dataLine) continue;
            
            const eventType = eventLine.substring(6).trim();
            const data = dataLine.substring(5).trim();
            
            // Handle the different event types
            if (eventType === 'chunk') {
              try {
                const parsedData = JSON.parse(data);
                setStreamedAnswer(prev => prev + (parsedData.content || ''));
              } catch (err) {
                console.error('Error parsing streaming chunk:', err);
              }
            } else if (eventType === 'done') {
              try {
                const result = JSON.parse(data) as AskResponse;
                setAiAnswer(result);
                setIsStreaming(false);
                return result;
              } catch (err) {
                console.error('Error parsing final result:', err);
                setIsStreaming(false);
                throw new Error('Failed to parse completion data');
              }
            } else if (eventType === 'error') {
              try {
                const errorData = JSON.parse(data);
                setIsStreaming(false);
                throw new Error(errorData.error || 'Error during streaming');
              } catch (err) {
                console.error('Error handling error event:', err);
                setIsStreaming(false);
                throw new Error('Failed during streaming');
              }
            }
          }
        }
        
        // If we reach here without a 'done' event, it's an error
        setIsStreaming(false);
        throw new Error('Stream ended without completion signal');
      } else {
        // Fallback to non-streaming approach
        const response = await apiRequest(
          'POST',
          '/api/ask',
          { question, stream: false }
        );
        const result = await response.json();
        setAiAnswer(result);
        return result;
      }
    },
  });

  // Reset loading stage when not pending
  useEffect(() => {
    if (!isPending) {
      setLoadingStage(1);
    }
  }, [isPending]);
  
  // Advance loading stages to simulate progress
  useEffect(() => {
    if (isPending) {
      // Reset to stage 1 when we start loading again
      setLoadingStage(1);
      
      const stageTimers = [
        setTimeout(() => setLoadingStage(2), 2000),
        setTimeout(() => setLoadingStage(3), 4500),
        setTimeout(() => setLoadingStage(4), 7000),
      ];
      
      return () => {
        stageTimers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isPending]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isPending) {
      mutate(question);
    }
  };

  // Find resources by IDs (no longer limiting to just 3)
  const relevantResources = resources
    .filter(resource => aiAnswer?.relevantResourceIds?.includes(resource.id))
    // Sort by the order they appear in relevantResourceIds to maintain priority
    .sort((a, b) => {
      const indexA = aiAnswer?.relevantResourceIds?.indexOf(a.id) ?? -1;
      const indexB = aiAnswer?.relevantResourceIds?.indexOf(b.id) ?? -1;
      return indexA - indexB;
    });

  return (
    <Card className={`w-full bg-white border shadow-sm transition-all duration-300 mb-4 relative ${expanded ? 'border-primary/30' : 'border-neutral-200'}`}>
      <CardContent className={`px-4 ${expanded ? 'py-4' : 'py-3'}`}>
        <div className="flex flex-col">
          <div className="flex items-center mb-3">
            <div className="flex items-center flex-grow">
              <div className="bg-primary/10 p-1.5 rounded-full mr-2.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium">Resource AI Assistant</span>
                <span className="ml-2 text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-sm">
                  BETA
                </span>
              </div>
            </div>
            {expanded && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 rounded-full hover:bg-neutral-100"
                onClick={() => {
                  setExpanded(false);
                  setQuestion('');
                  setAiAnswer(null);
                }}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <Input
              placeholder={expanded ? "What resources are available for..." : "Ask a question about resources..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={`flex-grow transition-all ${expanded ? 'border-primary/30 focus-visible:ring-primary/20' : ''}`}
              onFocus={() => setExpanded(true)}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={isPending || !question.trim()}
              className={`${isPending ? 'bg-primary/80' : ''} transition-all`}
            >
              {isPending ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Processing</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  <span className="text-xs">Ask</span>
                </div>
              )}
            </Button>
          </form>
          
          {/* Quick guide when first expanded */}
          {expanded && !aiAnswer && !isPending && !isStreaming && (
            <div className="text-xs text-neutral-500 mt-2">
              <p>Ask questions about Sofar's products, resources, or specific use cases to get personalized recommendations</p>
            </div>
          )}
        </div>
        
        {expanded && !aiAnswer && !isPending && (
          <div className="text-xs mt-3 border-t pt-3 border-neutral-100">
            <div className="flex items-center mb-2">
              <Sparkles className="h-3 w-3 mr-1 text-primary" />
              <p className="font-medium text-neutral-600">Try asking about:</p>
            </div>
            
            {/* Categorized suggestion buttons */}
            <div className="space-y-3">
              {/* Product-specific suggestions */}
              <div>
                <div className="text-[10px] font-medium uppercase text-neutral-500 mb-1">Products & Solutions</div>
                <div className="flex gap-1 flex-wrap">
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "Can you recommend case studies that show how customers have achieved fuel savings using Wayfinder technology?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Wayfinder fuel savings case studies
                  </button>
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "What materials explain how Smart Mooring Sensors work?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Smart Mooring technical details
                  </button>
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "What's the latest research on Spotter buoys and their applications?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Spotter buoy research
                  </button>
                </div>
              </div>
              
              {/* Audience-focused suggestions */}
              <div>
                <div className="text-[10px] font-medium uppercase text-neutral-500 mb-1">By Audience</div>
                <div className="flex gap-1 flex-wrap">
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "What resources would help me explain Sofar's technology to environmental researchers?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Materials for environmental researchers
                  </button>
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "What presentation materials do we have for shipping executives focused on decarbonization?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Shipping executive presentations
                  </button>
                </div>
              </div>
              
              {/* General inquiries */}
              <div>
                <div className="text-[10px] font-medium uppercase text-neutral-500 mb-1">General Questions</div>
                <div className="flex gap-1 flex-wrap">
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "How does Sofar's technology help with weather forecasting?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Ocean data & weather forecasting
                  </button>
                  <button 
                    className="text-left px-2 py-1 bg-white rounded border border-neutral-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-xs" 
                    onClick={() => {
                      const query = "What are the key benefits of Sofar's solutions for shipping companies?";
                      setQuestion(query);
                      mutate(query);
                    }}
                  >
                    Benefits for shipping companies
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex items-center">
              <div className="text-[10px] text-neutral-500">
                <p>Ask any question about Sofar's resources, products, or applications</p>
              </div>
            </div>
          </div>
        )}
        
        {isPending && (streamedAnswer === '' || !isStreaming) && (
          <div className="py-4 px-2">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full flex items-center justify-center">
                  {loadingStage === 1 && <Search className="h-3 w-3 text-primary animate-pulse" />}
                  {loadingStage === 2 && <BookOpen className="h-3 w-3 text-primary animate-pulse" />}
                  {loadingStage === 3 && <Lightbulb className="h-3 w-3 text-primary animate-pulse" />}
                  {loadingStage === 4 && <Sparkles className="h-3 w-3 text-primary animate-pulse" />}
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <h4 className="text-sm font-medium text-primary mb-1">
                {loadingStage === 1 && "Finding relevant resources..."}
                {loadingStage === 2 && "Analyzing resource content..."}
                {loadingStage === 3 && "Processing your question..."}
                {loadingStage === 4 && "Crafting your answer..."}
              </h4>
              <div className="space-y-1">
                <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-primary/60 transition-all duration-300" 
                    style={{ width: `${loadingStage * 25}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 max-w-sm mx-auto">
                {loadingStage === 1 && (
                  <div className="space-y-1.5">
                    <p className="italic font-medium">Exploring the Resource Library...</p>
                    <ul className="text-left space-y-1 pl-4 text-[11px] text-gray-500 pt-1">
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Searching through all Wayfinder case studies</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Looking for fuel savings metrics across customers</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Ranking resources by relevance and recency</span>
                      </li>
                    </ul>
                  </div>
                )}
                {loadingStage === 2 && (
                  <div className="space-y-1.5">
                    <p className="italic font-medium">Digging into relevant resources...</p>
                    <ul className="text-left space-y-1 pl-4 text-[11px] text-gray-500 pt-1">
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Analyzing details about implementation strategies</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Extracting statistics and cost-saving metrics</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Comparing customer experiences across industries</span>
                      </li>
                    </ul>
                  </div>
                )}
                {loadingStage === 3 && (
                  <div className="space-y-1.5">
                    <p className="italic font-medium">Building your personalized answer...</p>
                    <ul className="text-left space-y-1 pl-4 text-[11px] text-gray-500 pt-1">
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Identifying key success stories and metrics</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Gathering evidence of implementation results</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Finding common factors in successful deployments</span>
                      </li>
                    </ul>
                  </div>
                )}
                {loadingStage === 4 && (
                  <div className="space-y-1.5">
                    <p className="italic font-medium">Finalizing resources for you...</p>
                    <ul className="text-left space-y-1 pl-4 text-[11px] text-gray-500 pt-1">
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Prioritizing most relevant case studies</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Highlighting key performance metrics</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1 mr-1.5"></span>
                        <span>Arranging information for best readability</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Show streaming answer as it comes in - removed redundant "Thinking..." indicator */}
        {isStreaming && (
          <div className="mt-4">
            <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-semibold text-primary">AI Answer</h3>
              </div>
              <div className="text-sm prose prose-sm max-w-none">
                {streamedAnswer || "Finding relevant resources for your question..."}
              </div>
            </div>
          </div>
        )}
        
        {isError && (
          <div className="text-destructive bg-destructive/10 p-3 rounded-md mt-3">
            <p className="font-semibold">Error processing your question</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Please try again later'}</p>
          </div>
        )}
        
        {aiAnswer && (
          <div className="mt-4">
            <div className="bg-white p-4 rounded-md border border-primary/20 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-1.5 rounded-full mr-2.5 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  {/* Remove initial "Searching for..." text in the answer when displayed */}
                  <div className="text-sm prose prose-sm max-w-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-li:my-1.5 prose-ul:my-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {formatAnswerWithLinks(
                      aiAnswer.answer.replace(/^Searching for relevant resources to answer your question\.\.\.\s*Found \d+ potentially relevant resources\. Analyzing content to answer your question\.\.\.\s*/i, ''), 
                      resources, 
                      trackView, 
                      viewedResources, 
                      setViewedResources
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feedback section */}
            {!feedbackGiven && aiAnswer && (
              <div className="mt-4 bg-neutral-50 p-3 rounded-md border border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-600">Was this answer helpful?</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFeedbackGiven('positive');
                        // Here you could implement API call to track positive feedback
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
                        <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }}/>
                      </svg>
                      Yes
                    </button>
                    <button 
                      onClick={() => {
                        setFeedbackGiven('negative');
                        setShowFollowUp(true);
                        // Here you could implement API call to track negative feedback
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
                        <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      No
                    </button>
                  </div>
                </div>
                
                {/* Follow-up for negative feedback */}
                {showFollowUp && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          const query = "Show me more specific resources about " + question.split(" ").slice(0, 5).join(" ") + "...";
                          setQuestion(query);
                          mutate(query);
                          setShowFollowUp(false);
                        }}
                        className="text-xs px-3 py-1 bg-white rounded border border-neutral-300 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        Show more specific resources
                      </button>
                      <button 
                        onClick={() => {
                          setQuestion("Can you explain more about " + question.split(" ").slice(0, 5).join(" ") + "...");
                          setShowFollowUp(false);
                        }}
                        className="text-xs px-3 py-1 bg-white rounded border border-neutral-300 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        Ask for more details
                      </button>
                      <button 
                        onClick={() => setShowFollowUp(false)}
                        className="text-xs px-3 py-1 bg-white rounded border border-neutral-300 hover:border-neutral-400 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Show thank you message after feedback */}
            {feedbackGiven && (
              <div className="mt-4 bg-neutral-50 p-3 rounded-md border border-neutral-100 text-center">
                <div className="text-xs text-neutral-600">
                  {feedbackGiven === 'positive' ? 'Thank you for your feedback! We\'re glad this was helpful.' : 'Thank you for your feedback! We\'ll use it to improve our answers.'}
                </div>
              </div>
            )}
            
            {relevantResources.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                    <h3 className="font-semibold text-sm">Recommended Resources</h3>
                  </div>
                  <div className="text-xs text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full">
                    {aiAnswer.relevantResourceIds?.length} {aiAnswer.relevantResourceIds?.length === 1 ? 'resource' : 'resources'} found
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-3">
                    {relevantResources.map((resource, index) => {
                      // Get the resource type badge class
                      const badgeClass = getResourceTypeClasses(resource.type);
                      // Check if resource has been viewed
                      const isViewed = viewedResources[resource.id];
                      
                      return (
                        <div 
                          key={`resource-${resource.id}`} 
                          className={`bg-white border rounded-md transition-all flex flex-col h-full overflow-hidden relative ${
                            isViewed 
                              ? 'border-neutral-200' 
                              : 'border-primary/30 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {/* Top color bar based on resource type */}
                          <div className={`w-full h-1 ${badgeClass.replace('text-', 'bg-')}`}></div>
                          
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <div className={`text-xs px-2 py-0.5 rounded-full ${badgeClass} mr-2`}>
                                    <span className="uppercase text-[10px] font-medium">{resource.type}</span>
                                  </div>
                                  {isViewed && (
                                    <div className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                                      Viewed
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-medium text-primary leading-tight mb-1">
                                  {resource.name}
                                </h4>
                                <div className="text-xs text-neutral-500 mb-2">
                                  {resource.date}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                {/* Priority indicator for first 3 resources */}
                                {index < 3 && (
                                  <div className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-medium flex items-center">
                                    {index === 0 && "Best Match"}
                                    {index === 1 && "Highly Relevant"}
                                    {index === 2 && "Recommended"}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-xs text-neutral-700 my-2">
                              {resource.description}
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <a 
                                href={resource.url}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 justify-center flex-1 border ${
                                  isViewed 
                                    ? 'border-neutral-200 hover:border-primary/30 text-neutral-700 hover:text-primary bg-white hover:bg-primary/5' 
                                    : 'bg-primary text-white hover:bg-primary/90 border-primary'
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  
                                  // Track the view if not already viewed
                                  if (!viewedResources[resource.id]) {
                                    trackView(resource.id);
                                    setViewedResources(prev => ({...prev, [resource.id]: true}));
                                  }
                                  
                                  // Open in new tab
                                  window.open(resource.url, "_blank", "noopener,noreferrer");
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                                {isViewed ? 'View Again' : 'View Resource'}
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show a message if there are more resources available */}
                  {aiAnswer.relevantResourceIds?.length > relevantResources.length && (
                    <div className="text-center text-xs text-neutral-500 mt-3 py-2 border-t border-neutral-100">
                      {aiAnswer.relevantResourceIds.length - relevantResources.length} more resources mentioned but not found in the current list
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}