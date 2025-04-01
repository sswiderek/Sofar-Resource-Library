import React, { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, X, Search, Lightbulb, BookOpen } from 'lucide-react';
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
  const [loadingStage, setLoadingStage] = useState(1);
  
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
            <span className="ml-2 text-xs bg-purple-100 text-purple-800 font-medium px-1.5 py-0.5 rounded-sm">
              BETA
            </span>
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
                onClick={() => {
                  const query = "What is a smart mooring?";
                  setQuestion(query);
                  mutate(query);
                }}
              >
                What is a smart mooring?
              </button>
              <button 
                className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm" 
                onClick={() => {
                  const query = "How is Spotter data accessed and managed by users?";
                  setQuestion(query);
                  mutate(query);
                }}
              >
                How is Spotter data accessed and managed by users?
              </button>
              <button 
                className="w-full text-left px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm" 
                onClick={() => {
                  const query = "Which resources specifically reference dissolved oxygen?";
                  setQuestion(query);
                  mutate(query);
                }}
              >
                Which resources specifically reference dissolved oxygen?
              </button>
            </div>
          </div>
        )}
        
        {isPending && (
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