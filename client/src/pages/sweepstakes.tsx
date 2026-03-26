import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { recruiter as recruiterApi, sweepstakes } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, Gift, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";
import { ARMY_RANKS } from "@shared/constants";

export default function SweepstakesPage() {
  const [location] = useLocation();
  const [recruiterCode, setRecruiterCode] = useState<string | null>(null);
  const [recruiterInfo, setRecruiterInfo] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const scanTracked = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    setRecruiterCode(params.get("r"));
  }, [location]);

  useEffect(() => {
    if (!recruiterCode || scanTracked.current) return;
    scanTracked.current = true;

    fetch("/api/qr-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode: recruiterCode, scanType: "sweepstakes" }),
    }).catch(() => {});

    recruiterApi
      .getByQRCode(recruiterCode)
      .then((data) => setRecruiterInfo(data.recruiter))
      .catch(() => setRecruiterInfo(null));
  }, [recruiterCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!recruiterCode) throw new Error("Missing recruiter code");
      await sweepstakes.submit({
        recruiterCode,
        firstName: "Anonymous",
        lastName: "—",
        email: "",
        phone: "",
        interest: "",
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit entry");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Entry Submitted</CardTitle>
            <CardDescription>
              You are entered for a chance to win 3D glasses. A recruiter will follow up with you.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {recruiterInfo && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-4">
              {recruiterInfo.profilePicture ? (
                <img
                  src={recruiterInfo.profilePicture}
                  alt={recruiterInfo.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-700 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-green-700" />
                </div>
              )}
              <div>
                <p className="text-xs text-green-700">Connected recruiter</p>
                <p className="font-semibold text-green-900">
                  {recruiterInfo.rank
                    ? `${ARMY_RANKS.find((r) => r.value === recruiterInfo.rank)?.label || recruiterInfo.rank} `
                    : ""}
                  {recruiterInfo.fullName || "Recruiter"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-700" />
              VRS Sweepstakes Entry
            </CardTitle>
            <CardDescription>
              Tap the button below to enter for a chance to win 3D glasses. No personal information is collected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded text-center">
                <strong>UNCLASSIFIED</strong> — No personally identifiable information (PII) is collected through this entry.
              </div>

              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={loading || !recruiterCode}
              >
                {loading ? "Submitting..." : "Enter Sweepstakes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
