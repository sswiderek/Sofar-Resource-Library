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
  
  // First, check if the text appears to contain resource entries like "RESOURCE: name"
  const resourceEntryPattern = /(\d+\.\s*RESOURCE:[\s\S]*?(?=\d+\.\s*RESOURCE:|$))/g;
  const hasResourceEntries = resourceEntryPattern.test(text);
  
  if (hasResourceEntries) {
    // Reset the RegExp lastIndex
    resourceEntryPattern.lastIndex = 0;
    
    // Parse resource entries
    const resourceEntries = text.match(resourceEntryPattern) || [];
    const introText = text.split(resourceEntryPattern)[0].trim();
    
    const elements: React.ReactNode[] = [];
    
    // Add the introduction text
    if (introText) {
      elements.push(
        <div key="intro" className="mb-4">
          {addResourceLinks(introText, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
        </div>
      );
    }
    
    // Add each resource entry with improved formatting
    resourceEntries.forEach((entry, idx) => {
      // Extract the resource name from the entry (assumed to be after "RESOURCE:")
      const resourceNameMatch = entry.match(/RESOURCE:(.*?)(?=-|\n|$)/);
      const resourceName = resourceNameMatch ? resourceNameMatch[1].trim() : '';
      
      // Extract description and link sections
      const descMatch = entry.match(/- DESCRIPTION:([\s\S]*?)(?=- LINK:|$)/);
      const description = descMatch ? descMatch[1].trim() : '';
      
      const linkMatch = entry.match(/- LINK:([\s\S]*?)$/);
      const linkText = linkMatch ? linkMatch[1].trim() : '';
      
      // Process URLs in the link section
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      const urls = linkText.match(urlRegex) || [];
      
      elements.push(
        <div key={`resource-formatted-${idx}`} className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <h4 className="font-medium text-primary mb-2">{idx + 1}. {resourceName}</h4>
          
          {description && (
            <div className="mb-2 text-sm">
              <span className="font-medium">Description:</span> {description}
            </div>
          )}
          
          {urls.length > 0 && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Link:</span>{' '}
              <a 
                href={urls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(urls[0], "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="h-3 w-3" />
                <span>{urls[0]}</span>
              </a>
            </div>
          )}
        </div>
      );
    });
    
    // Add a closing paragraph if there is one after the last resource entry
    const closingText = text.split(resourceEntryPattern).pop()?.trim();
    if (closingText && closingText !== '') {
      elements.push(
        <div key="closing" className="mt-3">
          {addResourceLinks(closingText, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
        </div>
      );
    }
    
    return elements;
  } else {
    // Enhanced formatting for standard responses
    // Let's improve the formatting with better visual structure
    
    // First, try to detect if there are numbered points in the text
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
          <p key="intro-para" className="mb-3">
            {addResourceLinks(parts[0].trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </p>
        );
      }
      
      // Add numbered items with better formatting
      elements.push(
        <div key="numbered-list" className="space-y-2 my-3">
          {numberedItems.map((item, idx) => (
            <div key={`numbered-item-${idx}`} className="flex">
              <div className="font-semibold text-primary mr-2">{item.split('.')[0]}.</div>
              <div>
                {addResourceLinks(item.substring(item.indexOf('.') + 1).trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
              </div>
            </div>
          ))}
        </div>
      );
      
      // Add any conclusion text
      // Check if the final part exists and isn't included in the numbered items
      const finalPart = parts[parts.length - 1];
      if (finalPart && !numberedItems.some((item: string) => item === finalPart)) {
        elements.push(
          <p key="conclusion" className="mt-3">
            {addResourceLinks(parts[parts.length - 1].trim(), resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn)}
          </p>
        );
      }
      
      return elements;
    } else {
      // Standard text formatting with URL highlighting
      // URL regex pattern to match URLs in text
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      
      // Split the text into parts based on the URLs
      const parts = text.split(urlRegex);
      
      // Extract all URLs that match the pattern
      const urls = text.match(urlRegex) || [];
      
      // Combine text and URL elements
      const elements: React.ReactNode[] = [];
      
      // Process each part of the text
      parts.forEach((part, index) => {
        // For text parts, check if they contain resource names and link them
        if (part) {
          const linkedPart = addResourceLinks(part, resources, trackViewFn, viewedResourcesMap, setViewedResourcesFn);
          elements.push(<span key={`text-part-${index}`}>{linkedPart}</span>);
        }
        
        // If there's a URL that follows this text part, add it as a link
        if (urls[index]) {
          const url = urls[index];
          const label = url.replace(/^https?:\/\//, '').split('/')[0]; // Use domain as label
          
          elements.push(
            <a 
              key={`link-url-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="underline">{label}</span>
            </a>
          );
        }
      });
      
      // Split the text by paragraphs for better visual formatting
      if (elements.length === 1 && 
          typeof elements[0] === 'object' && 
          elements[0] !== null && 
          'props' in elements[0] && 
          elements[0].props && 
          typeof elements[0].props.children === 'string') {
        const paragraphs = elements[0].props.children.split('\n\n');
        if (paragraphs.length > 1) {
          return (
            <div className="space-y-3">
              {paragraphs.map((para: string, idx: number) => (
                <p key={`para-${idx}`}>{para.trim()}</p>
              ))}
            </div>
          );
        }
      }
      
      return elements;
    }
  }
}

// Helper function to add links to resource names in text
function addResourceLinks(text: string, resources: Resource[], trackViewFn?: (id: number) => Promise<any>, viewedResourcesMap?: Record<number, boolean>, setViewedResourcesFn?: (updateFn: (prev: Record<number, boolean>) => Record<number, boolean>) => void) {
  if (!text || !resources || resources.length === 0) return text;
  
  let result: React.ReactNode[] = [text];
  
  // Sort resources by name length (descending) to ensure longer names are matched first
  // This prevents partial matches of shorter resource names within longer ones
  const sortedResources = [...resources].sort((a, b) => b.name.length - a.name.length);
  
  // For each resource, find and replace its name with a link
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
                className="font-medium text-primary hover:underline"
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
                {resourceName}
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
        
        {isPending && !isStreaming && (
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
                  <p className="italic">Searching for the most relevant resources that match your question...</p>
                )}
                {loadingStage === 2 && (
                  <p className="italic">Examining resource content to extract the most helpful information...</p>
                )}
                {loadingStage === 3 && (
                  <p className="italic">Interpreting your question and connecting it with marine intelligence data...</p>
                )}
                {loadingStage === 4 && (
                  <p className="italic">Almost there! Formulating a comprehensive answer tailored to your needs...</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Show streaming answer as it comes in */}
        {isStreaming && (
          <div className="mt-4">
            <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-semibold text-primary">AI Answer</h3>
                <div className="ml-auto flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  <span className="text-xs text-primary/70">Thinking...</span>
                </div>
              </div>
              <div className="text-sm prose prose-sm max-w-none">
                {streamedAnswer || "Finding relevant resources for your question..."}
                <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-1"></span>
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
            <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-semibold text-primary">AI Answer</h3>
              </div>
              <div className="text-sm prose prose-sm max-w-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-li:my-1 prose-ul:my-2">
                {formatAnswerWithLinks(aiAnswer.answer, resources, trackView, viewedResources, setViewedResources)}
              </div>
            </div>
            
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