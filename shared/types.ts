export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff" | "supervisor";
  name: string;
  createdAt: string;
  location?: {
    city: "Johannesburg" | "Cape Town";
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  schedule?: {
    workingLateShift?: boolean;
    shiftStartTime?: string; // Default 05:00
    shiftEndTime?: string; // Default based on late shift or not
    weekType?: "normal" | "late"; // Alternating weeks
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "checkbox";
  label: string;
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
  defaultValue?: string;
  autoFillFrom?: string; // Auto-fill from job data
  readonly?: boolean; // Read-only field
  autoCalculate?: boolean; // Auto-calculate based on other fields
  dependsOn?: string; // Field dependency
  showWhen?: string; // Show when dependent field has this value
  section?: "staff" | "client"; // Which section this field belongs to
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  isTemplate: boolean;
  restrictedToCompanies?: string[]; // Company IDs, empty means available to all
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  isRequired?: boolean; // Whether this form is required for job completion
  maxSubmissions?: number; // Maximum number of times this form can be submitted per job (default: 1)
  formType?: "liability" | "absa" | "sahl-certificate" | "clearance" | "other"; // Form category
}

export interface Job {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Staff user ID
  assignedBy: string; // Admin user ID
  companyId?: string;
  formId?: string;
  formIds?: string[]; // Multiple forms can be assigned to a job
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  carryOver?: boolean;
  notes?: string;
  category?:
    | "Geyser Assessment"
    | "Geyser Replacement"
    | "Leak Detection"
    | "Drain Blockage"
    | "Camera Inspection"
    | "Toilet/Shower"
    | "Other";
  categoryOther?: string; // When category is "Other"
  pricing?: {
    type: "call-out" | "repair" | "replacement";
    amount: number;
    staffId?: string; // For staff-specific pricing
  };
  isAssisting?: boolean; // True if staff is assisting another staff member

  // Parsed job data fields
  claimNo?: string;
  policyNo?: string;
  spmNo?: string;
  underwriter?: string;
  branch?: string;
  broker?: string;
  claimSpecialist?: string;
  email?: string;
  riskAddress?: string;
  claimStatus?: string;
  insuredName?: string;
  insCell?: string;
  insHometel?: string;
  insEmail?: string;
  sumInsured?: number;
  incidentDate?: string;
  descriptionOfLoss?: string;
  claimEstimate?: number;
  section?: string;
  peril?: string;
  excess?: string;
  dateReported?: string;

  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  jobId: string;
  formId: string;
  submittedBy: string; // Staff user ID
  data: Record<string, any>; // Form field values
  submittedAt: string;
  submissionNumber?: number; // Which submission this is (1, 2, 3, etc.)
  version?: string; // Version identifier for multiple submissions
}

export interface ParsedJobData {
  claimNo?: string;
  policyNo?: string;
  spmNo?: string;
  underwriter?: string;
  branch?: string;
  broker?: string;
  claimSpecialist?: string;
  email?: string;
  riskAddress?: string;
  claimStatus?: string;
  insuredName?: string;
  insCell?: string;
  insHometel?: string;
  insEmail?: string;
  sumInsured?: number;
  incidentDate?: string;
  descriptionOfLoss?: string;
  claimEstimate?: number;
  section?: string;
  peril?: string;
  excess?: string;
  dateReported?: string;
  [key: string]: any;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  assignedTo: string;
  companyId?: string;
  formId?: string;
  formIds?: string[]; // Multiple forms can be assigned
  priority: "low" | "medium" | "high";
  dueDate?: string;
  rawText?: string; // For parsing
  category?:
    | "Geyser Assessment"
    | "Geyser Replacement"
    | "Leak Detection"
    | "Drain Blockage"
    | "Camera Inspection"
    | "Toilet/Shower"
    | "Other";
  categoryOther?: string; // When category is "Other"
}

export interface CreateFormRequest {
  name: string;
  description?: string;
  fields: Omit<FormField, "id">[];
  isTemplate: boolean;
  restrictedToCompanies?: string[];
  rawSchema?: string; // For parsing
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  companyId?: string;
  formId?: string;
  status?: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}

export interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalStaff: number;
  totalForms: number;
}
