import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { auth } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ArrowLeft, Download, Share2, Copy, CheckCircle2 } from "lucide-react";

function MyQRCodeContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [surveyQrCodeImage, setSurveyQrCodeImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const qrUrl = `${window.location.origin}/apply?r=${user?.qrCode}`;
  const surveyUrl = `${window.location.origin}/survey?r=${user?.qrCode}`;

  useEffect(() => {
    loadQRCodes();
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

