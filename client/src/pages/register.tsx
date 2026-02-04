import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ARMY_RANKS, ACCOUNT_TYPES } from "@shared/constants";
import type { Station } from "@shared/schema";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "../components/ui/searchable-select";
import { MilEmailNotice } from "../components/mil-email-notice";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    rank: "",
    unit: "",
    phoneNumber: "",
    accountType: "recruiter",
    justification: "",
    stationCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    // Load stations from API
    const loadStations = async () => {
      try {
        const response = await fetch("/api/stations");
        if (response.ok) {
          const data = await response.json();
          setStations(data);
        }
      } catch (err) {
        console.error("Failed to load stations:", err);
      }
    };
    loadStations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.stationCode) {
      setError("Please select your recruiting station");
      return;
    }

    setLoading(true);

    try {
      await auth.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        rank: formData.rank || undefined,
        unit: formData.unit || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        accountType: formData.accountType,
        justification: formData.justification || undefined,
        stationCode: formData.stationCode,
      });

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            <CardTitle className="text-2xl">
              Registration Successful! 🎖️
            </CardTitle>
            <CardDescription>
              {formData.accountType === "station_commander"
                ? "Your station commander request has been submitted for approval."
                : "Please check your email to verify your account before logging in."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              We've sent a verification link to{" "}
              <strong>{formData.email}</strong>
            </p>
            
            {formData.email.toLowerCase().endsWith('.mil') && (
              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertDescription className="text-xs text-yellow-800">
                  <strong>⚠️ .mil email delay:</strong> Military email servers may delay delivery by 30 minutes to several hours. 
                  You can log in now - you have <strong>14 days</strong> to verify. Check spam/junk folder.
                </AlertDescription>
              </Alert>
            )}

            {formData.accountType === "station_commander" && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 font-medium">
                  Station Commander Access Pending
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  An administrator will review your request and you'll receive
                  an email notification with the decision. In the meantime, you
                  can use your account with standard recruiter features.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-800">
            Army Recruiter Registration
          </CardTitle>
          <CardDescription>
            Create your recruiter account to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-gray-500">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.accountType === "station_commander" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-xs text-blue-800">
                    Station Commander requests require admin approval. You'll
                    receive an email notification when your request is reviewed.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-600">
                Use your work or personal email address
              </p>
            </div>

            {formData.email.toLowerCase().endsWith('.mil') && (
              <MilEmailNotice />
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Select
                  value={formData.rank}
                  onValueChange={(value) =>
                    setFormData({ ...formData, rank: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARMY_RANKS.map((rank) => (
                      <SelectItem key={rank.value} value={rank.value}>
                        {rank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  type="text"
                  placeholder="1-1 Infantry"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="555-123-4567"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stationCode">Recruiting Station *</Label>
              {stations.length > 0 ? (
                <SearchableSelect
                  options={stations.map((station) => ({
                    value: station.stationCode,
                    label: `${station.city}, ${station.state} (${station.stationCode})`,
                    searchText: `${station.city} ${station.state} ${station.stationCode} ${station.name}`,
                  }))}
                  value={formData.stationCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stationCode: value })
                  }
                  placeholder="Search by city, state, or code..."
                  searchPlaceholder="Type to search stations..."
                  emptyText="No stations found"
                />
              ) : (
                <div className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500">
                  Loading stations...
                </div>
              )}
              <p className="text-xs text-gray-600">
                Type to search for your recruiting station by city, state, or
                station code
              </p>
            </div>

            {formData.accountType === "station_commander" && (
              <div className="space-y-2">
                <Label htmlFor="justification">
                  Justification for Station Commander Access *
                </Label>
                <textarea
                  id="justification"
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="Please explain why you need station commander access (e.g., 'I am the station commander at XYZ recruiting station and need to oversee 5 recruiters...')"
                  value={formData.justification}
                  onChange={(e) =>
                    setFormData({ ...formData, justification: e.target.value })
                  }
                  required={formData.accountType === "station_commander"}
                />
                <p className="text-xs text-gray-600">
                  This helps our admin team review your request faster
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with mixed case and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <strong>UNCLASSIFIED</strong> - This system handles UNCLASSIFIED
              recruiting data only. Do not enter classified information.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-700 hover:underline font-medium"
              >
                Sign in
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
