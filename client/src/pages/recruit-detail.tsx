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
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User, FileText, Save, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useState, useEffect } from "react";
import * as React from "react";

export default function RecruitDetail() {
  const [, params] = useRoute("/recruits/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    educationLevel: "",
    hasDriversLicense: "",
    hasPriorService: "",
    priorServiceBranch: "",
    priorServiceYears: "",
    preferredMOS: "",
    availability: "",
  });

  interface NoteEntry {
    note: string;
    author: string;
    authorName: string;
    timestamp: string;
  }

  const { data: recruit, isLoading } = useQuery<Recruit>({
    queryKey: ["/api/recruits", params?.id],
    enabled: !!params?.id,
  });

  // Parse notes history
  const notesHistory: NoteEntry[] = React.useMemo(() => {
    if (!recruit?.additionalNotes) return [];
    try {
      const parsed = JSON.parse(recruit.additionalNotes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // Old format - single note
      if (recruit.additionalNotes.trim()) {
        return [{
          note: recruit.additionalNotes,
          author: recruit.recruiterId,
          authorName: "Unknown",
          timestamp: new Date().toISOString()
        }];
      }
      return [];
    }
  }, [recruit]);

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

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return await apiRequest("PATCH", `/api/recruits/${id}/notes`, {
        additionalNotes: note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/recruits", params?.id],
      });
      setIsAddingNote(false);
      setNewNote("");
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Note",
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

  const updateRecruitInfoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/recruits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruits", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/shippers"] });
      toast({
        title: "Information Updated",
        description: "The recruit's information has been updated successfully.",
      });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    if (!recruit) return;
    setEditFormData({
      firstName: recruit.firstName,
      middleName: recruit.middleName || "",
      lastName: recruit.lastName,
      dateOfBirth: recruit.dateOfBirth || "",
      email: recruit.email,
      phone: recruit.phone,
      address: recruit.address,
      city: recruit.city,
      state: recruit.state,
      zipCode: recruit.zipCode,
      educationLevel: recruit.educationLevel,
      hasDriversLicense: recruit.hasDriversLicense,
      hasPriorService: recruit.hasPriorService,
      priorServiceBranch: recruit.priorServiceBranch || "",
      priorServiceYears: recruit.priorServiceYears?.toString() || "",
      preferredMOS: recruit.preferredMOS || "",
      availability: recruit.availability,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruit) return;
    updateRecruitInfoMutation.mutate({
      id: recruit.id,
      data: editFormData,
    });
  };

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
      contacted: { variant: "default", label: "Contacted" },
      qualified: { variant: "default", label: "Qualified" },
      disqualified: { variant: "destructive", label: "Disqualified" },
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
                <Badge 
                  variant={(recruit as any).shipDate ? "default" : "secondary"}
                  className={(recruit as any).shipDate ? "bg-green-600" : ""}
                >
                  {(recruit as any).shipDate ? "🚢 Shipping" : "📋 Not Shipping"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleEditClick}
                data-testid="button-editRecruit"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Info
              </Button>
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
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
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
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recruiter Notes History
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  data-testid="button-addNote"
                >
                  {isAddingNote ? "Cancel" : "Add Note"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingNote && (
                <div className="mb-4 p-4 border border-muted rounded-lg">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note about your interaction with this recruit (phone calls, meetings, concerns, follow-up tasks, etc.)"
                    className="min-h-[100px] mb-3"
                    data-testid="textarea-newNote"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewNote("");
                        setIsAddingNote(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addNoteMutation.mutate({ id: recruit.id, note: newNote })}
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      data-testid="button-saveNote"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Note
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {notesHistory.length > 0 ? (
                  [...notesHistory].reverse().map((entry, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-primary pl-4 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{entry.authorName}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {entry.note}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No notes yet. Click "Add Note" to add notes about your interactions with this recruit.
                  </p>
                )}
              </div>
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recruit Information</DialogTitle>
            <DialogDescription>
              Update all recruit details and information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, firstName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    type="text"
                    value={editFormData.middleName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, middleName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address</h3>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  type="text"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    value={editFormData.city}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, city: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    type="text"
                    value={editFormData.state}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, state: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={editFormData.zipCode}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, zipCode: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Education & Background */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Education & Background</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">Education Level *</Label>
                  <Select
                    value={editFormData.educationLevel}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, educationLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="some_college">Some College</SelectItem>
                      <SelectItem value="associates">Associate's Degree</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="graduate">Graduate Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasDriversLicense">Driver's License *</Label>
                  <Select
                    value={editFormData.hasDriversLicense}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, hasDriversLicense: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Military Service History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Military Service History</h3>
              <div className="space-y-2">
                <Label htmlFor="hasPriorService">Prior Military Service *</Label>
                <Select
                  value={editFormData.hasPriorService}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, hasPriorService: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editFormData.hasPriorService === "yes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priorServiceBranch">Branch</Label>
                    <Select
                      value={editFormData.priorServiceBranch}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, priorServiceBranch: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="army">Army</SelectItem>
                        <SelectItem value="navy">Navy</SelectItem>
                        <SelectItem value="air_force">Air Force</SelectItem>
                        <SelectItem value="marines">Marines</SelectItem>
                        <SelectItem value="coast_guard">Coast Guard</SelectItem>
                        <SelectItem value="space_force">Space Force</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priorServiceYears">Years of Service</Label>
                    <Input
                      id="priorServiceYears"
                      type="number"
                      min="0"
                      max="50"
                      value={editFormData.priorServiceYears}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, priorServiceYears: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preferences & Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preferences & Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredMOS">Preferred MOS</Label>
                  <Input
                    id="preferredMOS"
                    type="text"
                    value={editFormData.preferredMOS}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, preferredMOS: e.target.value })
                    }
                    placeholder="e.g., 11B, 68W"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Availability *</Label>
                  <Select
                    value={editFormData.availability}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediately">Immediately</SelectItem>
                      <SelectItem value="1_3_months">1-3 Months</SelectItem>
                      <SelectItem value="3_6_months">3-6 Months</SelectItem>
                      <SelectItem value="6_plus_months">6+ Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateRecruitInfoMutation.isPending}>
                {updateRecruitInfoMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
