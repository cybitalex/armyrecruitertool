import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { auth, locationQRCodes } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ArrowLeft, Download, Share2, Copy, CheckCircle2, Plus, MapPin, Trash2, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

type LocationQRCode = {
  id: string;
  locationLabel: string;
  qrCode: string;
  qrType: string;
  createdAt: Date;
  updatedAt: Date;
};

function MyQRCodeContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [surveyQrCodeImage, setSurveyQrCodeImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Location QR codes state
  const [locationQRCodesList, setLocationQRCodesList] = useState<LocationQRCode[]>([]);
  const [locationQRImages, setLocationQRImages] = useState<Record<string, string>>({});
  const [loadingLocationQRs, setLoadingLocationQRs] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLocationLabel, setNewLocationLabel] = useState("");
  const [newQRType, setNewQRType] = useState<"application" | "survey">("application");
  const [creating, setCreating] = useState(false);

  const qrUrl = `${window.location.origin}/apply?r=${user?.qrCode}`;
  const surveyUrl = `${window.location.origin}/survey?r=${user?.qrCode}`;

  useEffect(() => {
    loadQRCodes();
    loadLocationQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      const [{ qrCode }, survey] = await Promise.all([
        auth.getQRCode(),
        auth.getSurveyQRCode(),
      ]);
      setQrCodeImage(qrCode);
      setSurveyQrCodeImage(survey.qrCode);
    } catch (err) {
      setError("Failed to load QR codes");
    } finally {
      setLoading(false);
    }
  };

  const loadLocationQRCodes = async () => {
    try {
      setLoadingLocationQRs(true);
      const locationQRs = await locationQRCodes.list();
      setLocationQRCodesList(locationQRs);
      
      // Load images for each location QR code
      const imagePromises = locationQRs.map(async (qr) => {
        try {
          const { qrCode: image } = await locationQRCodes.getImage(qr.id);
          return { id: qr.id, image };
        } catch {
          return { id: qr.id, image: null };
        }
      });
      
      const images = await Promise.all(imagePromises);
      const imageMap: Record<string, string> = {};
      images.forEach(({ id, image }) => {
        if (image) imageMap[id] = image;
      });
      setLocationQRImages(imageMap);
    } catch (err) {
      console.error("Failed to load location QR codes:", err);
    } finally {
      setLoadingLocationQRs(false);
    }
  };

  const createLocationQRCode = async () => {
    if (!newLocationLabel.trim()) {
      toast({
        title: "Location label required",
        description: "Please enter a location label for this QR code",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const newQR = await locationQRCodes.create({
        locationLabel: newLocationLabel.trim(),
        qrType: newQRType,
      });
      
      setLocationQRCodesList([newQR, ...locationQRCodesList]);
      setLocationQRImages({ ...locationQRImages, [newQR.id]: newQR.qrCodeImage });
      setNewLocationLabel("");
      setNewQRType("application");
      setShowCreateDialog(false);
      
      toast({
        title: "Location QR code created",
        description: `QR code for "${newQR.locationLabel}" has been generated`,
      });
    } catch (err) {
      toast({
        title: "Failed to create QR code",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteLocationQRCode = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete the QR code for "${label}"?`)) {
      return;
    }

    try {
      await locationQRCodes.delete(id);
      setLocationQRCodesList(locationQRCodesList.filter((qr) => qr.id !== id));
      const newImages = { ...locationQRImages };
      delete newImages[id];
      setLocationQRImages(newImages);
      
      toast({
        title: "QR code deleted",
        description: `QR code for "${label}" has been removed`,
      });
    } catch (err) {
      toast({
        title: "Failed to delete QR code",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `army-recruiter-qr-${user?.fullName?.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Army Recruiter Application",
          text: "Scan this QR code or visit the link to apply:",
          url: qrUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      copyLink(qrUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-green-800">My QR Code</h1>
              <p className="text-sm text-gray-600">
                Share your unique recruiter QR code
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Application QR Code */}
          <Card>
            <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">Application QR Code</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Applicants scan this to start the full interest/application form
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center px-4 sm:px-6 pb-4 sm:pb-6">
              {loading ? (
                <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Loading QR Code...</p>
                </div>
              ) : (
                <div className="bg-white p-3 sm:p-4 rounded-lg border-2 sm:border-4 border-green-700">
                  <img
                    src={qrCodeImage}
                    alt="Recruiter QR Code"
                    className="w-48 h-48 sm:w-64 sm:h-64"
                  />
                </div>
              )}

              <div className="mt-4 sm:mt-6 w-full space-y-2 sm:space-y-3">
                <Button
                  onClick={downloadQRCode}
                  className="w-full bg-green-700 hover:bg-green-800 text-sm sm:text-base"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Application QR
                </Button>

                <Button
                  onClick={shareQRCode}
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                  disabled={loading}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Application QR
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Presentation Survey QR Code */}
          <Card>
            <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl">Presentation Survey QR</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Use this in briefings to capture quick ratings and contact info
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center px-4 sm:px-6 pb-4 sm:pb-6">
              {loading ? (
                <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Loading QR Code...</p>
                </div>
              ) : (
                <div className="bg-white p-3 sm:p-4 rounded-lg border-2 sm:border-4 border-green-700">
                  <img
                    src={surveyQrCodeImage}
                    alt="Presentation Survey QR Code"
                    className="w-48 h-48 sm:w-64 sm:h-64"
                  />
                </div>
              )}

              <div className="mt-4 sm:mt-6 w-full space-y-2 sm:space-y-3">
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = surveyQrCodeImage;
                    link.download = `army-recruiter-survey-qr-${user?.fullName
                      ?.replace(/\s+/g, "-")
                      .toLowerCase()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full bg-green-700 hover:bg-green-800 text-sm sm:text-base"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Survey QR
                </Button>

                <Button
                  onClick={() => copyLink(surveyUrl)}
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                  disabled={loading}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Survey Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="space-y-4 sm:space-y-6 md:col-span-2">
            <Card>
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-base sm:text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm sm:text-base">Download or Share</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Download the QR code image or share the link directly
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm sm:text-base">Display Your QR Code</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Add to business cards, flyers, or show on your phone
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm sm:text-base">Track Applications</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      All scanned applications appear in your dashboard
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direct Links</CardTitle>
                <CardDescription>
                  Share these links via email, text, or chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Application Form
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qrUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
                      />
                      <Button
                        onClick={() => copyLink(qrUrl)}
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Presentation Survey
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={surveyUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
                      />
                      <Button
                        onClick={() => copyLink(surveyUrl)}
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Print QR codes on business cards</li>
                  <li>• Display at recruiting events</li>
                  <li>• Add to email signatures</li>
                  <li>• Share on social media</li>
                  <li>• Keep QR code visible on your phone</li>
                </ul>
              </CardContent>
            </Card>

            <div className="text-xs text-gray-500 p-4 bg-white rounded border">
              <strong>UNCLASSIFIED</strong> - This QR code is unique to you. All 
              applications scanned with this code will be automatically linked to 
              your recruiter account.
            </div>
          </div>

          {/* Location-Based QR Codes Section */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Location-Based QR Codes</CardTitle>
                    <CardDescription>
                      Generate QR codes with custom location labels to track where scans occur
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Location QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Location QR Code</DialogTitle>
                        <DialogDescription>
                          Generate a new QR code with a location label. This helps track where your QR codes are being scanned.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="locationLabel">Location Label *</Label>
                          <Input
                            id="locationLabel"
                            placeholder="e.g., High School Career Fair, Mall Kiosk, Community Event"
                            value={newLocationLabel}
                            onChange={(e) => setNewLocationLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newLocationLabel.trim()) {
                                createLocationQRCode();
                              }
                            }}
                          />
                          <p className="text-xs text-gray-500">
                            Enter a descriptive label for where this QR code will be used
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qrType">QR Code Type *</Label>
                          <Select value={newQRType} onValueChange={(v) => setNewQRType(v as "application" | "survey")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="application">Application Form</SelectItem>
                              <SelectItem value="survey">Survey Form</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCreateDialog(false);
                              setNewLocationLabel("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={createLocationQRCode} disabled={creating || !newLocationLabel.trim()}>
                            {creating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Create QR Code
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLocationQRs ? (
                  <div className="text-center py-8 text-gray-500">Loading location QR codes...</div>
                ) : locationQRCodesList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium mb-2">No location QR codes yet</p>
                    <p className="text-sm">Create your first location QR code to track where scans occur</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locationQRCodesList.map((locationQR) => {
                      const qrImage = locationQRImages[locationQR.id];
                      const qrUrl = `${window.location.origin}/${locationQR.qrType === 'application' ? 'apply' : 'survey'}?r=${locationQR.qrCode}`;
                      
                      return (
                        <Card key={locationQR.id} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm font-semibold truncate">
                                  {locationQR.locationLabel}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {locationQR.qrType === 'application' ? 'Application' : 'Survey'} QR Code
                                </CardDescription>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteLocationQRCode(locationQR.id, locationQR.locationLabel)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {qrImage ? (
                              <div className="bg-white p-2 rounded-lg border-2 border-green-700 mb-3 flex justify-center">
                                <img
                                  src={qrImage}
                                  alt={`QR Code for ${locationQR.locationLabel}`}
                                  className="w-32 h-32"
                                />
                              </div>
                            ) : (
                              <div className="w-32 h-32 bg-gray-100 rounded-lg mb-3 mx-auto flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                              </div>
                            )}
                            <div className="space-y-2">
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  if (qrImage) {
                                    const link = document.createElement("a");
                                    link.href = qrImage;
                                    link.download = `location-qr-${locationQR.locationLabel.replace(/\s+/g, "-")}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                                disabled={!qrImage}
                              >
                                <Download className="w-3 h-3 mr-2" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  navigator.clipboard.writeText(qrUrl);
                                  toast({
                                    title: "Link copied",
                                    description: "QR code link copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="w-3 h-3 mr-2" />
                                Copy Link
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MyQRCode() {
  return (
    <ProtectedRoute>
      <MyQRCodeContent />
    </ProtectedRoute>
  );
}

