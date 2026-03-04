import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { recruits, recruiter as recruiterApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, AlertCircle, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";
import { ARMY_RANKS } from "@shared/constants";
import { IS_SORB } from "../lib/sorb-config";

export default function ApplyPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  // Read recruiter code from the real browser query string so it works with URLs like
  // https://armyrecruitertool.duckdns.org/apply?r=...
  const [recruiterCode, setRecruiterCode] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(search);
      const code = params.get("r");
      setRecruiterCode(code);
      console.log(`🔍 Apply page - Extracted recruiterCode from URL: ${code || 'NULL'}`);
    } catch {
      setRecruiterCode(null);
    }
  }, [location]);

  const [recruiterInfo, setRecruiterInfo] = useState<Partial<User> | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    educationLevel: "",
    hasDriversLicense: "yes",
    hasPriorService: "no",
    priorServiceBranch: "",
    priorServiceYears: "",
    preferredMOS: "",
    availability: "",
    additionalNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const scanTracked = useRef(false); // Prevent double-tracking

  // Fetch recruiter info if QR code is present AND track the scan
  useEffect(() => {
    if (recruiterCode && !scanTracked.current) {
      scanTracked.current = true; // Mark as tracked to prevent double-counting
      
      // Track the QR scan (for analytics)
      fetch("/api/qr-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          qrCode: recruiterCode,
          scanType: "application" 
        }),
      }).then(() => {
        console.log("📱 QR scan tracked");
      }).catch((err) => {
        console.error("Failed to track QR scan (non-critical):", err);
      });

      // Fetch recruiter info to display on the form
      recruiterApi.getByQRCode(recruiterCode)
        .then((data) => setRecruiterInfo(data.recruiter))
        .catch(() => {
          // Silently fail - recruiter info is optional
          setRecruiterInfo(null);
        });
    }
  }, [recruiterCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Log what we're sending
      console.log(`📤 Submitting application - recruiterCode: ${recruiterCode || 'NULL'}`);
      
      const payload = {
        ...formData,
        recruiterCode: recruiterCode || undefined, // Send QR code, backend will resolve to recruiterId
        // source will be set by backend based on whether recruiterCode exists or user is logged in
        priorServiceYears: formData.priorServiceYears
          ? parseInt(formData.priorServiceYears)
          : undefined,
      };
      
      console.log(`📤 Payload being sent:`, { ...payload, recruiterCode: payload.recruiterCode || 'NULL' });
      
      await recruits.create(payload as any);

      // Invalidate stats and recruits queries so dashboard updates
      queryClient.invalidateQueries({ queryKey: ["/recruiter/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application submission failed");
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
            <CardTitle className="text-2xl">Form Submitted! 🎖️</CardTitle>
            <CardDescription>
              {IS_SORB
                ? "Thank you for your interest in U.S. Army Special Operations pipelines"
                : "Thank you for your interest in learning more about the U.S. Army"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              {IS_SORB
                ? "Your interest profile has been submitted. A recruiter will follow up to discuss screening, readiness, and potential pipeline fit."
                : "Your information has been successfully submitted. A recruiter will reach out to you soon to answer any questions and share more details."}
            </p>
            {recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-left">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  ✅ Your form has been submitted to:
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <p className="font-medium">{recruiterInfo.fullName}</p>
                  {recruiterInfo.rank && (
                    <p className="text-xs">{recruiterInfo.rank}</p>
                  )}
                  {recruiterInfo.unit && (
                    <p className="text-xs">{recruiterInfo.unit}</p>
                  )}
                  {recruiterInfo.phoneNumber && (
                    <p className="text-xs mt-2">Phone: {recruiterInfo.phoneNumber}</p>
                  )}
                  {recruiterInfo.email && (
                    <p className="text-xs">Email: {recruiterInfo.email}</p>
                  )}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  They will be in touch with you shortly to answer your questions.
                </p>
              </div>
            )}
            {recruiterCode && !recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ Your form has been linked to your recruiter
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Check your email ({formData.email}) for confirmation
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Recruiter Info Card - Compact style similar to survey page */}
        {recruiterInfo && (
          <Card className="mb-6 bg-green-50 border border-green-200">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-green-900 mb-3 text-center">
                Your application will be sent to:
              </p>
              
              <div className="flex items-center gap-4">
                {/* Profile Picture */}
                {recruiterInfo.profilePicture ? (
                  <img
                    src={recruiterInfo.profilePicture}
                    alt={recruiterInfo.fullName}
                    className="w-20 h-20 rounded-full object-cover border-3 border-green-600 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-3 border-green-600 shadow-md flex-shrink-0">
                    <UserIcon className="w-10 h-10 text-green-600" />
                  </div>
                )}
                
                {/* Contact Information - Rank, Last Name, Phone */}
                <div className="flex-1 space-y-1">
                  {recruiterInfo.rank && (
                    <p className="text-sm font-bold text-green-900">
                      {ARMY_RANKS.find(r => r.value === recruiterInfo.rank)?.label || recruiterInfo.rank}
                    </p>
                  )}
                  {recruiterInfo.fullName && (
                    <p className="text-base font-bold text-green-900">
                      {recruiterInfo.fullName.split(' ').pop()}
                    </p>
                  )}
                  {recruiterInfo.phoneNumber && (
                    <a 
                      href={`tel:${recruiterInfo.phoneNumber}`}
                      className="text-sm text-green-700 hover:underline flex items-center gap-1"
                    >
                      📞 {recruiterInfo.phoneNumber}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        <Card className="mb-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-green-900 text-center flex items-center justify-center gap-2">
              <span className="text-2xl">🇺🇸</span>
              {IS_SORB ? "Why Pursue a Special Operations Pipeline?" : "Discover What the U.S. Army Has to Offer"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{IS_SORB ? "🎯" : "🎓"}</span>
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">
                      {IS_SORB ? "Mission-Focused Career Paths" : "Education Benefits"}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {IS_SORB
                        ? "Explore pathways like 18X, Option 40, Civil Affairs, PSYOP, and other Special Operations opportunities."
                        : "Over $250,000 in education value through the Post-9/11 GI Bill® — covers 100% tuition, housing allowance, and book stipend. Active duty soldiers also receive up to $4,500/year in Tuition Assistance while serving."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{IS_SORB ? "🧭" : "🏥"}</span>
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">
                      {IS_SORB ? "Structured Screening & Guidance" : "Healthcare Coverage"}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {IS_SORB
                        ? "Work with recruiters who assess GT, readiness, and qualifications to match you to the right pipeline."
                        : "Comprehensive medical, dental, and vision coverage through TRICARE for you and your family — at little to no cost while on active duty."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{IS_SORB ? "🏋️" : "💼"}</span>
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">
                      {IS_SORB ? "Preparation & Mentorship" : "Career Training & Skills"}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {IS_SORB
                        ? "Track physical readiness and receive mentorship on rucking, endurance, and selection preparation."
                        : "Over 150+ career fields with fully paid training and industry-recognized certifications in technology, healthcare, engineering, aviation, and more."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{IS_SORB ? "🤝" : "💰"}</span>
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">
                      {IS_SORB ? "Quality Over Volume" : "Pay & Financial Benefits"}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {IS_SORB
                        ? "SORB focuses on identifying and preparing high-potential candidates for Special Operations success."
                        : "Competitive base pay, tax-free housing (BAH) and food (BAS) allowances, 30 days paid vacation, enlistment bonuses up to $50,000, and a federal pension after 20 years."}
                    </p>
                  </div>
                </div>
              </div>

              {!IS_SORB && (
                <>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">📚</span>
                      <div>
                        <h4 className="font-bold text-green-900 mb-1">Student Loan Repayment</h4>
                        <p className="text-sm text-gray-700">
                          Army Reserve members may qualify for up to $65,000 in Student Loan Repayment (SLRP). Active duty soldiers may also be eligible through special programs.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">🛡️</span>
                      <div>
                        <h4 className="font-bold text-green-900 mb-1">Army Reserve Benefits</h4>
                        <p className="text-sm text-gray-700">
                          Serve one weekend/month and two weeks/year while keeping your civilian career. Benefits include drill pay, TRICARE Reserve Select, retirement points, and access to military bases and commissaries.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Call to Action */}
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-green-900">
                {IS_SORB
                  ? "⬇️ Complete this form to start your Special Operations screening conversation"
                  : "⬇️ Fill out the form below to learn more — no commitment required"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-800">
              {IS_SORB ? "SORB Interest Form" : "U.S. Army Interest Form"}
            </CardTitle>
            <CardDescription className="text-base">
              {IS_SORB
                ? (recruiterCode
                    ? "🎯 This form is linked to your SORB recruiter"
                    : "Complete this form to express interest in Special Operations pathways")
                : (recruiterCode
                    ? "🎯 This form is linked to your recruiter"
                    : "Complete this form to learn more about opportunities in the Army")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="555-123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Education & Background */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Background</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel">Education Level *</Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">High School Diploma/GED</SelectItem>
                        <SelectItem value="some_college">Some College</SelectItem>
                        <SelectItem value="associates">Associate's Degree</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree or Higher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hasDriversLicense">Driver's License *</Label>
                    <Select
                      value={formData.hasDriversLicense}
                      onValueChange={(value) => setFormData({ ...formData, hasDriversLicense: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!IS_SORB && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hasPriorService">Prior Military Service *</Label>
                      <Select
                        value={formData.hasPriorService}
                        onValueChange={(value) => setFormData({ ...formData, hasPriorService: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.hasPriorService === "yes" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="priorServiceBranch">Branch</Label>
                          <Input
                            id="priorServiceBranch"
                            value={formData.priorServiceBranch}
                            onChange={(e) => setFormData({ ...formData, priorServiceBranch: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priorServiceYears">Years Served</Label>
                          <Input
                            id="priorServiceYears"
                            type="number"
                            min="0"
                            value={formData.priorServiceYears}
                            onChange={(e) => setFormData({ ...formData, priorServiceYears: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="preferredMOS">Preferred MOS (Military Occupational Specialty)</Label>
                  <Input
                    id="preferredMOS"
                    placeholder={IS_SORB ? "e.g., 11B, 68W, 35F" : "e.g., Infantry, Medical, Intelligence"}
                    value={formData.preferredMOS}
                    onChange={(e) => setFormData({ ...formData, preferredMOS: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">When are you available to start? *</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => setFormData({ ...formData, availability: value })}
                    required
                  >
                    <SelectTrigger 
                      id="availability"
                      className="w-full min-h-[44px] touch-manipulation sm:min-h-[36px]"
                    >
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent 
                      position="popper"
                      side="bottom"
                      align="start"
                      className="z-[100] w-[var(--radix-select-trigger-width)] max-h-[300px]"
                    >
                      <SelectItem value="immediate">Immediately</SelectItem>
                      <SelectItem value="1_month">Within 1 Month</SelectItem>
                      <SelectItem value="3_months">Within 3 Months</SelectItem>
                      <SelectItem value="6_months">Within 6 Months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Any questions or additional information"
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                <strong>Important:</strong>{" "}
                {IS_SORB
                  ? "This form does not guarantee selection. It is used for interest capture, initial screening, and recruiter follow-up for Special Operations pathways."
                  : "Submitting this form does not constitute enlistment or any commitment. It is simply a way to express interest and connect with a recruiter to learn more."}
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <strong>UNCLASSIFIED</strong> - Your information will be handled per 
                Army regulations and the Privacy Act of 1974. SSN is NOT collected 
                at this stage.
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 py-6 text-lg"
                disabled={loading}
              >
                {loading
                  ? (IS_SORB ? "Submitting Interest Form..." : "Submitting...")
                  : (IS_SORB ? "Submit SORB Interest Form" : "Submit Interest Form")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

