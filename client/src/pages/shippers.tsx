import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Ship, User, Calendar, MapPin, Briefcase, AlertCircle, Info, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Shipper {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shipDate: string;
  component: string | null;
  actualMOS: string | null;
  preferredMOS: string | null;
  status: string;
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterRank: string | null;
}

interface MOSDetails {
  id: string;
  mosCode: string;
  title: string;
  description: string | null;
  category: string;
  component: string | null;
  isOfficer: boolean;
}

export default function ShippersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShipper, setSelectedShipper] = useState<Shipper | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipperToDelete, setShipperToDelete] = useState<Shipper | null>(null);
  const [editFormData, setEditFormData] = useState({
    shipDate: "",
    component: "",
    actualMOS: "",
  });

  // Fetch shippers
  const { data: shippers = [], isLoading } = useQuery<Shipper[]>({
    queryKey: ["/api/shippers"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch MOS list
  const { data: mosList = [] } = useQuery<MOSDetails[]>({
    queryKey: ["/api/mos"],
    staleTime: Infinity, // MOS list doesn't change often
  });

  // Helper to get MOS details
  const getMOSDetails = (mosCode: string | null): MOSDetails | null => {
    if (!mosCode) return null;
    return mosList.find((m) => m.mosCode === mosCode.toUpperCase()) || null;
  };

  // Update shipping info mutation
  const updateShippingInfo = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/recruits/${id}/shipping`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shippers"] });
      toast({
        title: "Shipping Info Updated",
        description: "The recruit's shipping information has been updated successfully.",
      });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete shipper mutation
  const deleteShipper = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recruits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shippers"] });
      toast({
        title: "Shipper Deleted",
        description: "The recruit has been removed from the system.",
      });
      setDeleteDialogOpen(false);
      setShipperToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (shipper: Shipper) => {
    setSelectedShipper(shipper);
    setEditFormData({
      shipDate: shipper.shipDate || "",
      component: shipper.component || "",
      actualMOS: shipper.actualMOS || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipper) return;

    updateShippingInfo.mutate({
      id: selectedShipper.id,
      data: editFormData,
    });
  };

  const getDaysUntilShip = (shipDate: string) => {
    const days = Math.ceil(
      (new Date(shipDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "destructive";
    if (days <= 7) return "default";
    return "secondary";
  };

  // Sort shippers by ship date (earliest first)
  const sortedShippers = [...shippers].sort((a, b) => {
    return new Date(a.shipDate).getTime() - new Date(b.shipDate).getTime();
  });

  // Calculate statistics
  const totalShippers = shippers.length;
  const shippingNext7Days = shippers.filter(
    (s) => getDaysUntilShip(s.shipDate) <= 7
  ).length;
  const activeComponent = shippers.filter((s) => s.component === "active").length;
  const reserveComponent = shippers.filter((s) => s.component === "reserve").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shippers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Ship className="w-8 h-8 text-green-700" />
              Shippers Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Track recruits shipping to basic training
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedShipper(null);
              setEditFormData({ shipDate: "", component: "", actualMOS: "" });
              setEditDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shipper
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Shippers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalShippers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Next 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {shippingNext7Days}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Component
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{activeComponent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Reserve Component
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{reserveComponent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Shippers List */}
        {sortedShippers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                No shippers scheduled yet
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Recruit ship dates will appear here once assigned
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedShippers.map((shipper) => {
              const daysUntilShip = getDaysUntilShip(shipper.shipDate);
              const urgency = getUrgencyColor(daysUntilShip);

              return (
                <Card key={shipper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {shipper.firstName} {shipper.lastName}
                          </h3>
                          <Badge variant={urgency}>
                            {daysUntilShip === 0
                              ? "Ships Today"
                              : daysUntilShip === 1
                              ? "Ships Tomorrow"
                              : `${daysUntilShip} days`}
                          </Badge>
                          {shipper.component && (
                            <Badge variant={shipper.component === "active" ? "default" : "secondary"}>
                              {shipper.component.toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              <strong>Ship Date:</strong>{" "}
                              {new Date(shipper.shipDate).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              <strong>Recruiter:</strong> {shipper.recruiterRank}{" "}
                              {shipper.recruiterName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Briefcase className="w-4 h-4" />
                            <span>
                              <strong>MOS:</strong>{" "}
                              {shipper.actualMOS || shipper.preferredMOS ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted">
                                        {shipper.actualMOS || shipper.preferredMOS}
                                        <Info className="w-3 h-3 text-blue-500" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {(() => {
                                        const mosDetails = getMOSDetails(
                                          shipper.actualMOS || shipper.preferredMOS
                                        );
                                        if (mosDetails) {
                                          return (
                                            <div className="space-y-1">
                                              <p className="font-semibold">{mosDetails.title}</p>
                                              {mosDetails.description && (
                                                <p className="text-xs text-gray-300">
                                                  {mosDetails.description}
                                                </p>
                                              )}
                                              <p className="text-xs text-blue-300">
                                                Category: {mosDetails.category}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return <p>MOS details not available</p>;
                                      })()}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                "Not assigned"
                              )}
                            </span>
                          </div>
                          
                          {/* Mobile-friendly MOS details */}
                          <div className="md:hidden mt-2 p-2 bg-blue-50 rounded-md text-xs">
                            {(() => {
                              const mosDetails = getMOSDetails(
                                shipper.actualMOS || shipper.preferredMOS
                              );
                              if (mosDetails) {
                                return (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-blue-900">
                                      {mosDetails.title}
                                    </p>
                                    {mosDetails.description && (
                                      <p className="text-gray-700">
                                        {mosDetails.description}
                                      </p>
                                    )}
                                    <p className="text-blue-700">
                                      Category: {mosDetails.category}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              <strong>Phone:</strong> {shipper.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(shipper)}
                        >
                          Edit Info
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setShipperToDelete(shipper);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit/Add Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedShipper ? "Edit Shipping Information" : "Add New Shipper"}
              </DialogTitle>
              <DialogDescription>
                {selectedShipper
                  ? "Update the recruit's shipping details"
                  : "Add shipping information for an existing recruit"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {!selectedShipper && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  Note: To add a shipper, first create the recruit through "New Application", 
                  then assign their ship date here.
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="shipDate">Ship Date *</Label>
                <Input
                  id="shipDate"
                  type="date"
                  value={editFormData.shipDate}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, shipDate: e.target.value })
                  }
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="component">Component</Label>
                <Select
                  value={editFormData.component}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, component: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="reserve">Reserve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualMOS">Assigned MOS</Label>
                <Input
                  id="actualMOS"
                  type="text"
                  value={editFormData.actualMOS}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, actualMOS: e.target.value })
                  }
                  placeholder="e.g., 11B, 68W"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateShippingInfo.isPending}>
                  {updateShippingInfo.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipper?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>
                  {shipperToDelete?.firstName} {shipperToDelete?.lastName}
                </strong>
                ? This will remove all their information from the system. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (shipperToDelete) {
                    deleteShipper.mutate(shipperToDelete.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
