import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partnerAccessSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, ShieldAlert } from "lucide-react";
import { Partner } from "@shared/schema";

interface PartnerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  onPasswordVerified: () => void;
}

export default function PartnerPasswordModal({
  isOpen,
  onClose,
  partner,
  onPasswordVerified
}: PartnerPasswordModalProps) {
  const [attempts, setAttempts] = useState(0);
  const { toast } = useToast();

  // Initialize form with zod validation
  const form = useForm({
    resolver: zodResolver(partnerAccessSchema),
    defaultValues: {
      partnerId: partner?.slug || "",
      password: "",
    },
  });

  // Update partnerId when partner changes
  if (partner && form.getValues("partnerId") !== partner.slug) {
    form.setValue("partnerId", partner.slug);
  }

  // Partner access verification mutation
  const verifyMutation = useMutation({
    mutationFn: async (data: { partnerId: string; password: string }) => {
      const response = await apiRequest("POST", "/api/partner-access", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Access granted",
        description: `You now have access to ${partner?.name} resources`,
      });
      form.reset();
      setAttempts(0);
      onPasswordVerified();
    },
    onError: (error: Error) => {
      setAttempts(attempts + 1);
      toast({
        title: "Access denied",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = form.handleSubmit((data) => {
    verifyMutation.mutate(data);
  });

  // Close the modal
  const handleClose = () => {
    form.reset();
    setAttempts(0);
    onClose();
  };

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            Please enter the password to access {partner.name} resources
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter partner password" 
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {attempts > 2 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Multiple failed attempts</p>
                  <p>
                    If you don't have the password, please contact your administrator
                    for access to these resources.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? "Verifying..." : "Access Resources"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}