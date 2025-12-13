import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  QrCode,
  MapPin,
  FileText,
  Users,
  User,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Calendar, MessageSquare, Download, BarChart3, Filter } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  image?: string;
}

interface TutorialContent {
  title: string;
  description: string;
  steps: TutorialStep[];
}

const TUTORIAL_STORAGE_KEY = "army-recruiter-tutorial-completed";
const WELCOME_STORAGE_KEY = "army-recruiter-welcome-shown";

// Tutorial content for different pages
const tutorialContent: Record<string, TutorialContent> = {
  dashboard: {
    title: "Dashboard Overview",
    description: "Learn how to navigate and use your dashboard effectively",
    steps: [
      {
        title: "Overview Tab",
        description:
          "View your key metrics including total recruits, QR code scans, and conversion rates. The stats update automatically every 10 seconds.",
        icon: BarChart3,
      },
      {
        title: "Recent Recruits",
        description:
          "See your most recent applicants. Click on any recruit to view their full details and update their status.",
        icon: Users,
      },
      {
        title: "QR Code Analytics",
        description:
          "Track QR code performance including total scans, conversions, and conversion rates. This helps you measure the effectiveness of your QR codes.",
        icon: QrCode,
      },
      {
        title: "Quick Actions",
        description:
          "Access common actions like viewing your QR code, creating new applications, or exporting data to Excel.",
        icon: FileText,
      },
    ],
  },
  "my-qr": {
    title: "QR Code Management",
    description: "Learn how to use and manage your QR codes",
    steps: [
      {
        title: "Download Your QR Code",
        description:
          "Download your personal QR code to print on business cards, flyers, or display on your phone. Applicants can scan it to apply directly.",
        icon: QrCode,
      },
      {
        title: "Survey QR Code",
        description:
          "Generate a survey QR code for quick feedback during presentations or events. This helps you collect contact information and ratings.",
        icon: MessageSquare,
      },
      {
        title: "Location-Based QR Codes",
        description:
          "Create location-specific QR codes for events or locations. Track which locations generate the most leads.",
        icon: MapPin,
      },
    ],
  },
  prospecting: {
    title: "Prospecting Map",
    description: "Learn how to use the prospecting map to find leads",
    steps: [
      {
        title: "Search Locations",
        description:
          "Search for schools, gyms, malls, and other high-traffic locations in your area. Add them to your prospecting list.",
        icon: MapPin,
      },
      {
        title: "View Location Details",
        description:
          "Click on any location to see details including address, demographics, and prospecting score. Add notes about your visits.",
        icon: FileText,
      },
      {
        title: "Track Events",
        description:
          "Find and track recruiting events like career fairs, sports events, and community festivals. Plan your outreach strategy.",
        icon: Calendar,
      },
    ],
  },
  "station-commander": {
    title: "Station Commander Dashboard",
    description: "Learn how to manage your station and view team performance",
    steps: [
      {
        title: "Overview Tab",
        description:
          "View comprehensive statistics for all recruiters at your station. See total recruits, leads, surveys, QR code scans, and conversion rates for each team member. Stats update automatically every 30 seconds.",
        icon: BarChart3,
      },
      {
        title: "Station Totals",
        description:
          "See aggregated statistics for your entire station at the top of the page. Click on any total (surveys, leads, etc.) to drill down and see which recruiters contributed to that number. This helps you identify top performers.",
        icon: Users,
      },
      {
        title: "Filter and Sort Recruiters",
        description:
          "Use the filter button to filter recruiters by name, or sort by name, leads, surveys, or total recruits. This helps you quickly find specific team members or identify top performers.",
        icon: Filter,
      },
      {
        title: "Leads Tab",
        description:
          "View all leads from all recruiters at your station. See applicant details, source (QR code vs direct), status, and submission dates. Click on any lead to view full details in a new tab.",
        icon: FileText,
      },
      {
        title: "Surveys Tab",
        description:
          "View all survey responses from your station. See ratings, feedback, and contact information from people who scanned survey QR codes. This helps you measure presentation effectiveness.",
        icon: MessageSquare,
      },
      {
        title: "QR Scan Tracking",
        description:
          "Each recruiter's stats include detailed QR scan tracking: total scans, survey scans, conversion rates, and applications/surveys generated from scans. This helps you measure QR code effectiveness across your team.",
        icon: QrCode,
      },
      {
        title: "Export Reports",
        description:
          "Click 'Export Full Report' to download a comprehensive Excel file with all recruit data from your station, including recruiter names and ranks. Perfect for presentations, record-keeping, or sharing with leadership.",
        icon: Download,
      },
    ],
  },
  general: {
    title: "Getting Started",
    description: "Welcome to the Army Recruiter Tool! Here's how to get started",
    steps: [
      {
        title: "Dashboard",
        description:
          "Your dashboard is your command center. View stats, manage recruits, and access all features from here.",
        icon: Home,
      },
      {
        title: "Get Your QR Code",
        description:
          "Navigate to 'My QR Code' to download your personal QR code. Print it on business cards or display it on your phone.",
        icon: QrCode,
      },
      {
        title: "Track Prospecting",
        description:
          "Use the Prospecting Map to find and track high-value locations like schools, gyms, and events in your area.",
        icon: MapPin,
      },
      {
        title: "Manage Recruits",
        description:
          "View all your recruits on the dashboard. Click on any recruit to view details and update their status as they progress.",
        icon: Users,
      },
      {
        title: "Create Applications",
        description:
          "Use 'New Application' to manually enter recruit information or let applicants scan your QR code to apply themselves.",
        icon: FileText,
      },
    ],
  },
};

interface TutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: string;
}

export function Tutorial({ open, onOpenChange, page = "general" }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const content = tutorialContent[page] || tutorialContent.general;
  const totalSteps = content.steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark tutorial as completed
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    onOpenChange(false);
    setCurrentStep(0);
  };

  const step = content.steps[currentStep];
  const StepIcon = step.icon || FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-army-black border-army-field01">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-army-gold text-2xl">
                {content.title}
              </DialogTitle>
              <DialogDescription className="text-army-tan mt-2">
                {content.description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="text-army-tan hover:text-army-gold"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex gap-2">
                {content.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded ${
                      index <= currentStep
                        ? "bg-army-gold"
                        : "bg-army-field01"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Badge className="bg-army-green text-army-tan ml-4">
              {currentStep + 1} of {totalSteps}
            </Badge>
          </div>

          {/* Step content */}
          <Card className="bg-army-green border-army-field01">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-army-gold/20">
                  <StepIcon className="h-6 w-6 text-army-gold" />
                </div>
                <div>
                  <CardTitle className="text-army-gold">
                    {step.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-army-tan text-base leading-relaxed">
                {step.description}
              </CardDescription>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="border-army-field01 text-army-tan hover:bg-army-green hover:text-army-gold disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              className="bg-army-gold text-army-black hover:bg-army-gold/90"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Welcome modal for first-time users
interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Partial<UserType> | null;
}

export function WelcomeModal({ open, onOpenChange, user }: WelcomeModalProps) {
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    onOpenChange(false);
  };

  const handleTakeTutorial = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    onOpenChange(false);
    // Open tutorial after a brief delay
    setTimeout(() => {
      const event = new CustomEvent("open-tutorial", { detail: { page: "general" } });
      window.dispatchEvent(event);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-army-black border-army-field01">
        <DialogHeader>
          <DialogTitle className="text-army-gold text-2xl text-center">
            Welcome to Army Recruiter Tool!
          </DialogTitle>
          <DialogDescription className="text-army-tan text-center mt-2">
            {user?.fullName ? `Welcome, ${user.fullName}!` : "Welcome!"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <Card className="bg-army-green border-army-field01">
            <CardContent className="pt-6">
              <div className="space-y-3 text-army-tan">
                <div className="flex items-start gap-3">
                  <QrCode className="h-5 w-5 text-army-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Get Your QR Code</p>
                    <p className="text-sm text-army-tan/80">
                      Download your personal QR code to share with potential recruits
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-army-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Track Prospecting</p>
                    <p className="text-sm text-army-tan/80">
                      Find and manage high-value locations and events
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-army-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Manage Recruits</p>
                    <p className="text-sm text-army-tan/80">
                      View and track all your applicants in one place
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleGetStarted}
              className="flex-1 border-army-field01 text-army-tan hover:bg-army-green hover:text-army-gold"
            >
              Get Started
            </Button>
            <Button
              onClick={handleTakeTutorial}
              className="flex-1 bg-army-gold text-army-black hover:bg-army-gold/90"
            >
              Take Tutorial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if user should see welcome modal
export function useWelcomeModal() {
  const [showWelcome, setShowWelcome] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!hasSeenWelcome && user) {
      setShowWelcome(true);
    }
  }, [user]);

  return { showWelcome, setShowWelcome };
}

// Helper to get current page for tutorial
export function getTutorialPage(path: string): string {
  if (path === "/" || path === "/dashboard") return "dashboard";
  if (path === "/my-qr") return "my-qr";
  if (path === "/prospecting") return "prospecting";
  if (path === "/station-commander") return "station-commander";
  return "general";
}

