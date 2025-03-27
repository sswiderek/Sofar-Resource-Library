import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Partner, adminLoginSchema, updatePartnerPasswordSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, Key, Shield, UserCog } from "lucide-react";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  // Check if already authenticated on component mount
  const checkAuthStatus = useQuery({
    queryKey: ['/api/admin/check-auth'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        const data = await response.json();
        if (data.isAuthenticated) {
          setIsAuthenticated(true);
        }
        return data;
      } catch (error) {
        console.error('Error checking auth status:', error);
        return { isAuthenticated: false };
      }
    },
  });

  // Login form with zod validation
  const loginForm = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Password update form with zod validation
  const passwordForm = useForm({
    resolver: zodResolver(updatePartnerPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", data);
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: "You are now logged in as an administrator",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Partners query
  const { data: partners = [], isLoading: isLoadingPartners } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    enabled: isAuthenticated,
  });

  // Update partner password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/partners/${id}/password`, { password });
      return response.json();
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({
        title: "Password updated",
        description: "The partner password has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle login form submission
  const onLoginSubmit = loginForm.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  // Handle password form submission
  const onPasswordSubmit = passwordForm.handleSubmit((data) => {
    if (selectedPartnerId) {
      updatePasswordMutation.mutate({ id: selectedPartnerId, password: data.password });
    }
  });

  // Open password dialog for a partner
  const openPasswordDialog = (partnerId: number) => {
    setSelectedPartnerId(partnerId);
    setIsPasswordDialogOpen(true);
    passwordForm.reset();
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  // Back to home button handler
  const handleBackToHome = () => {
    setLocation("/");
  };
  
  // Logout handler
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout", {});
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Card className="w-full max-w-md shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-neutral-800">Admin Login</CardTitle>
            <CardDescription className="text-neutral-600">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={onLoginSubmit} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-700">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="" 
                          className="border-neutral-300 focus:border-neutral-400 focus:ring-neutral-400" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-700">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="" 
                          className="border-neutral-300 focus:border-neutral-400 focus:ring-neutral-400" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBackToHome}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show admin dashboard
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Resource Library Admin</h1>
            <p className="text-neutral-500">Manage partner passwords and access</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToHome}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
            >
              Back to Portal
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Partner Access Management</CardTitle>
              </div>
              <CardDescription>
                Set and manage passwords for partner organizations to control their access to resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPartners ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : partners.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No partners found</AlertTitle>
                  <AlertDescription>
                    No partner organizations have been set up yet.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-neutral-500">Partner Name</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-500">Slug</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-500">Password Status</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-500">Last Updated</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map((partner) => (
                        <tr key={partner.id} className="border-b hover:bg-neutral-50">
                          <td className="py-3 px-4">{partner.name}</td>
                          <td className="py-3 px-4">{partner.slug}</td>
                          <td className="py-3 px-4">
                            {partner.password ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-700"></span>
                                Password Set
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-700"></span>
                                No Password
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {formatDate(partner.lastPasswordUpdate)}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPasswordDialog(partner.id)}
                              className="flex items-center gap-1 border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
                            >
                              <Key className="h-3.5 w-3.5" />
                              {partner.password ? "Change Password" : "Set Password"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Update Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-neutral-800 flex items-center gap-2">
              <Key className="h-5 w-5 text-neutral-600" />
              {selectedPartnerId
                ? partners.find((p) => p.id === selectedPartnerId)?.password
                  ? "Change Partner Password"
                  : "Set Partner Password"
                : "Update Password"}
            </DialogTitle>
            <DialogDescription className="text-neutral-600">
              {selectedPartnerId
                ? `Enter a new password for ${
                    partners.find((p) => p.id === selectedPartnerId)?.name
                  }`
                : "Enter a new password for this partner"}
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="" 
                        className="border-neutral-300 focus:border-neutral-400 focus:ring-neutral-400" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                >
                  {updatePasswordMutation.isPending ? "Saving..." : "Save Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}