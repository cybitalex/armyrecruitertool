import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ProtectedRoute } from "@/lib/auth-context";
import { insertRecruitSchema } from "@shared/schema";
import type { InsertRecruit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, FileText, Heart, Shield, User } from "lucide-react";

const steps = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "Contact & Address", icon: FileText },
  { id: 3, name: "Background", icon: Shield },
  { id: 4, name: "Physical Info", icon: Heart },
  { id: 5, name: "Preferences", icon: CheckCircle2 },
];

const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isSubmittingRef = useRef(false);

  const form = useForm<InsertRecruit>({
    mode: "onSubmit", // Only validate on submit, not on change
    resolver: zodResolver(
      insertRecruitSchema.extend({
        dateOfBirth: insertRecruitSchema.shape.dateOfBirth.refine(
          (date) => {
            const birthDate = new Date(date);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age >= 17 && age <= 42;
          },
          { message: "Age must be between 17 and 42 years" }
        ),
      })
    ),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      educationLevel: "",
      hasDriversLicense: "",
      hasPriorService: "no",
      priorServiceBranch: "",
      priorServiceYears: undefined,
      heightFeet: undefined,
      heightInches: undefined,
      weight: undefined,
      medicalConditions: "",
      criminalHistory: "no",
      preferredMOS: "",
      availability: "",
      additionalNotes: "",
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRecruit) => {
      // Don't send recruiterCode - backend will use logged-in recruiter's ID
      const { recruiterCode, ...submissionData } = data as any;
      return await apiRequest("POST", "/api/recruits", submissionData);
    },
    onSuccess: () => {
      isSubmittingRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      queryClient.invalidateQueries({ queryKey: ["/recruiter/stats"] }); // Refresh stats
      toast({
        title: "Application Submitted",
        description:
          "Your recruitment application has been successfully submitted.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      isSubmittingRef.current = false;
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRecruit) => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      return;
    }
    
    // Extra safety check: only allow submission when on the final step
    if (currentStep !== 5) {
      return;
    }
    
    isSubmittingRef.current = true;
    createMutation.mutate(data);
  };

  // Prevent all Enter key form submissions - form should only submit via explicit button click
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      const targetType = target.getAttribute("type");
      
      // Only allow Enter to submit if it's on the actual submit button
      if (targetType === "submit" || target.getAttribute("data-submit-button") === "true") {
        return; // Allow submission
      }
      
      // Prevent Enter from submitting the form in all other cases
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const hasPriorService = form.watch("hasPriorService");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
            U.S. Army Recruitment Application
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete all sections to submit your application
          </p>
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px] sm:min-w-0">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center border transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : isCompleted
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                      data-testid={`step-indicator-${step.id}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-center leading-tight hidden sm:block ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.name}
                    </span>
                    <span
                      className={`text-[9px] mt-1 font-medium text-center leading-tight sm:hidden ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                      title={step.name}
                    >
                      {step.name.split(" ")[0]}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 sm:mx-2 mb-6 transition-colors ${
                        isCompleted ? "bg-primary/30" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              // Prevent default form submission behavior
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={handleFormKeyDown}
            className="space-y-6"
          >
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Please provide your legal name and date of birth
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              {...field}
                              data-testid="input-firstName"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                              data-testid="input-lastName"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-middleName"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date of Birth * (Must be 17-42 years old)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-dateOfBirth"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Address Information</CardTitle>
                  <CardDescription>How can we reach you?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john.doe@email.com"
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 123-4567"
                              {...field}
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main Street"
                            {...field}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City"
                              {...field}
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345"
                              {...field}
                              data-testid="input-zipCode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Background Information</CardTitle>
                  <CardDescription>
                    Tell us about your education and service history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="educationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Highest Education Level *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-educationLevel">
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high_school">
                              High School Diploma/GED
                            </SelectItem>
                            <SelectItem value="some_college">
                              Some College
                            </SelectItem>
                            <SelectItem value="associate">
                              Associate Degree
                            </SelectItem>
                            <SelectItem value="bachelor">
                              Bachelor's Degree
                            </SelectItem>
                            <SelectItem value="master">
                              Master's Degree
                            </SelectItem>
                            <SelectItem value="doctorate">Doctorate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hasDriversLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Do you have a valid driver's license? *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-hasDriversLicense">
                              <SelectValue placeholder="Select yes or no" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hasPriorService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prior Military Service? *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-hasPriorService">
                              <SelectValue placeholder="Select yes or no" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {hasPriorService === "yes" && (
                    <>
                      <FormField
                        control={form.control}
                        name="priorServiceBranch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch of Prior Service</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-priorServiceBranch">
                                  <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="army">Army</SelectItem>
                                <SelectItem value="navy">Navy</SelectItem>
                                <SelectItem value="air_force">
                                  Air Force
                                </SelectItem>
                                <SelectItem value="marines">Marines</SelectItem>
                                <SelectItem value="coast_guard">
                                  Coast Guard
                                </SelectItem>
                                <SelectItem value="space_force">
                                  Space Force
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priorServiceYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Service</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Years"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                                value={field.value || ""}
                                data-testid="input-priorServiceYears"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <FormField
                    control={form.control}
                    name="criminalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any criminal history? *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-criminalHistory">
                              <SelectValue placeholder="Select yes or no" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Physical Information</CardTitle>
                  <CardDescription>
                    Physical fitness and health information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="heightFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (Feet) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                              value={field.value || ""}
                              data-testid="input-heightFeet"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="heightInches"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (Inches) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                              value={field.value || ""}
                              data-testid="input-heightInches"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="180"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                              value={field.value || ""}
                              data-testid="input-weight"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="medicalConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Conditions or Concerns</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any medical conditions, injuries, or health concerns (optional)"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-medicalConditions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferences & Availability</CardTitle>
                  <CardDescription>
                    Let us know your preferences and when you can start
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="preferredMOS"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Preferred Military Occupational Specialty (MOS)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Infantry, Military Intelligence, Logistics"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-preferredMOS"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          When are you available to start? *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger 
                              data-testid="select-availability"
                              className="w-full"
                            >
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent 
                            position="popper"
                            side="bottom"
                            align="start"
                            className="z-[100] w-[var(--radix-select-trigger-width)] max-h-[300px]"
                          >
                            <SelectItem value="immediate">
                              Immediately
                            </SelectItem>
                            <SelectItem value="1_month">
                              Within 1 Month
                            </SelectItem>
                            <SelectItem value="3_months">
                              Within 3 Months
                            </SelectItem>
                            <SelectItem value="6_months">
                              Within 6 Months
                            </SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information you'd like to share (optional)"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-additionalNotes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="button-prev"
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left order-first sm:order-none">
                Step {currentStep} of {steps.length}
              </div>
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  data-testid="button-next"
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                  className="w-full sm:w-auto"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                      // Manually trigger form validation
                      const isValid = await form.trigger();
                      
                      if (isValid) {
                        const data = form.getValues();
                        onSubmit(data as InsertRecruit);
                      } else {
                        toast({
                          title: "Validation Error",
                          description: "Please fill in all required fields correctly.",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "An unexpected error occurred",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {createMutation.isPending
                    ? "Submitting..."
                    : "Submit Application"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function IntakeFormPage() {
  return (
    <ProtectedRoute>
      <IntakeForm />
    </ProtectedRoute>
  );
}
