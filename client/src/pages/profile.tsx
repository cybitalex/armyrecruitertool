import { useState, useEffect, useRef } from "react";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, AlertCircle, Upload, User as UserIcon, Shield, Clock, MapPin } from "lucide-react";
import { ARMY_RANKS } from "@shared/constants";
import { Textarea } from "../components/ui/textarea";
import type { Station } from "@shared/schema";
import { SearchableSelect } from "../components/ui/searchable-select";

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    rank: "",
    unit: "",
    phoneNumber: "",
    profilePicture: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  // Station Commander Request state
  const [scRequestStatus, setScRequestStatus] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [justification, setJustification] = useState("");
  const [scLoading, setScLoading] = useState(false);
  const [scError, setScError] = useState("");
  const [scSuccess, setScSuccess] = useState(false);

  // Station Change Request state
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [requestedStationId, setRequestedStationId] = useState("");
  const [stationChangeReason, setStationChangeReason] = useState("");
  const [stationChangeLoading, setStationChangeLoading] = useState(false);
  const [stationChangeError, setStationChangeError] = useState("");
  const [stationChangeSuccess, setStationChangeSuccess] = useState(false);
  const [pendingStationChangeRequest, setPendingStationChangeRequest] = useState<any>(null);
  
  // Admin direct station change state
  const [adminNewStationId, setAdminNewStationId] = useState("");
  const [adminStationChangeLoading, setAdminStationChangeLoading] = useState(false);
  const [adminStationChangeError, setAdminStationChangeError] = useState("");
  const [adminStationChangeSuccess, setAdminStationChangeSuccess] = useState(false);

  // Load stations
  useEffect(() => {
    const loadStations = async () => {
      try {
        const response = await fetch("/api/stations");
        if (response.ok) {
          const data = await response.json();
          setStations(data);
          console.log(`✅ Loaded ${data.length} stations`);
        } else {
          console.error("Failed to load stations:", response.status);
        }
      } catch (err) {
        console.error("Failed to load stations:", err);
      }
    };
    loadStations();
  }, []);

  // Load user data when available
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        rank: user.rank || "",
        unit: user.unit || "",
        phoneNumber: user.phoneNumber || "",
        profilePicture: user.profilePicture || "",
      });
      if (user.profilePicture) {
        setImagePreview(user.profilePicture);
      }
      
      // Check station commander status
      if (user.role === 'station_commander' || user.role === 'admin') {
        setScRequestStatus('approved');
      } else if (user.role === 'pending_station_commander') {
        setScRequestStatus('pending');
      } else {
        // Check if there's a pending request
        checkStationCommanderRequest();
      }

      // Load current station
      if (user.stationId) {
        loadCurrentStation(user.stationId);
      }

      // Check for pending station change request
      checkPendingStationChangeRequest();
    }
  }, [user]);

  const loadCurrentStation = async (stationId: string) => {
    try {
      const response = await fetch(`/api/stations/${stationId}`);
      if (response.ok) {
        const station = await response.json();
        setCurrentStation(station);
        console.log(`✅ Loaded current station:`, station);
      } else {
        console.error("Failed to load current station:", response.status);
      }
    } catch (err) {
      console.error("Failed to load current station:", err);
    }
  };

  const checkPendingStationChangeRequest = async () => {
    try {
      const response = await fetch("/api/station-change-requests/my-request", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.request && data.request.status === 'pending') {
          setPendingStationChangeRequest(data.request);
        }
      }
    } catch (err) {
      // No pending request
    }
  };
  
  const checkStationCommanderRequest = async () => {
    try {
      const response = await fetch("/api/station-commander/my-request", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.request) {
          setScRequestStatus(data.request.status);
        }
      }
    } catch (err) {
      // If no request, status remains 'none'
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setFormData((prev) => ({ ...prev, profilePicture: base64String }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess(true);
      await refreshUser(); // Refresh user data in context
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleStationCommanderRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setScError("");
    setScSuccess(false);
    
    if (!justification.trim()) {
      setScError("Please provide a justification for your request");
      return;
    }
    
    setScLoading(true);
    
    try {
      const response = await fetch("/api/station-commander/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ justification }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit request");
      }
      
      setScSuccess(true);
      setScRequestStatus('pending');
      setJustification("");
      await refreshUser(); // Refresh user data
      
      // Clear success message after 5 seconds
      setTimeout(() => setScSuccess(false), 5000);
    } catch (err) {
      setScError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setScLoading(false);
    }
  };

  const handleStationChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStationChangeError("");
    setStationChangeSuccess(false);
    
    if (!requestedStationId) {
      setStationChangeError("Please select a station");
      return;
    }
    
    if (!stationChangeReason.trim()) {
      setStationChangeError("Please provide a reason for the station change");
      return;
    }
    
    setStationChangeLoading(true);
    
    try {
      const response = await fetch("/api/station-change-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          requestedStationId,
          reason: stationChangeReason 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit station change request");
      }
      
      setStationChangeSuccess(true);
      setRequestedStationId("");
      setStationChangeReason("");
      
      // Reload pending request
      await checkPendingStationChangeRequest();
      
      // Clear success message after 5 seconds
      setTimeout(() => setStationChangeSuccess(false), 5000);
    } catch (err) {
      setStationChangeError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setStationChangeLoading(false);
    }
  };

  // Admin direct station change (no approval needed)
  const handleAdminStationChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStationChangeError("");
    setAdminStationChangeSuccess(false);
    
    if (!adminNewStationId) {
      setAdminStationChangeError("Please select a station");
      return;
    }
    
    setAdminStationChangeLoading(true);
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          stationId: adminNewStationId
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change station");
      }
      
      setAdminStationChangeSuccess(true);
      setAdminNewStationId("");
      await refreshUser(); // Refresh user data
      
      // Reload current station
      if (user?.stationId) {
        await loadCurrentStation(adminNewStationId);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setAdminStationChangeSuccess(false), 3000);
    } catch (err) {
      setAdminStationChangeError(err instanceof Error ? err.message : "Failed to change station");
    } finally {
      setAdminStationChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-800">
              Edit Profile
            </CardTitle>
            <CardDescription>
              Update your recruiter profile information and photo
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Profile updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Profile Picture */}
              <div className="space-y-3">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-green-600"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                        <UserIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, PNG or GIF. Max 2MB. This photo will be shown on survey pages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                />
              </div>

              {/* Rank Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Select
                  value={formData.rank}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, rank: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your rank" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARMY_RANKS.map((rank) => (
                      <SelectItem key={rank.value} value={rank.value}>
                        {rank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g., 1st Battalion, 75th Ranger Regiment"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="555-123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                <strong>Note:</strong> Your profile picture and contact information will be displayed
                on survey feedback forms so respondents know who they're providing feedback to.
              </div>
            </CardContent>

            <div className="px-6 pb-6 flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-green-700 hover:bg-green-800"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Station Commander Request Card */}
        {user?.role !== 'admin' && user?.role !== 'station_commander' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="w-6 h-6 text-blue-600" />
                Request Station Commander Access
              </CardTitle>
              <CardDescription>
                Station Commanders can view all recruiters' statistics and export comprehensive reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scRequestStatus === 'pending' ? (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Request Pending</strong>
                    <p className="mt-1">
                      Your station commander access request is currently under review. 
                      You will receive an email notification once it has been processed.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : scRequestStatus === 'denied' ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your previous station commander request was denied. 
                    You can submit a new request with additional justification.
                  </AlertDescription>
                </Alert>
              ) : null}

              {scRequestStatus !== 'pending' && (
                <form onSubmit={handleStationCommanderRequest} className="space-y-4">
                  {scError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{scError}</AlertDescription>
                    </Alert>
                  )}

                  {scSuccess && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Request submitted successfully! An admin will review your request shortly.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="justification">
                      Justification for Station Commander Access *
                    </Label>
                    <Textarea
                      id="justification"
                      placeholder="Please explain why you need station commander access. For example: 'I am the station commander at [Station Name] and need to oversee [X] recruiters...'"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={5}
                      required
                      className="resize-none"
                    />
                    <p className="text-sm text-gray-600">
                      Provide details about your role and why you need access to view station-wide statistics.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                    <p className="font-semibold mb-2">What Station Commanders Can Do:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>View statistics for all recruiters at their station</li>
                      <li>See monthly and all-time performance metrics</li>
                      <li>Export comprehensive Excel reports</li>
                      <li>Track surveys, prospects, and leads</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={scLoading}
                  >
                    {scLoading ? "Submitting Request..." : "Submit Station Commander Request"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    An email will be sent to the administrator for approval. You will be notified via email
                    once your request has been reviewed.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Station Change Request Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="w-6 h-6 text-green-600" />
              Change Recruiting Station
            </CardTitle>
            <CardDescription>
              Request to transfer to a different recruiting station
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Station Display */}
            {currentStation ? (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700">Current Station:</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {currentStation.name}
                </p>
                <p className="text-sm text-gray-600">
                  Code: <span className="font-mono font-semibold">{currentStation.stationCode}</span>
                  {currentStation.city && currentStation.state && ` • ${currentStation.city}, ${currentStation.state}`}
                  {!currentStation.city && currentStation.state && ` • ${currentStation.state}`}
                </p>
              </div>
            ) : user?.stationId ? (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-sm text-gray-600 italic">Loading your current station...</p>
              </div>
            ) : (
              <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  You don't have a station assigned yet. Please contact an administrator.
                </AlertDescription>
              </Alert>
            )}

            {/* Pending Request Alert */}
            {pendingStationChangeRequest ? (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Station Change Request Pending</strong>
                  <p className="mt-1">
                    You have a pending request to transfer to{' '}
                    <strong>
                      {stations.find(s => s.id === pendingStationChangeRequest.requestedStationId)?.name || 'a different station'}
                    </strong>.
                    An administrator will review your request shortly.
                  </p>
                </AlertDescription>
              </Alert>
            ) : user?.role === 'admin' ? (
              <form onSubmit={handleAdminStationChange} className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Admin Privilege</strong>
                    <p className="mt-1">
                      As an administrator, you can change your station directly without submitting a request.
                    </p>
                  </AlertDescription>
                </Alert>

                {adminStationChangeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{adminStationChangeError}</AlertDescription>
                  </Alert>
                )}

                {adminStationChangeSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Station changed successfully! Your new station is now active.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="adminNewStation">Select New Station *</Label>
                  {stations.length > 0 ? (
                    <>
                      <SearchableSelect
                        options={stations
                          .filter((station) => station.id !== user?.stationId)
                          .map((station) => ({
                            value: station.id,
                            label: `${station.city || station.state}, ${station.state} (${station.stationCode})`,
                            searchText: `${station.city} ${station.state} ${station.stationCode} ${station.name}`,
                          }))}
                        value={adminNewStationId}
                        onValueChange={(value) => setAdminNewStationId(value)}
                        placeholder="Search for new station..."
                        searchPlaceholder="Type to search stations..."
                        emptyText="No stations found"
                      />
                      <p className="text-xs text-gray-600">
                        Your current station is excluded from the list
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500">
                        Loading stations...
                      </div>
                      <p className="text-xs text-gray-600">
                        Please wait while stations are loading
                      </p>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800"
                  disabled={adminStationChangeLoading || !adminNewStationId}
                >
                  {adminStationChangeLoading ? "Changing Station..." : "Change Station (Admin)"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleStationChangeRequest} className="space-y-4">
                {user?.role === 'station_commander' && (
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Important:</strong> As a Station Commander, if you transfer to a new station, 
                      you will be <strong>demoted to regular recruiter</strong>. You will need to request 
                      Station Commander access again at your new station after the transfer is approved.
                    </AlertDescription>
                  </Alert>
                )}

                {stationChangeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{stationChangeError}</AlertDescription>
                  </Alert>
                )}

                {stationChangeSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Station change request submitted successfully! An admin will review your request.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="requestedStation">Requested Station *</Label>
                  {stations.length > 0 ? (
                    <>
                      <SearchableSelect
                        options={stations
                          .filter((station) => station.id !== user?.stationId)
                          .map((station) => ({
                            value: station.id,
                            label: `${station.city || station.state}, ${station.state} (${station.stationCode})`,
                            searchText: `${station.city} ${station.state} ${station.stationCode} ${station.name}`,
                          }))}
                        value={requestedStationId}
                        onValueChange={(value) => setRequestedStationId(value)}
                        placeholder="Search for new station..."
                        searchPlaceholder="Type to search stations..."
                        emptyText="No stations found"
                      />
                      <p className="text-xs text-gray-600">
                        Your current station is excluded from the list
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500">
                        Loading stations...
                      </div>
                      <p className="text-xs text-gray-600">
                        Please wait while stations are loading
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stationChangeReason">
                    Reason for Station Change *
                  </Label>
                  <Textarea
                    id="stationChangeReason"
                    placeholder="Please explain why you need to transfer to a different station (e.g., 'Relocating due to PCS orders to...', 'Family circumstances require move to...')"
                    value={stationChangeReason}
                    onChange={(e) => setStationChangeReason(e.target.value)}
                    rows={4}
                    required
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-600">
                    Provide a clear reason for your transfer request to help expedite approval.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                  <p className="font-semibold mb-2">Important Information:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Station change requests require administrator approval
                    </li>
                    <li>
                      You will receive an email notification once your request has been reviewed
                    </li>
                    {user?.role === 'station_commander' && (
                      <li className="font-semibold text-orange-700">
                        Station Commanders will be demoted to recruiter upon transfer
                      </li>
                    )}
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800"
                  disabled={stationChangeLoading}
                >
                  {stationChangeLoading ? "Submitting Request..." : "Submit Station Change Request"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

