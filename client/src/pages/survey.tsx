import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { surveys, recruiter as recruiterApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, AlertCircle, Star, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";
import { ARMY_RANKS } from "@shared/constants";

export default function SurveyPage() {
  const [location] = useLocation();
  const [recruiterCode, setRecruiterCode] = useState("");

  const [recruiterInfo, setRecruiterInfo] = useState<Partial<User> | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rating: 0,
    feedback: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Read recruiter code from the real browser query string so it works with URLs like
  // https://armyrecruitertool.duckdns.org/survey?r=...
  useEffect(() => {
    try {
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(search);
      setRecruiterCode(params.get("r") || "");
    } catch {
      setRecruiterCode("");
    }
  }, [location]);

  // Fetch recruiter info if QR code is present
  useEffect(() => {
    if (recruiterCode) {
      recruiterApi
        .getByQRCode(recruiterCode)
        .then((data) => setRecruiterInfo(data.recruiter))
        .catch(() => {
          setRecruiterInfo(null);
        });
    }
  }, [recruiterCode]);

  const handleRatingChange = (value: number) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recruiterCode) {
      setError("Invalid survey link. Please ask your recruiter for a new QR code.");
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    setLoading(true);

    try {
      await surveys.submit({
        recruiterCode,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        rating: formData.rating,
        feedback: formData.feedback || undefined,
        source: "presentation",
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit your feedback. Please try again."
      );
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
            <CardTitle className="text-2xl">Thank You for Your Feedback! 🎖️</CardTitle>
            <CardDescription>
              We appreciate you taking a moment to rate this briefing.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-left">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Your feedback was sent to:
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <p className="font-medium">{recruiterInfo.fullName}</p>
                  {recruiterInfo.rank && (
                    <p className="text-xs">{recruiterInfo.rank}</p>
                  )}
                  {recruiterInfo.unit && (
                    <p className="text-xs">{recruiterInfo.unit}</p>
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">
              <strong>UNCLASSIFIED</strong> - Your contact information will only be
              used for Army recruiting follow-up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-800">
              Briefing Feedback Form
            </CardTitle>
            <CardDescription className="text-base">
              Rate this presentation and share your contact info if you&apos;d like a recruiter
              to follow up.
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

              {recruiterInfo && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                  <p className="font-semibold text-green-900 mb-4">
                    Feedback will be sent to your recruiter:
                  </p>
                  
                  {/* Recruiter Photo */}
                  <div className="flex justify-center mb-4">
                    {recruiterInfo.profilePicture ? (
                      <img
                        src={recruiterInfo.profilePicture}
                        alt={recruiterInfo.fullName}
                        className="w-32 h-32 rounded-full object-cover border-4 border-green-600 shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-600 shadow-lg">
                        <UserIcon className="w-16 h-16 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Recruiter Info */}
                  <div className="text-green-800 space-y-1">
                    <p className="text-lg font-bold">{recruiterInfo.fullName}</p>
                    {recruiterInfo.rank && (
                      <p className="text-sm font-medium">
                        {ARMY_RANKS.find(r => r.value === recruiterInfo.rank)?.label || recruiterInfo.rank}
                      </p>
                    )}
                    {recruiterInfo.unit && <p className="text-sm">{recruiterInfo.unit}</p>}
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">How was this briefing? *</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className={`p-2 rounded-full border transition ${
                        formData.rating >= star
                          ? "bg-yellow-400 border-yellow-500 text-yellow-900"
                          : "bg-white border-gray-300 text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <Star
                        className="w-6 h-6"
                        fill={formData.rating >= star ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  1 = Poor, 5 = Excellent
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Contact Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="555-123-4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Optional feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Comments (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Anything you liked, didn’t like, or want to learn more about?"
                  value={formData.feedback}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, feedback: e.target.value }))
                  }
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> This is not an enlistment form. It&apos;s only for
                feedback and optional follow-up from a recruiter.
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>UNCLASSIFIED</strong> - Your information will be handled per Army
                regulations and the Privacy Act of 1974. SSN is NOT collected.
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 py-4 text-lg"
                disabled={loading}
              >
                {loading ? "Submitting Feedback..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}


