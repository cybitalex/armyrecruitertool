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
import { CheckCircle2, AlertCircle, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";
import { ARMY_RANKS } from "@shared/constants";

type PassionLevel = "" | "very" | "somewhat" | "not_sure" | "not_really" | "not_at_all";
type YesNo = "" | "yes" | "no";
type DegreeLevel = "" | "associate" | "bachelors" | "masters" | "doctorate" | "not_sure";
type GIBillAwareness = "" | "yes" | "no" | "a_little";
type ConsideringFuture = "" | "yes" | "no" | "maybe";

export default function HighSchoolSurveyPage() {
  const [location] = useLocation();
  const [recruiterCode, setRecruiterCode] = useState("");
  const [recruiterInfo, setRecruiterInfo] = useState<Partial<User> | null>(null);

  const [formData, setFormData] = useState({
    passion: "" as PassionLevel,
    attendingCollegeFall: "" as YesNo,

    // College path (if attending in fall)
    acceptedToCollege: "" as YesNo,
    whichCollege: "",
    tuitionCost: "",
    willBeDorming: "" as YesNo,
    moneySecuredForTuition: "",
    earnedScholarship: "" as YesNo,
    parentsPaying: "" as YesNo,
    fafsaPaying: "" as YesNo,
    workingWhileInCollege: "" as YesNo,
    workingWhere: "",
    highestDegreeSeeking: "" as DegreeLevel,
    heardOfGIBill: "" as GIBillAwareness,

    // Non-college path (if not attending in fall)
    plansAfterHighSchool: "",
    jobSecured: "" as YesNo,
    goalYearlySalary: "",
    consideringCollegeOrVocational: "" as ConsideringFuture,

    name: "",
    phone: "",
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
        .then(() => console.log("📱 High school survey QR scan tracked"))
        .catch((err) => console.error("Failed to track high school survey scan (non-critical):", err));

      recruiterApi
        .getByQRCode(recruiterCode)
        .then((data) => setRecruiterInfo(data.recruiter))
        .catch(() => setRecruiterInfo(null));
    }
  }, [recruiterCode]);

  const buildFeedback = (): string => {
    const passionLabel = { very: "Very passionate", somewhat: "Somewhat passionate", not_sure: "Not sure", not_really: "Not really", not_at_all: "Not at all" }[formData.passion] || "—";
    const lines: string[] = [
      "--- HIGH SCHOOL SENIORS SURVEY ---",
      "",
      "How passionate are you about attending college or vocational/tech school?",
      passionLabel,
      "",
      "Do you see yourself attending college in the fall?",
      formData.attendingCollegeFall === "yes" ? "Yes" : formData.attendingCollegeFall === "no" ? "No" : "—",
    ];

    if (formData.attendingCollegeFall === "yes") {
      lines.push("", "--- COLLEGE PATH ---", "");
      lines.push("Have you been accepted to a college for the fall?", formData.acceptedToCollege ? (formData.acceptedToCollege === "yes" ? "Yes" : "No") : "—");
      lines.push("If yes, which college?", formData.whichCollege || "—");
      lines.push("What is the tuition cost for your college?", formData.tuitionCost || "—");
      lines.push("Will you be dorming?", formData.willBeDorming ? (formData.willBeDorming === "yes" ? "Yes" : "No") : "—");
      lines.push("How much money have you secured for your tuition?", formData.moneySecuredForTuition || "—");
      lines.push("Have you earned a scholarship?", formData.earnedScholarship ? (formData.earnedScholarship === "yes" ? "Yes" : "No") : "—");
      lines.push("Are your parents paying for college?", formData.parentsPaying ? (formData.parentsPaying === "yes" ? "Yes" : "No") : "—");
      lines.push("Is FAFSA paying for your school?", formData.fafsaPaying ? (formData.fafsaPaying === "yes" ? "Yes" : "No") : "—");
      lines.push("Will you be working while attending college?", formData.workingWhileInCollege ? (formData.workingWhileInCollege === "yes" ? "Yes" : "No") : "—");
      lines.push("If yes, where at?", formData.workingWhere || "—");
      const degreeLabel = { associate: "Associate", bachelors: "Bachelor's", masters: "Master's", doctorate: "Doctorate", not_sure: "Not sure" }[formData.highestDegreeSeeking] || "—";
      lines.push("Highest level of degree you are seeking?", degreeLabel);
      const giLabel = { yes: "Yes", no: "No", a_little: "I've heard a little" }[formData.heardOfGIBill] || "—";
      lines.push("Have you heard about the Post 9/11 GI Bill (up to ~$300k for tuition and fees)?", giLabel);
    }

    if (formData.attendingCollegeFall === "no") {
      lines.push("", "--- PLANS AFTER HIGH SCHOOL ---", "");
      lines.push("What are your plans after high school?", formData.plansAfterHighSchool || "—");
      lines.push("Do you have a job secured?", formData.jobSecured ? (formData.jobSecured === "yes" ? "Yes" : "No") : "—");
      lines.push("Goal for yearly salary?", formData.goalYearlySalary || "—");
      const considerLabel = { yes: "Yes", no: "No", maybe: "Maybe" }[formData.consideringCollegeOrVocational] || "—";
      lines.push("Are you considering college or a vocational/tech school in the near future?", considerLabel);
    }

    lines.push("", "--- CONTACT (optional) ---", "");
    lines.push("Name:", formData.name || "—");
    lines.push("Phone:", formData.phone || "—");
    return lines.join("\n");
  };

  const passionToRating = (): number => {
    const map: Record<PassionLevel, number> = { "": 0, very: 5, somewhat: 4, not_sure: 3, not_really: 2, not_at_all: 1 };
    return map[formData.passion] ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recruiterCode) {
      setError("Invalid survey link. Please ask your recruiter for a new QR code.");
      return;
    }
    if (!formData.passion) {
      setError("Please answer how passionate you are about college or vocational/tech school.");
      return;
    }
    if (!formData.attendingCollegeFall) {
      setError("Please answer whether you see yourself attending college in the fall.");
      return;
    }
    if (formData.attendingCollegeFall === "yes") {
      if (!formData.acceptedToCollege) { setError("Please answer if you have been accepted to a college."); return; }
      if (!formData.willBeDorming) { setError("Please answer if you will be dorming."); return; }
      if (!formData.earnedScholarship) { setError("Please answer if you have earned a scholarship."); return; }
      if (!formData.parentsPaying) { setError("Please answer if your parents are paying for college."); return; }
      if (!formData.fafsaPaying) { setError("Please answer if FAFSA is paying for your school."); return; }
      if (!formData.workingWhileInCollege) { setError("Please answer if you will be working while in college."); return; }
      if (!formData.highestDegreeSeeking) { setError("Please select the highest degree you are seeking."); return; }
      if (!formData.heardOfGIBill) { setError("Please answer if you have heard about the Post 9/11 GI Bill."); return; }
    }
    if (formData.attendingCollegeFall === "no") {
      if (!formData.jobSecured) { setError("Please answer if you have a job secured."); return; }
      if (!formData.consideringCollegeOrVocational) { setError("Please answer if you are considering college or vocational/tech school in the near future."); return; }
    }

    setLoading(true);
    try {
      await surveys.submit({
        recruiterCode,
        name: formData.name || "",
        email: "",
        phone: formData.phone || "",
        rating: passionToRating() || 1,
        feedback: buildFeedback(),
        source: "high_school_senior_survey",
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const setYesNo = (field: keyof typeof formData, value: YesNo) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Thanks for Completing the Survey!</CardTitle>
            <CardDescription>
              Your answers have been sent to your recruiter. They may follow up if you left contact info.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-left">
                <p className="text-sm font-semibold text-green-800 mb-2">Survey sent to:</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p className="font-medium">{recruiterInfo.fullName}</p>
                  {recruiterInfo.rank && <p className="text-xs">{recruiterInfo.rank}</p>}
                  {recruiterInfo.unit && <p className="text-xs">{recruiterInfo.unit}</p>}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">
              <strong>UNCLASSIFIED</strong> — Your information will only be used for Army recruiting follow-up.
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
              High School Seniors Survey
            </CardTitle>
            <CardDescription className="text-base">
              A few questions about your plans after graduation — college, work, or both. Your answers help us share options that fit you.
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
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <p className="font-semibold text-green-900 mb-2">Your recruiter:</p>
                  <div className="flex items-center justify-center gap-3">
                    {recruiterInfo.profilePicture ? (
                      <img src={recruiterInfo.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-green-600" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-600">
                        <UserIcon className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    <div className="text-green-800 text-left">
                      <p className="font-bold">{recruiterInfo.fullName}</p>
                      {recruiterInfo.rank && <p className="text-xs">{ARMY_RANKS.find((r) => r.value === recruiterInfo!.rank)?.label || recruiterInfo.rank}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Q1: Passion */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">How passionate are you about attending college or a vocational/tech school? *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: "very" as const, label: "Very passionate" },
                    { value: "somewhat" as const, label: "Somewhat passionate" },
                    { value: "not_sure" as const, label: "Not sure" },
                    { value: "not_really" as const, label: "Not really" },
                    { value: "not_at_all" as const, label: "Not at all" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, passion: opt.value }))}
                      className={`px-3 py-2 rounded-lg border text-sm text-left transition ${
                        formData.passion === opt.value ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Attending college in fall */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Do you see yourself attending college in the fall? *</Label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData((p) => ({ ...p, attendingCollegeFall: "yes" }))} className={`px-4 py-2 rounded-lg border font-medium ${formData.attendingCollegeFall === "yes" ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>Yes</button>
                  <button type="button" onClick={() => setFormData((p) => ({ ...p, attendingCollegeFall: "no" }))} className={`px-4 py-2 rounded-lg border font-medium ${formData.attendingCollegeFall === "no" ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>No</button>
                </div>
              </div>

              {/* COLLEGE PATH */}
              {formData.attendingCollegeFall === "yes" && (
                <>
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">College plans</h3>

                    <div className="space-y-2">
                      <Label>Have you been accepted to a college for the fall? *</Label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, acceptedToCollege: v }))} className={`px-4 py-2 rounded-lg border ${formData.acceptedToCollege === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                        ))}
                      </div>
                    </div>

                    {formData.acceptedToCollege === "yes" && (
                      <div className="space-y-2">
                        <Label htmlFor="whichCollege">If so, what college?</Label>
                        <Input id="whichCollege" value={formData.whichCollege} onChange={(e) => setFormData((p) => ({ ...p, whichCollege: e.target.value }))} placeholder="College name" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="tuitionCost">What is the tuition cost for your college?</Label>
                      <Input id="tuitionCost" value={formData.tuitionCost} onChange={(e) => setFormData((p) => ({ ...p, tuitionCost: e.target.value }))} placeholder="e.g. $15,000 per year" />
                    </div>

                    <div className="space-y-2">
                      <Label>Will you be dorming? *</Label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, willBeDorming: v }))} className={`px-4 py-2 rounded-lg border ${formData.willBeDorming === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="moneySecured">How much money have you secured for your tuition?</Label>
                      <Input id="moneySecured" value={formData.moneySecuredForTuition} onChange={(e) => setFormData((p) => ({ ...p, moneySecuredForTuition: e.target.value }))} placeholder="e.g. $5,000" />
                    </div>

                    <div className="space-y-2">
                      <Label>Have you earned a scholarship? *</Label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, earnedScholarship: v }))} className={`px-4 py-2 rounded-lg border ${formData.earnedScholarship === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Are your parents paying for college? *</Label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, parentsPaying: v }))} className={`px-4 py-2 rounded-lg border ${formData.parentsPaying === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Is FAFSA paying for your school? *</Label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, fafsaPaying: v }))} className={`px-4 py-2 rounded-lg border ${formData.fafsaPaying === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Will you be working while attending college? *</Label>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, workingWhileInCollege: v }))} className={`px-4 py-2 rounded-lg border ${formData.workingWhileInCollege === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                        ))}
                      </div>
                    </div>
                    {formData.workingWhileInCollege === "yes" && (
                      <div className="space-y-2">
                        <Label htmlFor="workingWhere">If yes, where at?</Label>
                        <Input id="workingWhere" value={formData.workingWhere} onChange={(e) => setFormData((p) => ({ ...p, workingWhere: e.target.value }))} placeholder="Employer or type of job" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>What is the highest level of college degree you are seeking? *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "associate" as const, label: "Associate" },
                          { value: "bachelors" as const, label: "Bachelor's" },
                          { value: "masters" as const, label: "Master's" },
                          { value: "doctorate" as const, label: "Doctorate" },
                          { value: "not_sure" as const, label: "Not sure" },
                        ].map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setFormData((p) => ({ ...p, highestDegreeSeeking: opt.value }))} className={`px-3 py-2 rounded-lg border text-sm ${formData.highestDegreeSeeking === opt.value ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Have you ever heard about the Post 9/11 GI Bill that can help pay up to ~$300k for tuition and fees? *</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "yes" as const, label: "Yes" },
                          { value: "no" as const, label: "No" },
                          { value: "a_little" as const, label: "I've heard a little" },
                        ].map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setFormData((p) => ({ ...p, heardOfGIBill: opt.value }))} className={`px-4 py-2 rounded-lg border text-sm ${formData.heardOfGIBill === opt.value ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* NON-COLLEGE PATH */}
              {formData.attendingCollegeFall === "no" && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Plans after high school</h3>

                  <div className="space-y-2">
                    <Label htmlFor="plansAfter">What are your plans after high school?</Label>
                    <Textarea id="plansAfter" placeholder="e.g. Vacation, work, save money, travel..." value={formData.plansAfterHighSchool} onChange={(e) => setFormData((p) => ({ ...p, plansAfterHighSchool: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Do you have a job secured? *</Label>
                    <div className="flex gap-3">
                      {(["yes", "no"] as const).map((v) => (
                        <button key={v} type="button" onClick={() => setFormData((p) => ({ ...p, jobSecured: v }))} className={`px-4 py-2 rounded-lg border ${formData.jobSecured === v ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{v === "yes" ? "Yes" : "No"}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goalSalary">Goal for yearly salary?</Label>
                    <Input id="goalSalary" value={formData.goalYearlySalary} onChange={(e) => setFormData((p) => ({ ...p, goalYearlySalary: e.target.value }))} placeholder="e.g. $35,000" />
                  </div>

                  <div className="space-y-2">
                    <Label>Are you considering college or a vocational/tech school in the near future? *</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "yes" as const, label: "Yes" },
                        { value: "no" as const, label: "No" },
                        { value: "maybe" as const, label: "Maybe" },
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setFormData((p) => ({ ...p, consideringCollegeOrVocational: opt.value }))} className={`px-4 py-2 rounded-lg border text-sm ${formData.consideringCollegeOrVocational === opt.value ? "bg-green-700 text-white border-green-800" : "bg-white border-gray-300 hover:bg-gray-50"}`}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Optional contact */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact information (optional)</h3>
                <p className="text-sm text-gray-600">Leave your info if you&apos;d like a recruiter to follow up with options that fit your plans.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hs-name">First Name</Label>
                    <Input id="hs-name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hs-phone">Phone</Label>
                    <Input id="hs-phone" type="tel" placeholder="555-123-4567" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> This is not an enlistment form. It helps recruiters share information (like education benefits) that may fit your goals.
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>UNCLASSIFIED</strong> — Your information will only be used for Army recruiting follow-up. SSN is NOT collected.
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 py-4 text-lg" disabled={loading}>
                {loading ? "Submitting..." : "Submit Survey"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
