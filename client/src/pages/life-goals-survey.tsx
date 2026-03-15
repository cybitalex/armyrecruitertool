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

export default function LifeGoalsSurveyPage() {
  const [location] = useLocation();
  const [recruiterCode, setRecruiterCode] = useState("");
  const [recruiterInfo, setRecruiterInfo] = useState<Partial<User> | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rating: 0,
    mainGoal: "" as
      | ""
      | "college"
      | "trade"
      | "career"
      | "service"
      | "travel"
      | "undecided",
    goalDetails: "",
    topPriority: "" as
      | ""
      | "pay_for_school"
      | "job_skills"
      | "steady_pay"
      | "stay_close"
      | "leave_area"
      | "take_care_family",
    priorityDetails: "",
    viewOfArmy: "" as
      | ""
      | "benefits"
      | "combat_only"
      | "college_career"
      | "danger"
      | "discipline_team"
      | "dont_know",
    viewDetails: "",
    concerns: [] as (
      | "time_away"
      | "college"
      | "safety"
      | "family"
      | "commitment"
      | "none"
    )[],
    concernDetails: "",
    followUpPermission: "" as "" | "yes" | "no",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(search);
      setRecruiterCode(params.get("r") || "");
    } catch {
      setRecruiterCode("");
    }
  }, [location]);

  useEffect(() => {
    if (recruiterCode) {
      fetch("/api/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: recruiterCode, scanType: "survey" }),
      })
        .then(() => console.log("📱 Life goals QR scan tracked"))
        .catch((err) => console.error("Failed to track life goals QR scan (non-critical):", err));

      recruiterApi
        .getByQRCode(recruiterCode)
        .then((data) => setRecruiterInfo(data.recruiter))
        .catch(() => setRecruiterInfo(null));
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
    if (!formData.mainGoal) {
      setError("Please choose your biggest goal right now.");
      return;
    }
    if (!formData.topPriority) {
      setError("Please choose what matters most to you right now.");
      return;
    }
    if (!formData.viewOfArmy) {
      setError("Please tell us what best matches how you think about the Army.");
      return;
    }
    if (formData.concerns.length === 0) {
      setError("Please pick at least one question or concern.");
      return;
    }
    if (!formData.followUpPermission) {
      setError("Please let us know if it's okay for a recruiter to text you.");
      return;
    }

    setLoading(true);

    try {
      const mainGoalLabel = {
        college: "Graduate college / earn a degree",
        trade: "Learn a trade or technical skill",
        career: "Build a long‑term career",
        service: "Serve something bigger than myself",
        travel: "See the world / travel",
        undecided: "Still figuring things out",
      }[formData.mainGoal] || "Not selected";

      const topPriorityLabel = {
        pay_for_school: "Paying for school with little or no debt",
        job_skills: "Getting job skills and certifications",
        steady_pay: "Having steady pay and benefits",
        stay_close: "Staying close to home",
        leave_area: "Getting out of my current area",
        take_care_family: "Taking care of my family",
      }[formData.topPriority] || "Not selected";

      const viewOfArmyLabel = {
        benefits: "Mostly benefits (college money, pay, healthcare, etc.)",
        combat_only: "Mostly combat / front‑line only",
        college_career: "College, career skills, and benefits",
        danger: "Danger, risk, or deployments",
        discipline_team: "Discipline, teamwork, and structure",
        dont_know: "I don't really know what the Army does",
      }[formData.viewOfArmy] || "Not selected";

      const concernLabels: Record<string, string> = {
        time_away: "Time away from home / deployments",
        college: "College plans and paying for school",
        safety: "Safety and personal risk",
        family: "How it affects family or relationships",
        commitment: "Length of contract / commitment",
        none: "I don't really have concerns right now",
      };

      const concernList =
        formData.concerns.length > 0
          ? formData.concerns.map((c) => `- ${concernLabels[c] || c}`).join("\n")
          : "Not selected";

      const combinedFeedback = `
Q1 - Biggest goal right now (main choice):
${mainGoalLabel}
Extra details: ${formData.goalDetails || "Not provided"}

Q2 - What matters most when you think about your future (main choice):
${topPriorityLabel}
Extra details: ${formData.priorityDetails || "Not provided"}

Q3 - What best matches how you think about the U.S. Army (main choice):
${viewOfArmyLabel}
Extra details: ${formData.viewDetails || "Not provided"}

Q4 - Questions or concerns before ever considering the Army (multi‑select):
${concernList}
Extra details: ${formData.concernDetails || "Not provided"}

Q5 - Okay to text you to answer questions and share options:
${formData.followUpPermission === "yes" ? "Yes, okay to text" : "No / not right now"}
      `.trim();

      await surveys.submit({
        recruiterCode,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        rating: formData.rating >= 1 && formData.rating <= 5 ? formData.rating : 0,
        feedback: combinedFeedback,
        source: "life_goals_survey",
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit. Please try again."
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
            <CardTitle className="text-2xl">Thanks for Sharing! 🎖️</CardTitle>
            <CardDescription>
              Your answers have been sent to your recruiter. They'll reach out if you gave permission.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-left">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Your survey was sent to:
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <p className="font-medium">{recruiterInfo.fullName}</p>
                  {recruiterInfo.rank && <p className="text-xs">{recruiterInfo.rank}</p>}
                  {recruiterInfo.unit && <p className="text-xs">{recruiterInfo.unit}</p>}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">
              <strong>UNCLASSIFIED</strong> — Your contact information will only be
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
              Life Goals & Army Interest Survey
            </CardTitle>
            <CardDescription className="text-base">
              Answer 5 quick questions about your goals and what you think about the Army.
              Share your contact info if you&apos;d like a recruiter to text you with options—no obligation.
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
                    Your answers will be sent to this recruiter:
                  </p>
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
                  <div className="text-green-800 space-y-1">
                    <p className="text-lg font-bold">{recruiterInfo.fullName}</p>
                    {recruiterInfo.rank && (
                      <p className="text-sm font-medium">
                        {ARMY_RANKS.find((r) => r.value === recruiterInfo!.rank)?.label || recruiterInfo.rank}
                      </p>
                    )}
                    {recruiterInfo.unit && <p className="text-sm">{recruiterInfo.unit}</p>}
                  </div>
                </div>
              )}

              {/* Q1 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  1. Which of these best matches your biggest goal right now? *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: "college", label: "Graduate college / earn a degree" },
                    { value: "trade", label: "Learn a trade or technical skill" },
                    { value: "career", label: "Build a long‑term career" },
                    { value: "service", label: "Serve something bigger than myself" },
                    { value: "travel", label: "See the world / travel" },
                    { value: "undecided", label: "Still figuring things out" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, mainGoal: option.value as typeof prev.mainGoal }))
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition ${
                        formData.mainGoal === option.value
                          ? "bg-green-700 text-white border-green-800"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Optional: anything specific about your goals we should know?"
                  value={formData.goalDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, goalDetails: e.target.value }))}
                />
              </div>

              {/* Q2 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  2. Right now, what matters most to you when you think about your future? *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: "pay_for_school", label: "Paying for school with little or no debt" },
                    { value: "job_skills", label: "Getting job skills & certifications" },
                    { value: "steady_pay", label: "Steady paycheck and benefits" },
                    { value: "stay_close", label: "Staying close to home" },
                    { value: "leave_area", label: "Getting out of my current area" },
                    { value: "take_care_family", label: "Taking care of my family" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, topPriority: option.value as typeof prev.topPriority }))
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition ${
                        formData.topPriority === option.value
                          ? "bg-green-700 text-white border-green-800"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Optional: add anything else that's important to you."
                  value={formData.priorityDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priorityDetails: e.target.value }))}
                />
              </div>

              {/* Q3 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  3. Which of these best matches how you think about the U.S. Army right now? *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: "benefits", label: "Mostly benefits (college, pay, healthcare, etc.)" },
                    { value: "combat_only", label: "Mostly combat / front‑line only" },
                    { value: "college_career", label: "College, career skills, and benefits" },
                    { value: "danger", label: "Danger, risk, or deployments" },
                    { value: "discipline_team", label: "Discipline, teamwork, and structure" },
                    { value: "dont_know", label: "I don't really know what the Army does" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, viewOfArmy: option.value as typeof prev.viewOfArmy }))
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition ${
                        formData.viewOfArmy === option.value
                          ? "bg-green-700 text-white border-green-800"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Optional: anything else that comes to mind—good, bad, or in between."
                  value={formData.viewDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, viewDetails: e.target.value }))}
                />
              </div>

              {/* Q4 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  4. What questions or concerns would you need answered before you&apos;d ever consider the Army? *
                </Label>
                <p className="text-xs text-gray-500">Select all that apply.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: "time_away", label: "Time away from home / deployments" },
                    { value: "college", label: "How it affects college and paying for school" },
                    { value: "safety", label: "Safety and personal risk" },
                    { value: "family", label: "Impact on family or relationships" },
                    { value: "commitment", label: "Length of contract / commitment" },
                    { value: "none", label: "I don't really have concerns right now" },
                  ].map((option) => {
                    const isSelected = formData.concerns.includes(
                      option.value as (typeof formData.concerns)[number]
                    );
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => {
                            const value = option.value as (typeof prev.concerns)[number];
                            const alreadySelected = prev.concerns.includes(value);
                            if (alreadySelected) {
                              return { ...prev, concerns: prev.concerns.filter((c) => c !== value) };
                            }
                            if (value === "none") return { ...prev, concerns: ["none"] };
                            return {
                              ...prev,
                              concerns: prev.concerns.filter((c) => c !== "none").concat(value),
                            };
                          })
                        }
                        className={`w-full px-3 py-2 rounded-lg border text-sm text-left transition ${
                          isSelected
                            ? "bg-green-700 text-white border-green-800"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  placeholder="Optional: add any specific questions or concerns you have."
                  value={formData.concernDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, concernDetails: e.target.value }))}
                />
              </div>

              {/* Q5 — openness rating (optional) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  5. How open are you to learning how the Army could help with your goals? (optional)
                </Label>
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
                  1 = Not interested at all &nbsp;·&nbsp; 5 = Very open to at least hearing options
                </p>
              </div>

              {/* Q5b — follow-up permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  6. Is it okay if a recruiter sends you a short text to answer questions and share options tailored to your goals? *
                </Label>
                <div className="flex gap-4">
                  {(["yes", "no"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, followUpPermission: val }))}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                        formData.followUpPermission === val
                          ? val === "yes"
                            ? "bg-green-600 text-white border-green-700"
                            : "bg-gray-700 text-white border-gray-800"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {val === "yes" ? "Yes, okay to text me" : "Not right now"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info (optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Contact Info</h3>

                <div className="space-y-2">
                  <Label htmlFor="lg-name">Name (optional)</Label>
                  <Input
                    id="lg-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lg-email">Email (optional)</Label>
                  <Input
                    id="lg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lg-phone">Phone Number (optional)</Label>
                  <Input
                    id="lg-phone"
                    type="tel"
                    placeholder="555-123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> This is not an enlistment form. It&apos;s only to understand your goals
                and give you the option for a recruiter to follow up with information if you choose.
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>UNCLASSIFIED</strong> — Your information will only be used for Army recruiting follow-up
                consistent with applicable regulations. SSN is NOT collected.
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 py-4 text-lg"
                disabled={loading}
              >
                {loading ? "Submitting Survey..." : "Submit Survey"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
