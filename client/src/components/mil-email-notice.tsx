import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function MilEmailNotice() {
  return (
    <Alert className="bg-blue-50 border-blue-300">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900">Using a .mil email address?</AlertTitle>
      <AlertDescription className="text-blue-800 text-sm space-y-2">
        <p>
          Military email servers may delay verification emails by <strong>30 minutes to several hours</strong> due to strict security filters.
        </p>
        <div className="mt-2">
          <p className="font-semibold mb-1">What to do:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check your <strong>spam/junk folder</strong></li>
            <li>Wait up to 2-4 hours for the email to arrive</li>
            <li>You can log in immediately - you have <strong>14 days</strong> to verify</li>
            <li>Use the "Resend Email" button if needed after 1 hour</li>
            <li>Contact your S6/IT to whitelist: <strong>alex.cybitdevs@gmail.com</strong></li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}
