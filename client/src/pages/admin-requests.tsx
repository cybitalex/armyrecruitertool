import { useEffect, useState } from "react";
import { useAuth, ProtectedRoute } from "../lib/auth-context";
import { admin } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, XCircle, Clock, AlertCircle, MapPin, Shield } from "lucide-react";
import { format } from "date-fns";

interface StationCommanderRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRank: string | null;
  userUnit: string | null;
  justification: string | null;
  status: string;
  createdAt: Date;
  requestedStationId: string | null;
  requestedStation: {
    id: string;
    name: string;
    stationCode: string;
    state: string;
  } | null;
}

interface StationChangeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentStationId: string | null;
  requestedStationId: string;
  reason: string;
  status: string;
  createdAt: Date;
  currentStation: {
    name: string;
    stationCode: string;
    state: string;
  } | null;
  requestedStation: {
    name: string;
    stationCode: string;
    state: string;
  };
}

function AdminRequestsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'commander' | 'station'>('commander');
  const [scRequests, setScRequests] = useState<StationCommanderRequest[]>([]);
  const [stationRequests, setStationRequests] = useState<StationChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Load station commander requests
      const scData = await admin.getStationCommanderRequests();
      setScRequests(scData.requests);
      
      // Load station change requests
      const stationData = await fetch("/api/admin/station-change-requests", {
        credentials: "include",
      });
      
      if (stationData.ok) {
        const stationRequests = await stationData.json();
        setStationRequests(stationRequests);
      }
      
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this station commander request?")) {
      return;
    }

    try {
      setProcessingId(requestId);
      await admin.approveStationCommanderRequest(requestId);
      await loadRequests(); // Reload the list
      alert("Request approved successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    const reason = prompt("Please provide a reason for denial (optional):");
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(requestId);
      await admin.denyStationCommanderRequest(requestId, reason || undefined);
      await loadRequests(); // Reload the list
      alert("Request denied successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deny request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveStationChange = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this station change request?")) {
      return;
    }

    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/admin/station-change-requests/${requestId}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      await loadRequests(); // Reload the list
      alert("Station change request approved successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDenyStationChange = async (requestId: string) => {
    const reason = prompt("Please provide a reason for denial (optional):");
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/admin/station-change-requests/${requestId}/deny`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (!response.ok) {
        throw new Error("Failed to deny request");
      }

      await loadRequests(); // Reload the list
      alert("Station change request denied successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deny request");
    } finally {
      setProcessingId(null);
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Admin access is required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const requests = activeTab === 'commander' ? scRequests : stationRequests;
  const isCommanderTab = activeTab === 'commander';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-green-800">
            Admin Dashboard - Requests Management
          </h1>
          <p className="text-sm text-gray-600">
            Review and approve/deny station commander and station change requests
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('commander')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'commander'
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Station Commander Requests
            {scRequests.length > 0 && (
              <Badge className="ml-2 bg-green-700">{scRequests.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('station')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'station'
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Station Change Requests
            {stationRequests.length > 0 && (
              <Badge className="ml-2 bg-green-700">{stationRequests.length}</Badge>
            )}
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending {isCommanderTab ? 'Station Commander' : 'Station Change'} Requests
            </CardTitle>
            <CardDescription>
              {isCommanderTab
                ? 'Review user requests for station commander privileges'
                : 'Review user requests to change their assigned station'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No pending requests</p>
                <p className="text-sm mt-2">
                  All {isCommanderTab ? 'station commander' : 'station change'} requests have been processed
                </p>
              </div>
            ) : isCommanderTab ? (
              <div className="space-y-4">
                {(requests as StationCommanderRequest[]).map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.userName}
                          </h3>
                          {request.userRank && (
                            <Badge variant="outline" className="text-xs">
                              {request.userRank}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <p>
                            <strong>Email:</strong> {request.userEmail}
                          </p>
                          {request.userUnit && (
                            <p>
                              <strong>Unit:</strong> {request.userUnit}
                            </p>
                          )}
                          <p>
                            <strong>Requested:</strong>{" "}
                            {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>

                        {request.requestedStation && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                            <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Requesting Command of:
                            </p>
                            <p className="text-sm font-semibold text-green-900">
                              {request.requestedStation.name}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              <span className="font-mono font-semibold">{request.requestedStation.stationCode}</span>
                              {' • '}
                              {request.requestedStation.state}
                            </p>
                          </div>
                        )}

                        {request.justification && (
                          <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Justification:
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {request.justification}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="bg-green-700 hover:bg-green-800 flex-1 md:flex-initial"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleDeny(request.id)}
                          disabled={processingId === request.id}
                          variant="destructive"
                          className="flex-1 md:flex-initial"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(requests as StationChangeRequest[]).map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.userName}
                          </h3>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <p>
                            <strong>Email:</strong> {request.userEmail}
                          </p>
                          <p>
                            <strong>Requested:</strong>{" "}
                            {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-xs font-medium text-red-700 mb-1">
                              Current Station:
                            </p>
                            {request.currentStation ? (
                              <>
                                <p className="text-sm font-semibold text-red-900">
                                  {request.currentStation.name}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                  <span className="font-mono">{request.currentStation.stationCode}</span>
                                  {' • '}
                                  {request.currentStation.state}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-red-600">No current station</p>
                            )}
                          </div>

                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-xs font-medium text-green-700 mb-1">
                              Requested Station:
                            </p>
                            <p className="text-sm font-semibold text-green-900">
                              {request.requestedStation.name}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              <span className="font-mono">{request.requestedStation.stationCode}</span>
                              {' • '}
                              {request.requestedStation.state}
                            </p>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Reason for Transfer:
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {request.reason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Button
                          onClick={() => handleApproveStationChange(request.id)}
                          disabled={processingId === request.id}
                          className="bg-green-700 hover:bg-green-800 flex-1 md:flex-initial"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleDenyStationChange(request.id)}
                          disabled={processingId === request.id}
                          variant="destructive"
                          className="flex-1 md:flex-initial"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminRequests() {
  return (
    <ProtectedRoute>
      <AdminRequestsContent />
    </ProtectedRoute>
  );
}

