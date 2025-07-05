// Extended job status types for advanced calendar functionality
export type JobStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed"
  | "comeback_scheduled"
  | "repair_scheduled";

export interface JobStatusAction {
  type: "move" | "cancel" | "comeback" | "repair" | "extend";
  newDate?: Date;
  notes?: string;
  duration?: number; // for extensions, in minutes
}

export interface JobTimeExtension {
  requestedBy: string; // user ID
  requestedAt: string; // ISO date
  duration: number; // minutes
  reason?: string;
  approvedBy?: string; // user ID
  approvedAt?: string; // ISO date
  status: "pending" | "approved" | "rejected";
}

// Update the main Job interface in types.ts to include these fields
export interface ExtendedJob {
  timeExtensions?: JobTimeExtension[];
  statusHistory?: Array<{
    status: JobStatus;
    changedBy: string;
    changedAt: string;
    notes?: string;
  }>;
  originalScheduledDate?: string; // for tracking rescheduled jobs
  estimatedTravelTime?: number; // in minutes
  actualStartTime?: string;
  actualEndTime?: string;
}
