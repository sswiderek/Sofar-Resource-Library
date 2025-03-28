import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
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
  
  const { mutate, data, isPending, isError, error } = useMutation<AskResponse, Error, string>({
    mutationFn: async (question: string) => {
      const response = await apiRequest(
        'POST',
        '/api/ask',
        { question, partnerId }
      );
      return response.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isPending) {
      mutate(question);
    }
  };

  // Find resources by IDs
  const relevantResources = resources.filter(
    resource => data?.relevantResourceIds?.includes(resource.id)
  );

  return (
    <Card className="w-full bg-white border shadow-sm transition-all duration-300 mb-6 relative">
      <CardHeader className={`pb-2 ${expanded ? 'border-b' : ''}`}>
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          Ask about resources
        </CardTitle>
        {expanded && (
          <CardDescription>
            Ask any question about the resources available to you
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={`${expanded ? 'pb-3 pt-4' : 'py-2'}`}>
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
        
        {expanded && !data && !isPending && (
          <div className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded-md">
            <p>Example questions:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><button 
                className="text-primary hover:underline text-left" 
                onClick={() => setQuestion("What resources do you have about smart mooring?")}
              >
                What resources do you have about smart mooring?
              </button></li>
              <li><button 
                className="text-primary hover:underline text-left" 
                onClick={() => setQuestion("Show me sales materials for customers")}
              >
                Show me sales materials for customers
              </button></li>
            </ul>
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
        
        {data && (
          <div className="mt-4">
            <div className="bg-primary/5 p-4 rounded-md">
              <h3 className="font-semibold text-primary mb-2">Answer:</h3>
              <div className="whitespace-pre-line text-sm">
                {data.answer}
              </div>
            </div>
            
            {relevantResources.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-sm mb-2">Relevant Resources:</h3>
                <ul className="space-y-2">
                  {relevantResources.map(resource => (
                    <li key={resource.id} className="bg-gray-50 p-2 rounded-md text-sm">
                      <div className="font-medium">{resource.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</div>
                      {onShowResource ? (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto mt-1 text-xs"
                          onClick={() => onShowResource(resource.id)}
                        >
                          View Resource
                        </Button>
                      ) : (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary text-xs hover:underline inline-block mt-1"
                        >
                          View Resource
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {expanded && data && (
        <CardFooter className="pt-0 border-t flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setQuestion('');
              setExpanded(false);
            }}
          >
            Ask another question
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}