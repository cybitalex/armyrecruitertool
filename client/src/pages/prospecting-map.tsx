import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngBounds, LatLngTuple } from "leaflet";
import type { Location, Event } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AIAssistant } from "@/components/ai-assistant";
import { Footer } from "@/components/footer";
import {
  MapPin,
  Calendar,
  Search,
  Filter,
  Navigation,
  School,
  Dumbbell,
  Building2,
  Users,
  ShoppingBag,
  Radar,
  Loader2,
  ExternalLink,
  Clock,
  MapPinIcon,
  Globe,
  Home,
  FileText,
  Menu,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

// Component to fit map bounds when markers change
function MapBoundsUpdater({
  locations,
  events,
  showLocations,
  showEvents,
}: {
  locations: Location[];
  events: Event[];
  showLocations: boolean;
  showEvents: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const markers: LatLngTuple[] = [];

    if (showLocations) {
      locations.forEach((loc) => {
        markers.push([parseFloat(loc.latitude), parseFloat(loc.longitude)]);
      });
    }

    if (showEvents) {
      events.forEach((evt) => {
        markers.push([parseFloat(evt.latitude), parseFloat(evt.longitude)]);
      });
    }

    if (markers.length > 0) {
      const bounds = new LatLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, locations, events, showLocations, showEvents]);

  return null;
}

export default function ProspectingMap() {
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [showLocations, setShowLocations] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [activeTab, setActiveTab] = useState<"locations" | "events">(
    "locations"
  );
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const { toast } = useToast();

  // Prevent body scrolling on desktop only
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const updateOverflow = () => {
      if (mediaQuery.matches) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    };

    updateOverflow();
    mediaQuery.addEventListener("change", updateOverflow);

    return () => {
      document.body.style.overflow = "unset";
      mediaQuery.removeEventListener("change", updateOverflow);
    };
  }, []);

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Mutation to search nearby and add locations
  const searchNearbyMutation = useMutation({
    mutationFn: async () => {
      if (!userLocation) throw new Error("Location not available");

      // Search for nearby locations
      const searchResult = await apiRequest("POST", "/api/places/search", {
        latitude: userLocation[0],
        longitude: userLocation[1],
        radius: 5000, // 5km
      });

      // Add each found location to the database
      const addedLocations = [];
      const locations = searchResult.locations || [];

      for (const location of locations) {
        try {
          const added = await apiRequest("POST", "/api/locations", location);
          addedLocations.push(added);
        } catch (error) {
          console.error("Error adding location:", location.name, error);
          console.error("Location data:", location);
        }
      }

      return { searchResult, addedLocations };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Locations Found!",
        description: `Found and added ${data.addedLocations.length} nearby recruiting locations.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const searchNearbyEventsMutation = useMutation({
    mutationFn: async () => {
      if (!userLocation) throw new Error("Location not available");

      // Search for nearby events
      const searchResult = await apiRequest(
        "POST",
        "/api/places/search-events",
        {
          latitude: userLocation[0],
          longitude: userLocation[1],
          radius: 25, // 25 miles
        }
      );

      // Add each found event to the database
      const addedEvents = [];
      const events = searchResult.events || [];

      for (const event of events) {
        try {
          const added = await apiRequest("POST", "/api/events", event);
          addedEvents.push(added);
        } catch (error) {
          console.error("Error adding event:", error);
        }
      }

      return { searchResult, addedEvents };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (data.addedEvents.length > 0) {
        toast({
          title: "Events Found!",
          description: `Found and added ${data.addedEvents.length} upcoming recruiting events.`,
        });
      } else {
        toast({
          title: "No Events Found",
          description:
            "Add EVENTBRITE_API_KEY to .env to discover real events nearby.",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get user's current location on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Could not get your location. Using default view.");
          // Default to US center if geolocation fails
          setUserLocation([39.8283, -98.5795]);
        }
      );
    } else {
      setLocationError("Geolocation not supported by your browser.");
      setUserLocation([39.8283, -98.5795]); // US center
    }
  }, []);

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesSearch =
        searchQuery === "" ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || location.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [locations, searchQuery, typeFilter]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchQuery === "" ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.type.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [events, searchQuery]);

  // Custom icons for different location types
  const getLocationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      school: "🎓",
      gym: "💪",
      mall: "🛍️",
      event_venue: "🎪",
      community_center: "🏢",
    };

    const emoji = iconMap[type] || "📍";

    return new Icon({
      iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="24">${emoji}</text></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const getEventIcon = () => {
    return new Icon({
      iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="24">📅</text></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "school":
        return <School className="w-4 h-4" />;
      case "gym":
        return <Dumbbell className="w-4 h-4" />;
      case "mall":
        return <ShoppingBag className="w-4 h-4" />;
      case "event_venue":
        return <Building2 className="w-4 h-4" />;
      case "community_center":
        return <Users className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  // Use user's location or default center
  const mapCenter: LatLngTuple = userLocation || [39.8283, -98.5795]; // US center as fallback

  // Don't render map until we have a location
  if (!userLocation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Getting your location...</p>
          {locationError && (
            <p className="text-sm text-destructive mt-2">{locationError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="md:fixed md:inset-0 bg-army-green min-h-screen md:h-screen md:overflow-hidden">
      {/* Desktop: Fixed height container, Mobile: Allow scrolling */}
      <div className="flex flex-col h-full md:overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bg-[#006400] w-full shrink-0">
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

        {/* Main App Navigation */}
        <div className="bg-army-black border-b border-army-field01 shrink-0">
          <div className="px-3 md:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative h-8 w-8 md:h-10 md:w-10 shrink-0">
                <img
                  src="/logos/Mark_of_the_United_States_Army.svg"
                  alt="U.S. Army"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              <div className="border-l-2 border-army-gold pl-2">
                <h1 className="text-xs md:text-sm font-bold text-army-gold tracking-wider">
                  U.S. ARMY
                </h1>
                <p className="text-[10px] text-army-tan font-medium">
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
                <SheetContent
                  side="right"
                  className="bg-army-black border-army-field01 w-72"
                >
                  <SheetHeader>
                    <SheetTitle className="text-army-gold">
                      Navigation
                    </SheetTitle>
                    <SheetDescription className="text-army-tan">
                      Army Recruiting Operations
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate("/");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-army-tan hover:text-army-gold hover:bg-army-green"
                    >
                      <Home className="w-4 h-4 mr-3" />
                      Dashboard
                    </Button>
                    <Button
                      variant="default"
                      className="w-full justify-start bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold"
                    >
                      <MapPin className="w-4 h-4 mr-3" />
                      Prospecting
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate("/intake");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-army-tan hover:text-army-gold hover:bg-army-green"
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      New Application
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-army-tan hover:text-army-gold hover:bg-army-green text-xs md:text-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold text-xs md:text-sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Prospecting
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/intake")}
                className="text-army-tan hover:text-army-gold hover:bg-army-green text-xs md:text-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </nav>
          </div>
        </div>

        {/* Page Header - Fixed at top */}
        <div className="bg-army-black border-b border-army-field01 px-3 md:px-6 py-3 md:py-4 shadow-lg shrink-0">
          <div className="max-w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-army-gold flex items-center gap-2 tracking-wide">
                  <Navigation className="w-6 h-6 md:w-8 md:h-8 drop-shadow-lg" />
                  🗺️ PROSPECTING MAP
                </h1>
                <p className="text-army-tan mt-1 font-medium text-sm md:text-base">
                  Discover prime locations and events for Army recruiting
                </p>
                {userLocation && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="secondary"
                      className="bg-blue-500/20 text-blue-300 border-blue-400"
                    >
                      📍 {userLocation[0].toFixed(2)}°,{" "}
                      {userLocation[1].toFixed(2)}°
                    </Badge>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => searchNearbyMutation.mutate()}
                  disabled={!userLocation || searchNearbyMutation.isPending}
                  className="bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold shadow-lg"
                >
                  {searchNearbyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Radar className="w-4 h-4 mr-2" />
                      Find Locations Near Me
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => searchNearbyEventsMutation.mutate()}
                  disabled={
                    !userLocation || searchNearbyEventsMutation.isPending
                  }
                  className="bg-army-green text-army-gold hover:bg-army-green/80 border-2 border-army-gold font-semibold shadow-lg"
                >
                  {searchNearbyEventsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Find Events Near Me
                    </>
                  )}
                </Button>
                <Button
                  variant={showLocations ? "default" : "outline"}
                  onClick={() => setShowLocations(!showLocations)}
                  className={
                    showLocations
                      ? "bg-army-field01 text-army-gold hover:bg-army-field01/90 font-semibold"
                      : "border-army-field01 text-army-tan hover:bg-army-field01/20 hover:text-army-gold"
                  }
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Locations ({locations.length})
                </Button>
                <Button
                  variant={showEvents ? "default" : "outline"}
                  onClick={() => setShowEvents(!showEvents)}
                  className={
                    showEvents
                      ? "bg-army-field01 text-army-gold hover:bg-army-field01/90 font-semibold"
                      : "border-army-field01 text-army-tan hover:bg-army-field01/20 hover:text-army-gold"
                  }
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Events ({events.length})
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations or events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 md:pl-10 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <Filter className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="school">Schools</SelectItem>
                  <SelectItem value="gym">Gyms</SelectItem>
                  <SelectItem value="mall">Malls</SelectItem>
                  <SelectItem value="event_venue">Event Venues</SelectItem>
                  <SelectItem value="community_center">
                    Community Centers
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Map and List Layout - Mobile: Stack vertically and scroll, Desktop: Side-by-side with fixed height */}
        <div className="flex flex-col md:flex-row md:flex-1 md:overflow-hidden md:min-h-0">
          {/* Map Container - Mobile: Fixed height, Desktop: Fill available space */}
          <div className="relative h-[50vh] md:h-full md:flex-1">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBoundsUpdater
                locations={filteredLocations}
                events={filteredEvents}
                showLocations={showLocations}
                showEvents={showEvents}
              />

              {/* Location Markers */}
              {showLocations &&
                filteredLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={[
                      parseFloat(location.latitude),
                      parseFloat(location.longitude),
                    ]}
                    icon={getLocationIcon(location.type)}
                    eventHandlers={{
                      click: () => {
                        setSelectedLocation(location);
                        setActiveTab("locations");
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[250px]">
                        <h3 className="font-bold text-base">{location.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize mt-1">
                          {location.type.replace(/_/g, " ")}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge
                            variant={getScoreBadgeColor(
                              location.prospectingScore
                            )}
                            className="text-xs"
                          >
                            Score: {location.prospectingScore}
                          </Badge>
                          {location.footTraffic && (
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {location.footTraffic} Traffic
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            📍 {location.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {location.city}, {location.state} {location.zipCode}
                          </p>
                        </div>

                        {location.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {location.description}
                          </p>
                        )}

                        {location.notes && (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            💡 {location.notes}
                          </p>
                        )}

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
                        >
                          <MapPinIcon className="w-3 h-3" />
                          Open in Google Maps
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={
                    new Icon({
                      iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="8" fill="%234285f4" stroke="white" stroke-width="3"/><circle cx="20" cy="20" r="15" fill="%234285f4" opacity="0.2"/></svg>`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20],
                    })
                  }
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">📍 Your Location</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You are here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {userLocation[0].toFixed(4)}
                        <br />
                        Lng: {userLocation[1].toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Event Markers */}
              {showEvents &&
                filteredEvents.map((event) => (
                  <Marker
                    key={event.id}
                    position={[
                      parseFloat(event.latitude),
                      parseFloat(event.longitude),
                    ]}
                    icon={getEventIcon()}
                    eventHandlers={{
                      click: () => {
                        setSelectedEvent(event);
                        setActiveTab("events");
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{event.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {event.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm mt-1">{event.address}</p>
                        <p className="text-sm mt-1">
                          📅 {new Date(event.eventDate).toLocaleDateString()}
                          {event.eventTime && ` at ${event.eventTime}`}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge>{event.status}</Badge>
                        </div>
                        <div className="mt-2 flex flex-col gap-1">
                          {event.eventUrl ? (
                            <a
                              href={event.eventUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Calendar className="w-3 h-3" />
                              Event Page
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(
                                event.name +
                                  " " +
                                  event.city +
                                  " " +
                                  event.state
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium"
                            >
                              <Globe className="w-3 h-3" />
                              Search Online
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {event.locationUrl && (
                            <a
                              href={event.locationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                              <MapPinIcon className="w-3 h-3" />
                              View Location
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          {/* Results List - Mobile: Scrollable below map, Desktop: Fixed sidebar with scroll */}
          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l bg-card md:h-full">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "locations" | "events")}
              className="flex flex-col md:h-full"
            >
              <div className="bg-card border-b shrink-0 sticky top-0 z-10">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="locations" className="text-xs md:text-sm">
                    Locations ({filteredLocations.length})
                  </TabsTrigger>
                  <TabsTrigger value="events" className="text-xs md:text-sm">
                    Events ({filteredEvents.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="locations"
                className="p-2 md:p-4 space-y-2 md:space-y-3 mt-0 md:overflow-y-auto md:flex-1"
              >
                {filteredLocations.map((location) => (
                  <Card
                    key={location.id}
                    className={`p-3 md:p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedLocation?.id === location.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedLocation(location);
                      setLocationDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="mt-1">{getTypeIcon(location.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
                          {location.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground capitalize">
                          {location.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                          {location.city}, {location.state}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={getScoreBadgeColor(
                              location.prospectingScore
                            )}
                          >
                            Score: {location.prospectingScore}
                          </Badge>
                          {location.footTraffic && (
                            <Badge variant="outline" className="capitalize">
                              {location.footTraffic} Traffic
                            </Badge>
                          )}
                        </div>
                        {location.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {location.description}
                          </p>
                        )}
                        {location.notes && (
                          <p className="text-xs italic text-muted-foreground mt-1">
                            Note: {location.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredLocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations found
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="events"
                className="p-2 md:p-4 space-y-2 md:space-y-3 mt-0 md:overflow-y-auto md:flex-1"
              >
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className={`p-3 md:p-4 transition-all hover:shadow-md ${
                      selectedEvent?.id === event.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 mt-1 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm md:text-base">
                          {event.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground capitalize">
                          {event.type.replace(/_/g, " ")}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge>{event.status}</Badge>
                          {event.targetAudience && (
                            <Badge variant="outline" className="capitalize">
                              {event.targetAudience.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground mt-2">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.eventDate).toLocaleDateString()}
                            {event.eventTime && ` • ${event.eventTime}`}
                          </p>
                          <p className="flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-3 h-3" />
                            {event.city}, {event.state}
                          </p>
                        </div>
                        {event.expectedAttendance && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Expected:{" "}
                            {event.expectedAttendance.toLocaleString()}{" "}
                            attendees
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setEventDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            View Details
                          </Button>
                          {event.eventUrl ? (
                            <Button
                              size="sm"
                              variant="default"
                              asChild
                              className="text-xs bg-blue-600 hover:bg-blue-700"
                            >
                              <a
                                href={event.eventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                Event Page
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="text-xs"
                            >
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(
                                  event.name +
                                    " " +
                                    event.city +
                                    " " +
                                    event.state
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                <Globe className="w-3 h-3" />
                                Search Online
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                          {event.locationUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              asChild
                              className="text-xs"
                            >
                              <a
                                href={event.locationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                <MapPinIcon className="w-3 h-3" />
                                Location
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No events found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer - Desktop Only */}
        <div className="hidden md:block shrink-0">
          <Footer />
        </div>
      </div>

      {/* Location Details Dialog - Condensed */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl pr-6">
                  {selectedLocation.name}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant={getScoreBadgeColor(
                        selectedLocation.prospectingScore
                      )}
                    >
                      Score: {selectedLocation.prospectingScore}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedLocation.type.replace(/_/g, " ")}
                    </Badge>
                    {selectedLocation.footTraffic && (
                      <Badge variant="secondary" className="capitalize">
                        {selectedLocation.footTraffic} Traffic
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-4">
                {/* Location Info */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.city}, {selectedLocation.state}{" "}
                        {selectedLocation.zipCode}
                      </p>
                      <Button
                        size="sm"
                        variant="link"
                        asChild
                        className="h-auto p-0 mt-1"
                      >
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs"
                        >
                          <MapPinIcon className="w-3 h-3" />
                          Open in Google Maps
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedLocation.description && (
                  <div>
                    <p className="font-medium text-sm mb-1">Details</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.description}
                    </p>
                  </div>
                )}

                {/* Demographics */}
                {selectedLocation.demographics &&
                  (() => {
                    try {
                      const demo = JSON.parse(selectedLocation.demographics);
                      return (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="font-medium text-sm mb-2">Info</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {demo.rating && (
                              <p>
                                ⭐ Rating: {demo.rating}/5 ({demo.totalRatings}{" "}
                                reviews)
                              </p>
                            )}
                            {demo.source && <p>📍 Source: {demo.source}</p>}
                          </div>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}

                {/* Notes */}
                {selectedLocation.notes && (
                  <div>
                    <p className="font-medium text-sm mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground italic">
                      {selectedLocation.notes}
                    </p>
                  </div>
                )}

                {/* Last Visited */}
                {selectedLocation.lastVisited && (
                  <div>
                    <p className="font-medium text-sm mb-1">Last Visited</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        selectedLocation.lastVisited
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button asChild className="flex-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      Open in Maps
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocationDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl pr-6">
                  {selectedEvent.name}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge>{selectedEvent.status}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedEvent.type.replace(/_/g, " ")}
                    </Badge>
                    {selectedEvent.targetAudience && (
                      <Badge variant="secondary" className="capitalize">
                        {selectedEvent.targetAudience.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Date and Time */}
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedEvent.eventDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    {selectedEvent.eventTime && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {selectedEvent.eventTime}
                      </p>
                    )}
                    {selectedEvent.endDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ends:{" "}
                        {new Date(selectedEvent.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPinIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.city}, {selectedEvent.state}{" "}
                      {selectedEvent.zipCode}
                    </p>
                    {selectedEvent.locationUrl && (
                      <Button
                        size="sm"
                        variant="link"
                        asChild
                        className="h-auto p-0 mt-2"
                      >
                        <a
                          href={selectedEvent.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs"
                        >
                          <MapPinIcon className="w-3 h-3" />
                          Open in Google Maps
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Attendance */}
                {selectedEvent.expectedAttendance && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">
                        Expected Attendance
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.expectedAttendance.toLocaleString()}{" "}
                        attendees
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                {(selectedEvent.contactName ||
                  selectedEvent.contactPhone ||
                  selectedEvent.contactEmail) && (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Contact Information</p>
                    {selectedEvent.contactName && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Name:</span>{" "}
                        {selectedEvent.contactName}
                      </p>
                    )}
                    {selectedEvent.contactPhone && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Phone:</span>{" "}
                        <a
                          href={`tel:${selectedEvent.contactPhone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedEvent.contactPhone}
                        </a>
                      </p>
                    )}
                    {selectedEvent.contactEmail && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Email:</span>{" "}
                        <a
                          href={`mailto:${selectedEvent.contactEmail}`}
                          className="text-primary hover:underline"
                        >
                          {selectedEvent.contactEmail}
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedEvent.cost && (
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase">
                        Cost
                      </p>
                      <p className="text-sm">{selectedEvent.cost}</p>
                    </div>
                  )}
                  {selectedEvent.registrationRequired && (
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase">
                        Registration
                      </p>
                      <p className="text-sm capitalize">
                        {selectedEvent.registrationRequired}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedEvent.notes && (
                  <div className="space-y-2 pt-3 border-t">
                    <p className="font-semibold text-xs text-muted-foreground uppercase">
                      Notes
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedEvent.eventUrl ? (
                    <Button
                      asChild
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <a
                        href={selectedEvent.eventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Event Page
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="flex-1">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          selectedEvent.name +
                            " " +
                            selectedEvent.city +
                            " " +
                            selectedEvent.state
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Globe className="w-4 h-4" />
                        Search Online
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {selectedEvent.locationUrl && (
                    <Button asChild variant="secondary" className="flex-1">
                      <a
                        href={selectedEvent.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <MapPinIcon className="w-4 h-4" />
                        View Location
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setEventDialogOpen(false)}
                    className="w-full md:flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Assistant - Floating Button */}
      <AIAssistant
        userLocation={
          userLocation
            ? { latitude: userLocation[0], longitude: userLocation[1] }
            : undefined
        }
      />
    </div>
  );
}
