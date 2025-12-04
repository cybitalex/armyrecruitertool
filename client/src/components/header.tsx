import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Home, Shield, MapPin, Menu, LogOut, User, Users, Settings } from "lucide-react";

export function Header() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
  // Only show logout if user is logged in
  const isLoggedIn = !!user;

  // Hide main app navigation when viewing the public survey page
  const isSurveyRoute = location.startsWith("/survey");

  // Base navigation items for all logged in users
  const baseNavigationItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: Home,
      testId: "nav-dashboard",
      roles: ["recruiter", "station_commander", "pending_station_commander", "admin"],
    },
    // TEMPORARILY DISABLED - Prospecting Map Feature
    // {
    //   path: "/prospecting",
    //   label: "Prospecting",
    //   icon: MapPin,
    //   testId: "nav-prospecting",
    //   roles: ["recruiter", "station_commander", "pending_station_commander", "admin"],
    // },
    {
      path: "/intake",
      label: "New Application",
      icon: FileText,
      testId: "nav-intake",
      roles: ["recruiter", "station_commander", "pending_station_commander", "admin"],
    },
    {
      path: "/station-commander",
      label: "Station Overview",
      icon: Users,
      testId: "nav-station-commander",
      roles: ["station_commander", "admin"],
    },
    {
      path: "/admin/requests",
      label: "Admin Requests",
      icon: Settings,
      testId: "nav-admin-requests",
      roles: ["admin"],
    },
    {
      path: "/profile",
      label: "Profile",
      icon: User,
      testId: "nav-profile",
      roles: ["recruiter", "station_commander", "pending_station_commander", "admin"],
    },
  ];

  // Filter navigation items based on user role
  // Default to 'recruiter' if role is not set or is null
  const navigationItems = baseNavigationItems.filter((item) => {
    if (!user) return false;
    const userRole = user.role || "recruiter";
    return item.roles.includes(userRole);
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-army-field01 bg-army-black shadow-xl">
      {/* DoD-Style Classification Banner */}
      <div className="bg-[#006400] w-full">
        <div className="w-full px-3 md:px-6 py-1.5 flex items-center justify-between">
          <div className="flex-1 text-left">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              Army Recruiting Tool | CyBit Devs
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="font-mono font-bold text-sm md:text-base text-white uppercase tracking-wider">
              UNCLASSIFIED
            </span>
          </div>
          <div className="flex-1 text-right">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              FPCON NORMAL
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 h-16 md:h-20 flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* U.S. Army Official Logo */}
          <div className="relative h-12 w-12 md:h-16 md:w-16 flex items-center justify-center flex-shrink-0">
            <img
              src="/logos/Mark_of_the_United_States_Army.svg"
              alt="U.S. Army"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          <div className="border-l-2 border-army-gold pl-2 md:pl-3 flex-shrink-0">
            <h1 className="text-sm md:text-xl font-bold text-army-gold tracking-wider whitespace-nowrap">
              U.S. ARMY
            </h1>
            <p className="text-[10px] md:text-xs text-army-tan font-medium tracking-wide whitespace-nowrap">
              RECRUITING OPERATIONS
            </p>
          </div>
        </div>

        {/* Mobile Menu Button (hidden on public survey route) */}
        {!isSurveyRoute && (
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
              <SheetContent
                side="right"
                className="bg-army-black border-army-field01 w-72"
              >
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
                  {isLoggedIn && (
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        await logout();
                        navigate("/login");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-army-tan hover:text-red-400 hover:bg-red-900/20 border-t border-army-field01 mt-4 pt-4"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Desktop Navigation (hidden on public survey route) */}
        {!isSurveyRoute && (
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
            {isLoggedIn && (
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="text-army-tan hover:text-red-400 hover:bg-red-900/20 ml-2 border-l border-army-field01 pl-3"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
