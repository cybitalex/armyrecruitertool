import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function VerificationWarning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Debug logging
  console.log("🔍 VerificationWarning - user:", user);
  console.log("🔍 VerificationWarning - user.isVerified:", user?.isVerified);
  console.log("🔍 VerificationWarning - user.createdAt:", user?.createdAt);
  console.log("🔍 VerificationWarning - dismissed:", dismissed);

  // Don't show if user is verified or dismissed
  if (!user || user.isVerified || dismissed) {
    console.log("🚫 VerificationWarning - Not showing banner");
    return null;
  }

  console.log("✅ VerificationWarning - Showing banner");

  // Calculate days remaining for verification
  const GRACE_PERIOD_DAYS = 7;
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const daysOld = Math.floor(accountAge / (24 * 60 * 60 * 1000));
  const daysRemaining = GRACE_PERIOD_DAYS - daysOld;

  const handleResendEmail = async () => {
    try {
      setSending(true);
      await apiRequest("POST", "/api/auth/resend-verification", {
        email: user.email,
      });
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox (and spam folder) for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sticky top-[104px] md:top-[113px] z-40 px-3 md:px-6 py-2">
      <Alert className="bg-yellow-50 border-yellow-300 relative">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between gap-4 text-yellow-800">
          <div className="flex-1">
            <strong>Email Verification Required</strong>
            <p className="text-sm mt-1">
              Your email address is not verified. Please check your inbox for the verification link.
              {daysRemaining > 0 ? (
                <> You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining to verify your account.</>
              ) : (
                <> Your grace period has expired. Please contact support.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {daysRemaining > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendEmail}
                disabled={sending}
                className="whitespace-nowrap"
              >
                <Mail className="w-4 h-4 mr-1" />
                {sending ? "Sending..." : "Resend Email"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
