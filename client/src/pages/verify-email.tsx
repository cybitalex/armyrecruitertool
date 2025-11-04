import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    
    if (!urlToken) {
      setError("Invalid or missing verification token");
      setLoading(false);
      return;
    }

    setToken(urlToken);

    // Call the API endpoint to verify
    const verifyEmail = async () => {
      try {
        // The backend endpoint is /api/auth/verify-email
        const response = await fetch(`/api/auth/verify-email?token=${urlToken}`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          // Backend redirects to /login?verified=true, but if we're here as SPA,
          // we handle it client-side
          setSuccess(true);
          setTimeout(() => {
            setLocation("/login?verified=true");
          }, 2000);
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.error || "Verification failed. The link may have expired.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify email");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-green-700 mx-auto animate-spin" />
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Email Verified! 🎖️</CardTitle>
            <CardDescription>
              Your email has been successfully verified. You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to login page...
            </p>
            <Button
              onClick={() => setLocation("/login?verified=true")}
              className="mt-4 bg-green-700 hover:bg-green-800"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Common reasons:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>The verification link has expired</li>
              <li>The link has already been used</li>
              <li>The token is invalid</li>
            </ul>
          </div>
          <Button
            onClick={() => setLocation("/register")}
            variant="outline"
            className="w-full"
          >
            Register Again
          </Button>
          <Button
            onClick={() => setLocation("/login")}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

