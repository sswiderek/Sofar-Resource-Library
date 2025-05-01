import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

/**
 * A floating feedback button component that appears at the bottom right corner of the page
 */
export function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !feedback) {
      toast({
        title: "Missing information",
        description: "Please provide your name and feedback",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          feedbackType: 'other', // Default type
          feedback
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "Thank you!",
          description: "Your feedback has been submitted successfully",
        });
        
        // Reset form and close dialog
        setName('');
        setFeedback('');
        setOpen(false);
      } else {
        throw new Error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error submitting your feedback",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      <div className="bg-white rounded-full shadow-lg transition-transform hover:scale-105">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="group relative">
              <Button 
                variant="secondary" 
                className="text-sm font-medium gap-1.5 h-12 w-12 rounded-full p-0 bg-[#1e5bb0] hover:bg-blue-700 text-white border-2 border-blue-200 shadow-lg transition-all"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="sr-only">Feedback</span>
              </Button>
              <span className="absolute -top-10 right-0 whitespace-nowrap bg-white text-blue-700 font-medium text-sm px-2 py-1 rounded shadow-md border border-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Send Feedback
              </span>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Feedback</DialogTitle>
              <DialogDescription>
                Share your thoughts, report a bug, or suggest an improvement.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right font-medium text-neutral-700">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3 border-neutral-200 focus-visible:ring-blue-500"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="feedback" className="text-right pt-2 font-medium text-neutral-700">
                    Feedback <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="col-span-3 border-neutral-200 focus-visible:ring-blue-500"
                    placeholder="Tell us what's on your mind..."
                    rows={5}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
