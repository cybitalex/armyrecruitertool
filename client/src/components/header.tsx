import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Home, Shield, MapPin, Menu } from "lucide-react";

export function Header() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: Home,
      testId: "nav-dashboard",
    },
    {
      path: "/prospecting",
      label: "Prospecting",
      icon: MapPin,
      testId: "nav-prospecting",
    },
    {
      path: "/intake",
      label: "New Application",
      icon: FileText,
      testId: "nav-intake",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-army-field01 bg-army-black/95 backdrop-blur supports-[backdrop-filter]:bg-army-black/60 shadow-xl">
      {/* Security Classification Banner */}
      <div className="bg-green-900 border-b border-green-700">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Shield className="w-3 h-3 md:w-4 md:h-4 text-green-300" />
            <span className="font-mono font-bold text-green-300">
              UNCLASSIFIED
            </span>
          </div>
          <div className="text-[10px] md:text-xs text-green-400/80 hidden sm:block">
            CyBit Devs • SGT Alex Moran
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 h-16 md:h-20 flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* U.S. Army Official Logo */}
          <div className="relative h-10 w-10 md:h-16 md:w-16 flex items-center justify-center shrink-0">
            <img
              src="/logos/Mark_of_the_United_States_Army.svg"
              alt="U.S. Army"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          <div className="border-l-2 border-army-gold pl-2 md:pl-3 min-w-0">
            <h1 className="text-sm md:text-xl font-bold text-army-gold tracking-wider">
              U.S. ARMY
            </h1>
            <p className="text-[10px] md:text-xs text-army-tan font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
              RECRUITING OPERATIONS
            </p>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="border-army-gold text-army-gold hover:bg-army-gold hover:text-army-black"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-army-black border-army-field01 w-72">
              <SheetHeader>
                <SheetTitle className="text-army-gold">Navigation</SheetTitle>
                <SheetDescription className="text-army-tan">
                  Army Recruiting Operations
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-6 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={location === item.path ? "default" : "ghost"}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      data-testid={item.testId}
                      className={`w-full justify-start ${
                        location === item.path
                          ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                          : "text-army-tan hover:text-army-gold hover:bg-army-green"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={location === item.path ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                data-testid={item.testId}
                className={
                  location === item.path
                    ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                    : "text-army-tan hover:text-army-gold hover:bg-army-green"
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
