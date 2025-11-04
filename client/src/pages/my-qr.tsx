import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { auth } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Download, Share2, Copy, CheckCircle2 } from "lucide-react";

function MyQRCodeContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const qrUrl = `${window.location.origin}/apply?r=${user?.qrCode}`;

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      const { qrCode } = await auth.getQRCode();
      setQrCodeImage(qrCode);
    } catch (err) {
      setError("Failed to load QR code");
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

  const copyLink = () => {
    navigator.clipboard.writeText(qrUrl);
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
      copyLink();
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Your Recruiter QR Code</CardTitle>
              <CardDescription>
                Applicants scan this to be linked to you
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? (
                <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Loading QR Code...</p>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border-4 border-green-700">
                  <img
                    src={qrCodeImage}
                    alt="Recruiter QR Code"
                    className="w-64 h-64"
                  />
                </div>
              )}

              <div className="mt-6 w-full space-y-3">
                <Button
                  onClick={downloadQRCode}
                  className="w-full bg-green-700 hover:bg-green-800"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>

                <Button
                  onClick={shareQRCode}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Download or Share</h3>
                    <p className="text-sm text-gray-600">
                      Download the QR code image or share the link directly
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Display Your QR Code</h3>
                    <p className="text-sm text-gray-600">
                      Add to business cards, flyers, or show on your phone
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Track Applications</h3>
                    <p className="text-sm text-gray-600">
                      All scanned applications appear in your dashboard
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direct Link</CardTitle>
                <CardDescription>
                  Share this link via email or text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
                  />
                  <Button
                    onClick={copyLink}
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

