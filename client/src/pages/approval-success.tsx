import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle2, XCircle, Home } from "lucide-react";
import { IS_SORB } from "@/lib/sorb-config";

export default function ApprovalSuccess() {
  const [location] = useLocation();
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // Get status from URL query params
    const params = new URLSearchParams(window.location.search);
    setStatus(params.get("status") || "");
  }, [location]);

  const isApproved = status === "approved";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isApproved ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Request Approved! ✅</CardTitle>
              <CardDescription>
                The station commander request has been approved successfully.
              </CardDescription>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Request Denied</CardTitle>
              <CardDescription>
                The station commander request has been denied.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isApproved ? (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-sm text-green-800">
                The user has been notified via email and can now access the Station
                Commander dashboard.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-sm text-red-800">
                The user has been notified via email. Their account will function
                as a regular recruiter account.
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-green-700 hover:bg-green-800"
            >
              <Home className="w-4 h-4 mr-2" />
              {IS_SORB ? "Go to SORB Army Recruiter Tool" : "Go to Army Recruiter Tool"}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            You can safely close this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

