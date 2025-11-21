import * as XLSX from "xlsx";
import type { Recruit, QrSurveyResponse } from "@shared/schema";

export function exportContactsToExcel(
  recruits: Recruit[],
  surveyResponses: QrSurveyResponse[]
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // ============ RECRUITS/APPLICANTS SECTION ============
  if (recruits.length > 0) {
    // Define headers for recruits
    const recruitHeaders = [
      "First Name",
      "Last Name",
      "Middle Name",
      "Date of Birth",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "ZIP Code",
      "Education Level",
      "Driver's License",
      "Prior Service",
      "Prior Service Branch",
      "Prior Service Years",
      "Height (Feet)",
      "Height (Inches)",
      "Weight (lbs)",
      "Medical Conditions",
      "Criminal History",
      "Preferred MOS",
      "Availability",
      "Additional Notes",
      "Status",
      "Source",
      "Submitted Date",
    ];

    // Map recruit data to rows
    const recruitRows = recruits.map((recruit) => [
      recruit.firstName || "",
      recruit.lastName || "",
      recruit.middleName || "",
      recruit.dateOfBirth ? new Date(recruit.dateOfBirth).toLocaleDateString() : "",
      recruit.email || "",
      recruit.phone || "",
      recruit.address || "",
      recruit.city || "",
      recruit.state || "",
      recruit.zipCode || "",
      recruit.educationLevel || "",
      recruit.hasDriversLicense || "",
      recruit.hasPriorService || "",
      recruit.priorServiceBranch || "",
      recruit.priorServiceYears || "",
      recruit.heightFeet || "",
      recruit.heightInches || "",
      recruit.weight || "",
      recruit.medicalConditions || "",
      recruit.criminalHistory || "",
      recruit.preferredMOS || "",
      recruit.availability || "",
      recruit.additionalNotes || "",
      recruit.status || "",
      recruit.source === "qr_code" ? "QR Code" : "Direct",
      recruit.submittedAt ? new Date(recruit.submittedAt).toLocaleString() : "",
    ]);

    // Create worksheet for recruits
    const recruitWorksheet = XLSX.utils.aoa_to_sheet([
      recruitHeaders,
      ...recruitRows,
    ]);

    // Set column widths for recruits
    recruitWorksheet["!cols"] = [
      { wch: 12 }, // First Name
      { wch: 12 }, // Last Name
      { wch: 12 }, // Middle Name
      { wch: 12 }, // Date of Birth
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // Address
      { wch: 15 }, // City
      { wch: 8 },  // State
      { wch: 10 }, // ZIP Code
      { wch: 18 }, // Education Level
      { wch: 12 }, // Driver's License
      { wch: 12 }, // Prior Service
      { wch: 18 }, // Prior Service Branch
      { wch: 15 }, // Prior Service Years
      { wch: 12 }, // Height Feet
      { wch: 12 }, // Height Inches
      { wch: 12 }, // Weight
      { wch: 25 }, // Medical Conditions
      { wch: 15 }, // Criminal History
      { wch: 25 }, // Preferred MOS
      { wch: 15 }, // Availability
      { wch: 30 }, // Additional Notes
      { wch: 12 }, // Status
      { wch: 10 }, // Source
      { wch: 20 }, // Submitted Date
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, recruitWorksheet, "Applicants");
  }

  // ============ SURVEY RESPONSES SECTION ============
  if (surveyResponses.length > 0) {
    // Define headers for survey responses
    const surveyHeaders = [
      "Name",
      "Email",
      "Phone",
      "Rating (1-5)",
      "Feedback",
      "Source",
      "Submitted Date",
    ];

    // Map survey response data to rows
    const surveyRows = surveyResponses.map((response) => [
      response.name || "",
      response.email || "",
      response.phone || "",
      response.rating || "",
      response.feedback || "",
      response.source || "presentation",
      response.createdAt
        ? new Date(response.createdAt).toLocaleString()
        : "",
    ]);

    // Create worksheet for survey responses
    const surveyWorksheet = XLSX.utils.aoa_to_sheet([
      surveyHeaders,
      ...surveyRows,
    ]);

    // Set column widths for survey responses
    surveyWorksheet["!cols"] = [
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 12 }, // Rating
      { wch: 40 }, // Feedback
      { wch: 15 }, // Source
      { wch: 20 }, // Submitted Date
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      workbook,
      surveyWorksheet,
      "Survey Responses"
    );
  }

  // Generate filename with current date
  const filename = `army-recruiter-contacts-${new Date()
    .toISOString()
    .split("T")[0]}.xlsx`;

  // Write the workbook to a file and trigger download
  XLSX.writeFile(workbook, filename);
}

