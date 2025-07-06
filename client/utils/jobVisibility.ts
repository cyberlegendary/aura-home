import { User, Job } from "@shared/types";

export interface JobDetailsConfig {
  showFullDetails: boolean;
  visibleFields: {
    // Basic required fields for all roles
    category: boolean;
    spmNo: boolean;
    underwriter: boolean;
    claimStatus: boolean;

    // Additional details only for apollos/admins
    claimNo: boolean;
    policyNo: boolean;
    branch: boolean;
    broker: boolean;
    claimSpecialist: boolean;
    email: boolean;
    riskAddress: boolean;
    insuredName: boolean;
    insCell: boolean;
    insHometel: boolean;
    insEmail: boolean;
    sumInsured: boolean;
    incidentDate: boolean;
    descriptionOfLoss: boolean;
    claimEstimate: boolean;
    section: boolean;
    peril: boolean;
    excess: boolean;
    dateReported: boolean;
  };
}

/**
 * Determines what job details should be visible based on user role and location
 */
export function getJobDetailsConfig(user: User): JobDetailsConfig {
  const isAdmin = user.role === "admin";
  const isSupervisor = user.role === "supervisor";
  const isApollos =
    user.location?.city === "Cape Town" ||
    user.username?.toLowerCase().includes("apollos");

  // Apollos staff and admins see all details
  const showFullDetails = isAdmin || isSupervisor || isApollos;

  return {
    showFullDetails,
    visibleFields: {
      // Always visible to all roles
      category: true,
      spmNo: true,
      underwriter: true,
      claimStatus: true,

      // Only visible to apollos/admins
      claimNo: showFullDetails,
      policyNo: showFullDetails,
      branch: showFullDetails,
      broker: showFullDetails,
      claimSpecialist: showFullDetails,
      email: showFullDetails,
      riskAddress: showFullDetails,
      insuredName: showFullDetails,
      insCell: showFullDetails,
      insHometel: showFullDetails,
      insEmail: showFullDetails,
      sumInsured: showFullDetails,
      incidentDate: showFullDetails,
      descriptionOfLoss: showFullDetails,
      claimEstimate: showFullDetails,
      section: showFullDetails,
      peril: showFullDetails,
      excess: showFullDetails,
      dateReported: showFullDetails,
    },
  };
}

/**
 * Determines which forms are required vs optional
 */
export function getFormRequirements() {
  return {
    requiredForms: ["clearance"],
    optionalForms: ["liability", "absa", "sahl-certificate"],
  };
}

/**
 * Gets the maximum number of submissions allowed for a form
 */
export function getMaxSubmissions(formName: string): number {
  const formConfig: Record<string, number> = {
    liability: 3,
    absa: 3,
    "sahl-certificate": 3,
    clearance: 3,
    default: 3,
  };

  const formType = formName.toLowerCase().replace(/\s+/g, "-");
  return formConfig[formType] || formConfig.default;
}

/**
 * Checks if a form is required for job completion
 */
export function isFormRequired(formName: string): boolean {
  const requirements = getFormRequirements();
  const formType = formName.toLowerCase().replace(/\s+/g, "-");

  return requirements.requiredForms.some(
    (req) => formType.includes(req) || formName.toLowerCase().includes(req),
  );
}

/**
 * Gets visible job fields based on user permissions
 */
export function getVisibleJobFields(
  job: Job,
  config: JobDetailsConfig,
): Array<{ key: string; label: string; value: any }> {
  const allFields = [
    { key: "category", label: "Category", value: job.category },
    { key: "spmNo", label: "SPM No", value: job.spmNo },
    { key: "underwriter", label: "Underwriter", value: job.underwriter },
    { key: "claimStatus", label: "Claim Status", value: job.claimStatus },
    { key: "claimNo", label: "Claim No", value: job.claimNo },
    { key: "policyNo", label: "Policy No", value: job.policyNo },
    { key: "branch", label: "Branch", value: job.branch },
    { key: "broker", label: "Broker", value: job.broker },
    {
      key: "claimSpecialist",
      label: "Claim Specialist",
      value: job.claimSpecialist,
    },
    { key: "email", label: "Email", value: job.email },
    { key: "riskAddress", label: "Risk Address", value: job.riskAddress },
    { key: "insuredName", label: "Insured Name", value: job.insuredName },
    { key: "insCell", label: "Insured Cell", value: job.insCell },
    { key: "insHometel", label: "Insured Home/Tel", value: job.insHometel },
    { key: "insEmail", label: "Insured Email", value: job.insEmail },
    { key: "sumInsured", label: "Sum Insured", value: job.sumInsured },
    { key: "incidentDate", label: "Incident Date", value: job.incidentDate },
    {
      key: "descriptionOfLoss",
      label: "Description of Loss",
      value: job.descriptionOfLoss,
    },
    { key: "claimEstimate", label: "Claim Estimate", value: job.claimEstimate },
    { key: "section", label: "Section", value: job.section },
    { key: "peril", label: "Peril", value: job.peril },
    { key: "excess", label: "Excess", value: job.excess },
    { key: "dateReported", label: "Date Reported", value: job.dateReported },
  ];

  return allFields.filter(
    (field) =>
      config.visibleFields[field.key as keyof typeof config.visibleFields] &&
      field.value !== undefined &&
      field.value !== null &&
      field.value !== "",
  );
}

/**
 * Determines which jobs should be visible on calendar based on user role
 */
export function getCalendarVisibleJobs(jobs: Job[], user: User): Job[] {
  const isAdmin = user.role === "admin";
  const isSupervisor = user.role === "supervisor";
  const isApollos =
    user.location?.city === "Cape Town" ||
    user.username?.toLowerCase().includes("apollos");

  // Apollos and admins see all jobs
  if (isAdmin || isSupervisor || isApollos) {
    return jobs;
  }

  // Staff only see their own jobs
  return jobs.filter((job) => job.assignedTo === user.id);
}

/**
 * Determines if user can edit/update forms (apollos cannot update forms)
 */
export function canEditForms(user: User): boolean {
  const isAdmin = user.role === "admin";
  // Remove ability for apollos (supervisors) to update forms
  return isAdmin;
}
