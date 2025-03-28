import React, { useState } from 'react';
import { Send, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Resource } from '@shared/schema';

interface QuestionBoxProps {
  partnerId: string | null;
  onShowResource?: (resourceId: number) => void;
  resources?: Resource[];
}

interface AskResponse {
  answer: string;
  relevantResourceIds: number[];
}

export default function QuestionBox({ partnerId, onShowResource, resources = [] }: QuestionBoxProps) {
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AskResponse | null>(null);
  
  const { mutate, data, isPending, isError, error } = useMutation<AskResponse, Error, string>({
    mutationFn: async (question: string) => {
      const response = await apiRequest(
        'POST',
        '/api/ask',
        { question, partnerId }
      );
      const result = await response.json();
      // Store result in component state
      setAiAnswer(result);
      return result;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isPending) {
      mutate(question);
    }
  };

  // Find resources by IDs and limit to a maximum of 3
  const relevantResources = resources
    .filter(resource => aiAnswer?.relevantResourceIds?.includes(resource.id))
    // Sort by the order they appear in relevantResourceIds to maintain priority
    .sort((a, b) => {
      const indexA = aiAnswer?.relevantResourceIds?.indexOf(a.id) ?? -1;
      const indexB = aiAnswer?.relevantResourceIds?.indexOf(b.id) ?? -1;
      return indexA - indexB;
    })
    // Limit to max 3 resources
    .slice(0, 3);

  return (
    <Card className="w-full bg-white border border-primary/10 shadow-xs transition-all duration-300 mb-6 relative">
      <CardHeader className={`py-3 px-4 ${expanded ? 'border-b' : ''}`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Ask about resources
          </CardTitle>
          {expanded && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => {
                // Reset state and collapse the answer section completely
                setExpanded(false);
                setQuestion('');
                setAiAnswer(null); // Clear the AI answer data
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
        {expanded && (
          <CardDescription className="ml-7 mt-1">
            Ask any question about the resources available to you
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={`px-4 ${expanded ? 'py-3' : 'py-2'}`}>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Input
            placeholder="Ask a question about resources..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-grow"
            onFocus={() => setExpanded(true)}
          />
          <Button type="submit" size="sm" disabled={isPending || !question.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        
        {expanded && !aiAnswer && !isPending && (
          <div className="text-sm mt-3 p-3 bg-gray-50 rounded-md border border-gray-100">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-primary mr-1" />
              <p className="font-medium">Try asking:</p>
            </div>
            <div className="mt-2 space-y-2">
              <button 
                className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm" 
                onClick={() => setQuestion("What resources do you have about smart mooring?")}
              >
                What resources do you have about smart mooring?
              </button>
              <button 
                className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm" 
                onClick={() => setQuestion("Show me sales materials for customers")}
              >
                Show me sales materials for customers
              </button>
              <button 
                className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm" 
                onClick={() => setQuestion("What are the key features of your solution?")}
              >
                What are the key features of your solution?
              </button>
              <button 
                className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm" 
                onClick={() => setQuestion("Can you explain how your technology works?")}
              >
                Can you explain how your technology works?
              </button>
            </div>
          </div>
        )}
        
        {isPending && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <div className="whitespace-pre-line text-sm prose prose-sm max-w-none">
                {aiAnswer.answer}
              </div>
            </div>
            
            {relevantResources.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm mb-2">
                    <Sparkles className="h-4 w-4 inline-block mr-1 text-primary" />
                    Relevant Resources:
                  </h3>
                  {aiAnswer.relevantResourceIds?.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      Showing top 3 of {aiAnswer.relevantResourceIds.length} resources
                    </div>
                  )}
                </div>
                <ul className="space-y-3">
                  {relevantResources.map((resource, index) => (
                    <li key={resource.id} className="border border-primary/20 bg-primary/5 p-3 rounded-md text-sm">
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-primary flex-1">{resource.name}</div>
                        <div className="flex items-center text-xs bg-primary/10 px-2 py-1 rounded-full">
                          <span className="uppercase text-[10px]">{resource.type}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs mt-2 line-clamp-2 text-gray-700">
                        {resource.description}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resource.audience.map(aud => (
                          <span key={aud} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {aud}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        {onShowResource ? (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => onShowResource(resource.id)}
                          >
                            View Resource
                          </Button>
                        ) : (
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-primary text-white text-xs px-3 py-1 rounded hover:bg-primary/90 inline-flex items-center"
                          >
                            View Resource
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Footer removed as requested */}
    </Card>
  );
}