import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Home, Shield, MapPin } from "lucide-react";

export function Header() {
  const [location, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-army-field01 bg-army-black/95 backdrop-blur supports-[backdrop-filter]:bg-army-black/60 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* U.S. Army Official Logo */}
          <div className="relative h-16 w-16 flex items-center justify-center">
            <img
              src="/logos/Mark_of_the_United_States_Army.svg"
              alt="U.S. Army"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          <div className="border-l-2 border-army-gold pl-3">
            <h1 className="text-xl font-bold text-army-gold tracking-wider">
              U.S. ARMY
            </h1>
            <p className="text-xs text-army-tan font-medium tracking-wide">
              RECRUITING OPERATIONS
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button
            variant={location === "/" ? "default" : "ghost"}
            onClick={() => navigate("/")}
            data-testid="nav-dashboard"
            className={
              location === "/"
                ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                : "text-army-tan hover:text-army-gold hover:bg-army-green"
            }
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={location === "/prospecting" ? "default" : "ghost"}
            onClick={() => navigate("/prospecting")}
            data-testid="nav-prospecting"
            className={
              location === "/prospecting"
                ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                : "text-army-tan hover:text-army-gold hover:bg-army-green"
            }
          >
            <MapPin className="w-4 h-4 mr-2" />
            Prospecting
          </Button>
          <Button
            variant={location === "/intake" ? "default" : "ghost"}
            onClick={() => navigate("/intake")}
            data-testid="nav-intake"
            className={
              location === "/intake"
                ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                : "text-army-tan hover:text-army-gold hover:bg-army-green"
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </nav>
      </div>
    </header>
  );
}
