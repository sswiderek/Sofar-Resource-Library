import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminPage from "@/pages/admin-page";
import AdminDashboard from "@/pages/admin";
import AnalyticsDashboard from "@/pages/admin/analytics";
import Layout from "@/components/Layout";
import { PasswordProtection } from "@/components/PasswordProtection";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AnalyticsDashboard} />
        <Route path="/admin/legacy" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PasswordProtection>
        <Router />
        <Toaster />
      </PasswordProtection>
    </QueryClientProvider>
  );
}

export default App;
