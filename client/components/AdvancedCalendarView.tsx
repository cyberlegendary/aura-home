import React, { useState } from "react";
import { Job, User } from "@shared/types";
import { EnhancedCalendarGrid } from "./EnhancedCalendarGrid";
import { JobDetailsModal } from "./JobDetailsModal";

interface AdvancedCalendarViewProps {
  jobs: Job[];
  staff: User[];
  onCreateJob: (timeSlot: string, date: Date) => void;
  onMoveJob: (jobId: string, newTime: string, newDate: Date) => void;
  onExtendJob: (jobId: string, duration: number) => void;
}

export function AdvancedCalendarView({
  jobs,
  staff,
  onCreateJob,
  onMoveJob,
  onExtendJob,
}: AdvancedCalendarViewProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Create a mock current user for the calendar
  const mockCurrentUser: any = {
    id: "admin-user",
    role: "admin",
    name: "Admin User",
    username: "admin",
    email: "admin@example.com",
    createdAt: new Date().toISOString(),
  };

  const handleJobAction = (
    action: "move" | "cancel" | "comeback" | "repair" | "extend",
    job: Job,
  ) => {
    switch (action) {
      case "extend":
        onExtendJob(job.id, 60); // Extend by 1 hour by default
        break;
      case "move":
        // For move action, you might want to show a date picker
        // For now, just move to next day as example
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        onMoveJob(job.id, job.startTime || "09:00", nextDay);
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Calendar Grid */}
      <EnhancedCalendarGrid
        jobs={jobs}
        staff={staff}
        currentUser={mockCurrentUser}
        onJobClick={(job) => {
          setSelectedJob(job);
        }}
        onJobDoubleClick={(job) => {
          setSelectedJob(job);
          setShowJobDetails(true);
        }}
        onJobAction={handleJobAction}
        showJobActions={true}
        initialView="week"
      />

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          onSave={(updates) => {
            // Handle job updates here
            setShowJobDetails(false);
          }}
          currentUser={mockCurrentUser}
        />
      )}
    </div>
  );
}
