import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ProtectedRoute } from "@/lib/auth-context";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import { Icon, LatLngBounds, LatLngTuple } from "leaflet";
import type { Location, Event } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { recruiter } from "@/lib/api";
import "leaflet/dist/leaflet.css";

// Component to fit map bounds when markers change and update center
function MapBoundsUpdater({
  locations,
  events,
  showLocations,
  showEvents,
  searchCenter,
  searchRadius,
}: {
  locations: Location[];
  events: Event[];
  showLocations: boolean;
  showEvents: boolean;
  searchCenter?: LatLngTuple | null;
  searchRadius?: number;
}) {
  const map = useMap();

  useEffect(() => {
    // If we have a search center (from zip code or current location), center on it
    if (searchCenter) {
      map.setView(searchCenter, searchRadius ? 12 : 13);
      return;
    }

    // Otherwise, fit bounds to markers
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
  }, [map, locations, events, showLocations, showEvents, searchCenter, searchRadius]);

  return null;
}

function ProspectingMap() {
  const [, navigate] = useLocation();
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
  const [zipCode, setZipCode] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"current" | "zip">("current");
  const [searchCenter, setSearchCenter] = useState<LatLngTuple | null>(null);
  const [searchRadius, setSearchRadius] = useState<number | null>(null);
  const [zipCodeCoords, setZipCodeCoords] = useState<LatLngTuple | null>(null);
  const [locationsPage, setLocationsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const itemsPerPage = 15;
  const [activeSearchType, setActiveSearchType] = useState<"locations-current" | "locations-zip" | "events-current" | "events-zip" | null>(null);
  const { toast } = useToast();

  // Get recruiter's zip code
  const { data: recruiterZipCode } = useQuery({
    queryKey: ["/recruiter/zip-code"],
    queryFn: async () => {
      const response = await recruiter.getZipCode();
      return response.zipCode || "";
    },
  });

  useEffect(() => {
    if (recruiterZipCode) {
      setZipCode(recruiterZipCode);
    }
  }, [recruiterZipCode]);

  // Update zip code mutation
  const updateZipCodeMutation = useMutation({
    mutationFn: async (zip: string) => {
      return recruiter.updateZipCode(zip);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/recruiter/zip-code"] });
      toast({
        title: "Zip Code Saved",
        description: "Your zip code has been saved. Searches will use this area.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to save zip code",
        variant: "destructive",
      });
    },
  });

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

  const { data: locations = [], refetch: refetchLocations, isLoading: locationsLoading, error: locationsError } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await fetch("/api/locations", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }
      const data = await response.json();
      console.log("📍 Fetched locations:", data?.length || 0, "locations");
      return Array.isArray(data) ? data : [];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: events = [], refetch: refetchEvents } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      return response.json();
    },
  });

  // Geocode zip code to get coordinates (via backend API)
  const geocodeZipCode = async (zip: string): Promise<LatLngTuple | null> => {
    try {
      const response = await apiRequest("POST", "/api/places/geocode-zip", {
        zipCode: zip,
      });
      
      if (response.latitude && response.longitude) {
        return [response.latitude, response.longitude];
      }
      return null;
    } catch (error) {
      console.error('Error geocoding zip code:', error);
      throw error; // Re-throw so the mutation can handle it
    }
  };

  // Mutation to search nearby and add locations
  const searchNearbyMutation = useMutation({
    mutationFn: async (useZip: boolean) => {
      let latitude: number;
      let longitude: number;
      let useZipCode = false;
      let center: LatLngTuple | null = null;

      if (useZip) {
        if (!zipCode || zipCode.length !== 5) {
          throw new Error("Please enter a valid 5-digit zip code");
        }
        // Geocode zip code to get coordinates via backend API
        try {
          const coords = await geocodeZipCode(zipCode);
          if (!coords) {
            throw new Error("Could not find coordinates for that zip code. Please check the zip code and try again.");
          }
          latitude = coords[0];
          longitude = coords[1];
          center = coords;
          useZipCode = true;
          setZipCodeCoords(coords);
        } catch (error: any) {
          // Re-throw with a more user-friendly message
          throw new Error(error?.message || "Could not find coordinates for that zip code. Please check the zip code and try again.");
        }
      } else {
        if (!userLocation) {
          throw new Error("Location not available. Please enable location access.");
        }
        latitude = userLocation[0];
        longitude = userLocation[1];
        center = userLocation;
        useZipCode = false;
      }

      const searchResult = await apiRequest("POST", "/api/places/search", {
        latitude,
        longitude,
        useZipCode,
        zipCode: useZip ? zipCode : undefined, // Pass zip code for filtering
      });

      // Set search center and radius for map display
      setSearchCenter(center);
      setSearchRadius(useZipCode ? 5000 : 5000); // 5km for both zip and current location

      // Clear old locations before adding new ones (only if this is a new search)
      // Delete all existing locations to start fresh
      try {
        const existingLocations = await apiRequest("GET", "/api/locations");
        if (Array.isArray(existingLocations) && existingLocations.length > 0) {
          // Delete all existing locations
          for (const loc of existingLocations) {
            try {
              await apiRequest("DELETE", `/api/locations/${loc.id}`);
            } catch (err) {
              // Ignore errors for individual deletes
              console.warn("Could not delete location:", loc.id);
            }
          }
          console.log(`🗑️ Cleared ${existingLocations.length} old locations`);
        }
      } catch (error) {
        console.warn("Could not clear old locations:", error);
        // Continue anyway
      }

      // Add all found locations to the database in a batch to avoid rate limiting
      const locations = searchResult.locations || [];
      let addedLocations = [];

      if (locations.length > 0) {
        try {
          const batchResult = await apiRequest("POST", "/api/locations/batch", {
            locations: locations,
          });
          addedLocations = batchResult.locations || [];
          
          if (batchResult.errors && batchResult.errors.length > 0) {
            console.warn(`⚠️ Some locations failed to add:`, batchResult.errors);
          }
        } catch (error) {
          console.error("Error batch adding locations:", error);
          // Fallback: try adding them one by one with delays (for backwards compatibility)
          console.log("Falling back to individual location creation with delays...");
          for (const location of locations) {
            try {
              const added = await apiRequest("POST", "/api/locations", location);
              addedLocations.push(added);
              // Add delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
              console.error("Error adding location:", location.name, err);
            }
          }
        }
      }

      return { searchResult, addedLocations, center };
    },
    onSuccess: async (data) => {
      console.log("✅ Search completed. Added locations:", data.addedLocations.length);
      setActiveSearchType(null); // Clear active search type
      // Reset to page 1 to show new locations
      setLocationsPage(1);
      // Small delay to ensure backend has processed all locations
      await new Promise(resolve => setTimeout(resolve, 500));
      // Invalidate and refetch locations to show them in the list
      await queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      await queryClient.refetchQueries({ queryKey: ["/api/locations"] });
      // Also manually refetch to ensure data is updated
      const refetchResult = await refetchLocations();
      console.log("🔄 Refetched locations:", refetchResult.data?.length || 0, "locations");
      toast({
        title: "Locations Found!",
        description: `Found and added ${data.addedLocations.length} nearby recruiting locations.`,
      });
    },
    onError: (error: Error) => {
      setActiveSearchType(null); // Clear active search type on error
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const searchNearbyEventsMutation = useMutation({
    mutationFn: async (useZip: boolean) => {
      let latitude: number;
      let longitude: number;
      let useZipCode = false;
      let center: LatLngTuple | null = null;

      if (useZip) {
        if (!zipCode || zipCode.length !== 5) {
          throw new Error("Please enter a valid 5-digit zip code");
        }
        // Geocode zip code to get coordinates via backend API
        try {
          const coords = await geocodeZipCode(zipCode);
          if (!coords) {
            throw new Error("Could not find coordinates for that zip code. Please check the zip code and try again.");
          }
          latitude = coords[0];
          longitude = coords[1];
          center = coords;
          useZipCode = true;
          setZipCodeCoords(coords);
        } catch (error: any) {
          // Re-throw with a more user-friendly message
          throw new Error(error?.message || "Could not find coordinates for that zip code. Please check the zip code and try again.");
        }
      } else {
        if (!userLocation) {
          throw new Error("Location not available. Please enable location access.");
        }
        latitude = userLocation[0];
        longitude = userLocation[1];
        center = userLocation;
        useZipCode = false;
      }

      const searchResult = await apiRequest(
        "POST",
        "/api/places/search-events",
        {
          latitude,
          longitude,
          useZipCode,
          zipCode: useZip ? zipCode : undefined, // Pass zip code for filtering
        }
      );

      // Set search center and radius for map display
      setSearchCenter(center);
      setSearchRadius(useZipCode ? 8047 : 8047); // ~5 miles (8047m) for both zip and current location

      // Clear old events before adding new ones (only if this is a new search)
      try {
        const existingEvents = await apiRequest("GET", "/api/events");
        if (Array.isArray(existingEvents) && existingEvents.length > 0) {
          // Delete all existing events
          for (const evt of existingEvents) {
            try {
              await apiRequest("DELETE", `/api/events/${evt.id}`);
            } catch (err) {
              // Ignore errors for individual deletes
              console.warn("Could not delete event:", evt.id);
            }
          }
          console.log(`🗑️ Cleared ${existingEvents.length} old events`);
        }
      } catch (error) {
        console.warn("Could not clear old events:", error);
        // Continue anyway
      }

      // Add all found events to the database with delays to avoid rate limiting
      const events = searchResult.events || [];
      const addedEvents = [];

      for (const event of events) {
        try {
          const added = await apiRequest("POST", "/api/events", event);
          addedEvents.push(added);
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error("Error adding event:", error);
          // Continue with next event even if one fails
        }
      }

      return { searchResult, addedEvents, center };
    },
    onSuccess: async (data) => {
      setActiveSearchType(null); // Clear active search type
      // Reset to page 1 to show new events
      setEventsPage(1);
      // Invalidate and refetch events to show them in the list
      await queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      await queryClient.refetchQueries({ queryKey: ["/api/events"] });
      // Also manually refetch to ensure data is updated
      await refetchEvents();
      if (data.addedEvents.length > 0) {
        toast({
          title: "Events Found!",
          description: `Found and added ${data.addedEvents.length} upcoming recruiting events.`,
        });
      } else {
        // Use the message from the API response, which tells us if API key is configured
        const message = data.searchResult?.message || "No events found. Try expanding your search radius or searching in a different location.";
        toast({
          title: "No Events Found",
          description: message,
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      setActiveSearchType(null); // Clear active search type on error
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get user's current location only when requested (not automatically)
  const requestCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: LatLngTuple = [latitude, longitude];
          setUserLocation(newLocation);
          setLocationError("");
          setSearchMode("current");
          // Center map on user's current location
          setSearchCenter(newLocation);
          setSearchRadius(null); // Clear radius until a search is performed
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Could not get your location. Please try using zip code search.");
          toast({
            title: "Location Error",
            description: "Could not get your location. Please try using zip code search.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationError("Geolocation not supported by your browser.");
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services. Please use zip code search.",
        variant: "destructive",
      });
    }
  };

  // Set default map center (US center) but don't get location automatically
  useEffect(() => {
    if (!userLocation) {
      setUserLocation([39.8283, -98.5795]); // US center as default view
    }
  }, []);

  // Filter locations
  const filteredLocations = useMemo(() => {
    if (!Array.isArray(locations) || locations.length === 0) {
      console.log("📍 No locations to filter");
      return [];
    }
    
    const filtered = locations.filter((location) => {
      const matchesSearch =
        searchQuery === "" ||
        location.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || location.type === typeFilter;

      return matchesSearch && matchesType;
    });
    
    console.log(`🔍 Filtered ${locations.length} locations to ${filtered.length} (query: "${searchQuery}", type: "${typeFilter}")`);
    return filtered;
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

  // Paginate locations
  const paginatedLocations = useMemo(() => {
    const startIndex = (locationsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLocations.slice(startIndex, endIndex);
  }, [filteredLocations, locationsPage]);

  // Paginate events
  const paginatedEvents = useMemo(() => {
    const startIndex = (eventsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, eventsPage]);

  // Calculate total pages
  const locationsTotalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const eventsTotalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setLocationsPage(1);
  }, [searchQuery, typeFilter, filteredLocations.length]);

  useEffect(() => {
    setEventsPage(1);
  }, [searchQuery, filteredEvents.length]);

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

  // Use search center if available, otherwise user location, otherwise default
  const mapCenter: LatLngTuple = searchCenter || userLocation || [39.8283, -98.5795]; // Search center, user location, or US center as fallback


  return (
    <div className="bg-army-green w-full">
      {/* Content container */}
      <div className="flex flex-col w-full">
        {/* Page Header - Compact on Desktop */}
        <div className="bg-army-black border-b border-army-field01 px-3 md:px-4 py-1.5 md:py-2 shadow-lg">
          <div className="max-w-full">
            {/* Desktop: Single row layout, Mobile: Stacked */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2 md:mb-1.5">
              {/* Title Section - Compact on Desktop */}
              <div className="flex-1 min-w-0 md:flex-none md:min-w-[200px]">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 md:w-5 md:h-5 drop-shadow-lg flex-shrink-0" />
                  <h1 className="text-lg md:text-xl font-bold text-army-gold tracking-wide">
                    🗺️ PROSPECTING MAP
                  </h1>
                </div>
                <p className="text-army-tan/80 mt-0.5 font-medium text-[10px] md:text-xs hidden md:block">
                  Discover prime locations and events
                </p>
              </div>

              {/* Zip Code Input - Compact */}
              <div className="w-full sm:w-auto sm:min-w-[120px] md:min-w-[130px] flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Label htmlFor="zipCode" className="text-[10px] md:text-xs text-army-tan whitespace-nowrap md:hidden">
                    ZIP:
                  </Label>
                  <div className="relative flex-1">
                    <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-army-tan" />
                    <Input
                      id="zipCode"
                      type="text"
                      maxLength={5}
                      placeholder="12345"
                      value={zipCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setZipCode(value);
                      }}
                      className="pl-7 h-7 md:h-8 text-xs bg-army-field01/50 border-army-field01 text-army-gold placeholder:text-army-tan/50"
                    />
                  </div>
                  {zipCode.length === 5 && zipCode !== recruiterZipCode && (
                    <Button
                      onClick={() => updateZipCodeMutation.mutate(zipCode)}
                      disabled={updateZipCodeMutation.isPending}
                      size="sm"
                      className="h-7 md:h-8 px-2 text-xs bg-army-field01 hover:bg-army-field01/80 text-army-gold"
                      title="Save zip code"
                    >
                      {updateZipCodeMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "💾"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Search Buttons - Compact on Desktop */}
              <div className="flex flex-wrap gap-1.5 md:gap-1.5 w-full md:w-auto">
                <Button
                  onClick={() => {
                    setSearchMode("current");
                    requestCurrentLocation();
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 md:h-8 border-army-gold text-army-gold hover:bg-army-gold hover:text-army-black text-[11px] md:text-xs flex-1 sm:flex-none min-w-[120px] md:min-w-[110px]"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Use My Location
                </Button>
                <Button
                  onClick={() => {
                    if (!userLocation) {
                      toast({
                        title: "Location Required",
                        description: "Please click 'Use My Location' first",
                        variant: "destructive",
                      });
                      return;
                    }
                    setSearchMode("current");
                    setActiveSearchType("locations-current");
                    searchNearbyMutation.mutate(false);
                  }}
                  disabled={!userLocation || (activeSearchType !== null && activeSearchType !== "locations-current")}
                  className="bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold h-7 md:h-8 text-[11px] md:text-xs flex-1 sm:flex-none min-w-[120px] md:min-w-[110px]"
                >
                  {searchNearbyMutation.isPending && activeSearchType === "locations-current" ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Radar className="w-3 h-3 mr-1" />
                      Find Locations Near Me
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (!userLocation) {
                      toast({
                        title: "Location Required",
                        description: "Please click 'Use My Location' first",
                        variant: "destructive",
                      });
                      return;
                    }
                    setSearchMode("current");
                    setActiveSearchType("events-current");
                    searchNearbyEventsMutation.mutate(false);
                  }}
                  disabled={!userLocation || (activeSearchType !== null && activeSearchType !== "events-current")}
                  className="bg-army-green text-army-gold hover:bg-army-green/80 border-2 border-army-gold font-semibold h-7 md:h-8 text-[11px] md:text-xs flex-1 sm:flex-none min-w-[120px] md:min-w-[110px]"
                >
                  {searchNearbyEventsMutation.isPending && activeSearchType === "events-current" ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3 mr-1" />
                      Find Events Near Me
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (!zipCode || zipCode.length !== 5) {
                      toast({
                        title: "Zip Code Required",
                        description: "Please enter a valid 5-digit zip code",
                        variant: "destructive",
                      });
                      return;
                    }
                    setSearchMode("zip");
                    setActiveSearchType("locations-zip");
                    searchNearbyMutation.mutate(true);
                  }}
                  disabled={zipCode.length !== 5 || (activeSearchType !== null && activeSearchType !== "locations-zip")}
                  className="bg-army-gold text-army-black hover:bg-army-gold/90 font-semibold h-7 md:h-8 text-[11px] md:text-xs flex-1 sm:flex-none min-w-[120px] md:min-w-[110px]"
                >
                  {searchNearbyMutation.isPending && activeSearchType === "locations-zip" ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Radar className="w-3 h-3 mr-1" />
                      Find Locations by Zip Code
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (!zipCode || zipCode.length !== 5) {
                      toast({
                        title: "Zip Code Required",
                        description: "Please enter a valid 5-digit zip code",
                        variant: "destructive",
                      });
                      return;
                    }
                    setSearchMode("zip");
                    setActiveSearchType("events-zip");
                    searchNearbyEventsMutation.mutate(true);
                  }}
                  disabled={zipCode.length !== 5 || (activeSearchType !== null && activeSearchType !== "events-zip")}
                  className="bg-army-green text-army-gold hover:bg-army-green/80 border-2 border-army-gold font-semibold h-7 md:h-8 text-[11px] md:text-xs flex-1 sm:flex-none min-w-[120px] md:min-w-[110px]"
                >
                  {searchNearbyEventsMutation.isPending && activeSearchType === "events-zip" ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3 mr-1" />
                      Find Events by Zip Code
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search and Filters - Compact */}
            <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Search locations or events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 text-xs h-7 md:h-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[120px] md:w-[130px] h-7 md:h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
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
              <div className="flex gap-1.5">
                <Button
                  variant={showLocations ? "default" : "outline"}
                  onClick={() => setShowLocations(!showLocations)}
                  size="sm"
                  className={`h-7 md:h-8 text-[11px] md:text-xs ${
                    showLocations
                      ? "bg-army-field01 text-army-gold hover:bg-army-field01/90"
                      : "border-army-field01 text-army-tan hover:bg-army-field01/20 hover:text-army-gold"
                  }`}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Locations ({locations.length})
                </Button>
                <Button
                  variant={showEvents ? "default" : "outline"}
                  onClick={() => setShowEvents(!showEvents)}
                  size="sm"
                  className={`h-7 md:h-8 text-[11px] md:text-xs ${
                    showEvents
                      ? "bg-army-field01 text-army-gold hover:bg-army-field01/90"
                      : "border-army-field01 text-army-tan hover:bg-army-field01/20 hover:text-army-gold"
                  }`}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Events ({events.length})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Map and List Layout - Mobile: Stack vertically and scroll, Desktop: Side-by-side with fixed height */}
        {/* Account for header (~180px), footer (~140px), and some padding */}
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-320px)]">
          {/* Map Container - Mobile: Fixed height, Desktop: Fill available space */}
          <div className="relative h-[60vh] md:h-full md:flex-1 md:min-w-0">
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
                searchCenter={searchCenter}
                searchRadius={searchRadius || undefined}
              />

              {/* Search Radius Circle - Shows area of responsibility */}
              {searchCenter && searchRadius && (
                <Circle
                  center={searchCenter}
                  radius={searchRadius}
                  pathOptions={{
                    color: '#f87171', // Light red border
                    fillColor: '#fca5a5', // Light red fill
                    fillOpacity: 0.2, // Light red highlight
                    weight: 2,
                  }}
                />
              )}

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
          <div className="w-full md:w-[450px] lg:w-[500px] border-t md:border-t-0 md:border-l bg-card md:h-full flex flex-col shadow-lg">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "locations" | "events")}
              className="flex flex-col flex-1 min-h-0"
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

              {/* TabsContent wrapper to ensure proper flex expansion */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
              <TabsContent
                value="locations"
                className="mt-0 flex-1 min-h-0 flex flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden absolute inset-0"
              >
                <div className="flex-1 overflow-y-auto min-h-0 p-2 md:p-4 space-y-2 md:space-y-3">
                {locationsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading locations...
                  </div>
                ) : locationsError ? (
                  <div className="text-center py-8 text-destructive">
                    Error loading locations: {locationsError instanceof Error ? locationsError.message : "Unknown error"}
                  </div>
                ) : paginatedLocations.length === 0 && filteredLocations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations found. Try searching for nearby locations.
                  </div>
                ) : paginatedLocations.length === 0 && filteredLocations.length > 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations on this page. Try adjusting filters or pagination.
                  </div>
                ) : (
                  paginatedLocations.map((location) => (
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
                  ))
                )}
                </div>
                
                {/* Pagination for Locations */}
                {filteredLocations.length > 0 && (
                  <div className="border-t pt-2 px-2 md:px-4 shrink-0">
                    <Pagination>
                      <PaginationContent className="flex items-center justify-center gap-2">
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (locationsPage > 1) {
                                setLocationsPage(locationsPage - 1);
                              }
                            }}
                            disabled={locationsPage === 1 || locationsTotalPages <= 1}
                            className="gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-sm text-muted-foreground px-2 whitespace-nowrap">
                            Page {locationsPage} of {locationsTotalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (locationsPage < locationsTotalPages) {
                                setLocationsPage(locationsPage + 1);
                              }
                            }}
                            disabled={locationsPage >= locationsTotalPages || locationsTotalPages <= 1}
                            className="gap-1"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="events"
                className="mt-0 flex-1 min-h-0 flex flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden absolute inset-0"
              >
                <div className="flex-1 overflow-y-auto min-h-0 p-2 md:p-4 space-y-2 md:space-y-3">
                {paginatedEvents.map((event) => (
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
                </div>
                
                {/* Pagination for Events */}
                {filteredEvents.length > 0 && (
                  <div className="border-t pt-2 px-2 md:px-4 shrink-0">
                    <Pagination>
                      <PaginationContent className="flex items-center justify-center gap-2">
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (eventsPage > 1) {
                                setEventsPage(eventsPage - 1);
                              }
                            }}
                            disabled={eventsPage === 1 || eventsTotalPages <= 1}
                            className="gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-sm text-muted-foreground px-2 whitespace-nowrap">
                            Page {eventsPage} of {eventsTotalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (eventsPage < eventsTotalPages) {
                                setEventsPage(eventsPage + 1);
                              }
                            }}
                            disabled={eventsPage >= eventsTotalPages || eventsTotalPages <= 1}
                            className="gap-1"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </TabsContent>
              </div>
            </Tabs>
          </div>
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
        zipCode={zipCode || undefined}
      />
    </div>
  );
}

export default function ProspectingMapPage() {
  return (
    <ProtectedRoute>
      <ProspectingMap />
    </ProtectedRoute>
  );
}
