import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Home, Shield } from "lucide-react";

export function Header() {
  const [location, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">U.S. Army</h1>
            <p className="text-xs text-muted-foreground">Recruitment Portal</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button
            variant={location === "/" ? "default" : "ghost"}
            onClick={() => navigate("/")}
            data-testid="nav-dashboard"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={location === "/intake" ? "default" : "ghost"}
            onClick={() => navigate("/intake")}
            data-testid="nav-intake"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </nav>
      </div>
    </header>
  );
}
