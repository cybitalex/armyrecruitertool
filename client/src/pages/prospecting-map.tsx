import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngBounds, LatLngTuple } from "leaflet";
import type { Location, Event } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showLocations, setShowLocations] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [activeTab, setActiveTab] = useState<"locations" | "events">(
    "locations"
  );
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const { toast } = useToast();

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
    <div className="min-h-screen bg-army-green">
      {/* Desktop: Fixed height container, Mobile: Allow scrolling */}
      <div className="flex flex-col md:h-screen">
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
                      📍 {userLocation[0].toFixed(2)}°, {userLocation[1].toFixed(2)}°
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
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{location.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {location.type}
                        </p>
                        <p className="text-sm mt-1">{location.address}</p>
                        <div className="mt-2">
                          <Badge
                            variant={getScoreBadgeColor(
                              location.prospectingScore
                            )}
                          >
                            Score: {location.prospectingScore}
                          </Badge>
                        </div>
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
                        <p className="text-sm text-muted-foreground">
                          {event.type}
                        </p>
                        <p className="text-sm mt-1">{event.address}</p>
                        <p className="text-sm mt-1">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <Badge>{event.status}</Badge>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          {/* Results List - Mobile: Scrollable below map, Desktop: Fixed sidebar with scroll */}
          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l bg-card">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "locations" | "events")}
              className="flex flex-col h-full"
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
                className="p-2 md:p-4 space-y-2 md:space-y-3 mt-0 overflow-y-auto flex-1"
              >
                {filteredLocations.map((location) => (
                  <Card
                    key={location.id}
                    className={`p-3 md:p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedLocation?.id === location.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedLocation(location)}
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
                className="p-2 md:p-4 space-y-2 md:space-y-3 mt-0 overflow-y-auto flex-1"
              >
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className={`p-3 md:p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedEvent?.id === event.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 mt-1 text-primary" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm md:text-base">
                          {event.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground capitalize">
                          {event.type.replace(/_/g, " ")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge>{event.status}</Badge>
                          {event.targetAudience && (
                            <Badge variant="outline" className="capitalize">
                              {event.targetAudience.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          <p>
                            {new Date(event.eventDate).toLocaleDateString()}
                          </p>
                          {event.eventTime && <p>{event.eventTime}</p>}
                          <p className="mt-1">
                            {event.city}, {event.state}
                          </p>
                        </div>
                        {event.expectedAttendance && (
                          <p className="text-xs text-muted-foreground mt-2">
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
                        {event.contactName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Contact: {event.contactName}
                          </p>
                        )}
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
      </div>
    </div>
  );
}
