import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import type { Recruit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function RecruitDetail() {
  const [, params] = useRoute("/recruits/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: recruit, isLoading } = useQuery<Recruit>({
    queryKey: ["/api/recruits", params?.id],
    enabled: !!params?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/recruits/${id}/status`, {
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/recruits", params?.id],
      });
      toast({
        title: "Status Updated",
        description: "The application status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/recruits/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      toast({
        title: "Application Deleted",
        description: "The recruit application has been removed.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">
          Loading application details...
        </div>
      </div>
    );
  }

  if (!recruit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            Application not found
          </div>
          <Button
            onClick={() => navigate("/")}
            data-testid="button-backToDashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "outline" | "destructive";
        label: string;
      }
    > = {
      pending: { variant: "secondary", label: "Pending" },
      reviewing: { variant: "default", label: "In Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {recruit.firstName}{" "}
                {recruit.middleName ? `${recruit.middleName} ` : ""}
                {recruit.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Submitted:{" "}
                  {new Date(recruit.submittedAt).toLocaleDateString()}
                </div>
                <div>{getStatusBadge(recruit.status)}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={recruit.status}
                onValueChange={(status) =>
                  updateStatusMutation.mutate({ id: recruit.id, status })
                }
              >
                <SelectTrigger
                  className="w-[180px]"
                  data-testid="select-updateStatus"
                >
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="button-deleteApplication"
              >
                Delete Application
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Full Name</div>
                <div className="font-medium" data-testid="detail-fullName">
                  {recruit.firstName}{" "}
                  {recruit.middleName ? `${recruit.middleName} ` : ""}
                  {recruit.lastName}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Date of Birth
                </div>
                <div className="font-medium" data-testid="detail-dateOfBirth">
                  {new Date(recruit.dateOfBirth).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Email Address
                </div>
                <div className="font-medium" data-testid="detail-email">
                  {recruit.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Phone Number
                </div>
                <div className="font-medium" data-testid="detail-phone">
                  {recruit.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Street Address
                </div>
                <div className="font-medium" data-testid="detail-address">
                  {recruit.address}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">City</div>
                  <div className="font-medium" data-testid="detail-city">
                    {recruit.city}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">State</div>
                  <div className="font-medium" data-testid="detail-state">
                    {recruit.state}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ZIP Code</div>
                  <div className="font-medium" data-testid="detail-zipCode">
                    {recruit.zipCode}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education & Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Education Level
                </div>
                <div
                  className="font-medium capitalize"
                  data-testid="detail-educationLevel"
                >
                  {recruit.educationLevel.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Driver's License
                </div>
                <div
                  className="font-medium capitalize"
                  data-testid="detail-hasDriversLicense"
                >
                  {recruit.hasDriversLicense}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Criminal History
                </div>
                <div
                  className="font-medium capitalize"
                  data-testid="detail-criminalHistory"
                >
                  {recruit.criminalHistory}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Military Service History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Prior Service
                </div>
                <div
                  className="font-medium capitalize"
                  data-testid="detail-hasPriorService"
                >
                  {recruit.hasPriorService}
                </div>
              </div>
              {recruit.hasPriorService === "yes" && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Branch</div>
                    <div
                      className="font-medium capitalize"
                      data-testid="detail-priorServiceBranch"
                    >
                      {recruit.priorServiceBranch?.replace(/_/g, " ") || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Years of Service
                    </div>
                    <div
                      className="font-medium"
                      data-testid="detail-priorServiceYears"
                    >
                      {recruit.priorServiceYears || "N/A"} years
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Physical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Height</div>
                <div className="font-medium" data-testid="detail-height">
                  {recruit.heightFeet}' {recruit.heightInches}"
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Weight</div>
                <div className="font-medium" data-testid="detail-weight">
                  {recruit.weight} lbs
                </div>
              </div>
              {recruit.medicalConditions && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Medical Conditions
                  </div>
                  <div
                    className="font-medium"
                    data-testid="detail-medicalConditions"
                  >
                    {recruit.medicalConditions}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Preferences & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Preferred MOS
                  </div>
                  <div
                    className="font-medium"
                    data-testid="detail-preferredMOS"
                  >
                    {recruit.preferredMOS || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Availability
                  </div>
                  <div
                    className="font-medium capitalize"
                    data-testid="detail-availability"
                  >
                    {recruit.availability.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
              {recruit.additionalNotes && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Additional Notes
                  </div>
                  <div
                    className="font-medium"
                    data-testid="detail-additionalNotes"
                  >
                    {recruit.additionalNotes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recruit application? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelDeleteDialog">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(recruit.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmDeleteDialog"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
