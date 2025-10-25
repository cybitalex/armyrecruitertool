import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Dashboard from "@/pages/dashboard";
import IntakeForm from "@/pages/intake-form";
import RecruitDetail from "@/pages/recruit-detail";
import ProspectingMap from "@/pages/prospecting-map";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/prospecting" component={ProspectingMap} />
      <Route path="/intake" component={IntakeForm} />
      <Route path="/recruits/:id" component={RecruitDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  // Don't show header/footer on prospecting page (it has its own layout)
  const showHeader = location !== "/prospecting";
  const showFooter = location !== "/prospecting";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-army-green flex flex-col">
          {showHeader && <Header />}
          <div className="flex-1">
            <Router />
          </div>
          {showFooter && <Footer />}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
