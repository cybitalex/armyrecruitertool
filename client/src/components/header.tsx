import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { admin } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Home, Shield, MapPin, Menu, LogOut, User, Users, Settings, HelpCircle, Ship, Bell, BarChart3, QrCode, UserPlus } from "lucide-react";
import { Tutorial, getTutorialPage } from "@/components/tutorial";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { IS_SORB } from "@/lib/sorb-config";

export function Header() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialPage, setTutorialPage] = useState<string>("general");
  const { user, logout } = useAuth();

  // Listen for custom event to open tutorial from welcome modal
  useEffect(() => {
    const handleOpenTutorial = (event: CustomEvent<{ page?: string }>) => {
      setTutorialPage(event.detail?.page || getTutorialPage(location));
      setTutorialOpen(true);
    };

    window.addEventListener("open-tutorial", handleOpenTutorial as EventListener);
    return () => {
      window.removeEventListener("open-tutorial", handleOpenTutorial as EventListener);
    };
  }, [location]);
  
  // Only show logout if user is logged in
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';

  // Fetch pending request counts for admin (poll every 30 seconds)
  const { data: pendingCounts } = useQuery({
    queryKey: ['admin', 'pending-request-counts'],
    queryFn: () => admin.getPendingRequestCounts(),
    enabled: isAdmin && isLoggedIn,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const pendingRequestCount = pendingCounts?.total || 0;

  // Fetch unread notification count (poll every 30 seconds)
  const { data: notificationData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: isLoggedIn,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });

  const unreadNotificationCount = notificationData?.count || 0;

  // Hide main app navigation when viewing the public survey page
  const isSurveyRoute = location.startsWith("/survey");

  const ALL_ROLES = ["recruiter", "station_commander", "pending_station_commander", "admin"];

  // Base navigation items — SORB mode shows a tailored nav
  const baseNavigationItems = IS_SORB
    ? [
        { path: "/",             label: "Dashboard",  icon: Home,      testId: "nav-dashboard",   roles: ALL_ROLES },
        { path: "/analytics",    label: "Analytics",  icon: BarChart3, testId: "nav-analytics",   roles: ALL_ROLES },
        { path: "/sorb-intake",  label: "Add Lead",   icon: UserPlus,  testId: "nav-sorb-intake", roles: ALL_ROLES },
        { path: "/my-qr",        label: "QR Codes",   icon: QrCode,    testId: "nav-qr",          roles: ALL_ROLES },
        { path: "/station-commander", label: "Station Overview", icon: Users, testId: "nav-station-commander", roles: ["station_commander", "admin"] },
        { path: "/admin/requests",    label: "Admin",  icon: Settings, testId: "nav-admin-requests", roles: ["admin"] },
        { path: "/profile",      label: "Profile",    icon: User,      testId: "nav-profile",     roles: ALL_ROLES },
      ]
    : [
        { path: "/",             label: "Dashboard",        icon: Home,     testId: "nav-dashboard",           roles: ALL_ROLES },
        { path: "/prospecting",  label: "Prospecting",      icon: MapPin,   testId: "nav-prospecting",         roles: ALL_ROLES },
        { path: "/intake",       label: "New Application",  icon: FileText, testId: "nav-intake",              roles: ALL_ROLES },
        { path: "/station-commander", label: "Station Overview", icon: Users, testId: "nav-station-commander", roles: ["station_commander", "admin"] },
        { path: "/shippers",     label: "Shippers",         icon: Ship,     testId: "nav-shippers",            roles: ["station_commander", "admin"] },
        { path: "/admin/requests", label: "Admin Requests", icon: Settings, testId: "nav-admin-requests",      roles: ["admin"] },
        { path: "/profile",      label: "Profile",          icon: User,     testId: "nav-profile",             roles: ALL_ROLES },
      ];

  // Filter navigation items based on user role
  // Default to 'recruiter' if role is not set or is null
  const navigationItems = baseNavigationItems.filter((item) => {
    if (!user) return false;
    const userRole = user.role || "recruiter";
    return item.roles.includes(userRole);
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-army-field01 bg-army-black shadow-xl overflow-x-hidden">
      {/* DoD-Style Classification Banner */}
      <div className="bg-[#006400] w-full min-w-0">
        <div className="w-full px-3 md:px-6 py-1.5 flex items-center justify-between">
          <div className="flex-1 text-left">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              Army Recruiter Tool | CyBit Devs
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

      <div className="max-w-7xl mx-auto px-3 md:px-4 h-16 md:h-20 flex items-center justify-between gap-2 md:gap-4 min-w-0 w-full">
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* USAREC Badge Logo */}
          <div className="relative h-12 w-12 md:h-16 md:w-16 flex items-center justify-center flex-shrink-0 bg-transparent">
            <img
              src="/logos/usarec-badge.svg"
              alt="USAREC Badge"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          {/* ARSOF Logo for SORB mode */}
          {IS_SORB && (
            <div className="relative h-10 w-10 md:h-12 md:w-12 flex items-center justify-center flex-shrink-0">
              <img
                src="/logos/ARSOF_RGB.png"
                alt="ARSOF"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          )}
          <div className="border-l-2 border-army-gold pl-2 md:pl-3 flex-shrink-0">
            <h1 className="text-sm md:text-xl font-bold text-army-gold tracking-wider whitespace-nowrap">
              U.S. ARMY
            </h1>
            <p className="text-[10px] md:text-xs text-army-tan font-medium tracking-wide whitespace-nowrap">
              {IS_SORB ? "SPECIAL OPERATIONS RECRUITING" : "RECRUITING OPERATIONS"}
            </p>
          </div>
        </div>

        {/* Mobile Menu Button (hidden on public survey route) - show hamburger up to lg breakpoint for better fit */}
        {!isSurveyRoute && (
          <div className="lg:hidden">
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
                    const showBadge = item.path === "/admin/requests" && pendingRequestCount > 0;
                    return (
                      <Button
                        key={item.path}
                        variant={location === item.path ? "default" : "ghost"}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        data-testid={item.testId}
                        className={`w-full justify-start relative ${
                          location === item.path
                            ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                            : "text-army-tan hover:text-army-gold hover:bg-army-green"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                        {showBadge && (
                          <Badge className="ml-auto bg-red-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                  {isLoggedIn && (
                    <>
                      <div className="border-t border-army-field01 mt-4 pt-4">
                        <div className="px-2 mb-2">
                          <NotificationsDropdown 
                            unreadCount={unreadNotificationCount}
                            className="w-full justify-start text-army-tan hover:text-army-gold hover:bg-army-green"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setTutorialOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-army-tan hover:text-army-gold hover:bg-army-green"
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        Help & Tutorial
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await logout();
                          navigate("/login");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-army-tan hover:text-red-400 hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Desktop Navigation (hidden on public survey route) */}
        {!isSurveyRoute && (
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.path === "/admin/requests" && pendingRequestCount > 0;
              return (
                <Button
                  key={item.path}
                  variant={location === item.path ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  data-testid={item.testId}
                  size="sm"
                  className={`relative ${
                    location === item.path
                      ? "bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                      : "text-army-tan hover:text-army-gold hover:bg-army-green"
                  }`}
                >
                  <Icon className="w-4 h-4 md:mr-1" />
                  <span className="hidden xl:inline">{item.label}</span>
                  {showBadge && (
                    <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full border-2 border-army-black">
                      {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
            {isLoggedIn && (
              <>
                <NotificationsDropdown 
                  unreadCount={unreadNotificationCount}
                  iconOnly={true}
                  className="text-army-tan hover:text-army-gold hover:bg-army-green"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTutorialOpen(true)}
                  className="text-army-tan hover:text-army-gold hover:bg-army-green"
                  title="Help & Tutorial"
                >
                  <HelpCircle className="w-4 h-4 xl:mr-1" />
                  <span className="hidden xl:inline">Help</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="text-army-tan hover:text-red-400 hover:bg-red-900/20 border-l border-army-field01 pl-2"
                >
                  <LogOut className="w-4 h-4 xl:mr-1" />
                  <span className="hidden xl:inline">Logout</span>
                </Button>
              </>
            )}
          </nav>
        )}
      </div>

      {/* Tutorial Dialog */}
      <Tutorial
        open={tutorialOpen}
        onOpenChange={setTutorialOpen}
        page={tutorialPage}
      />
    </header>
  );
}
