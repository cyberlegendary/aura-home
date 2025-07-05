import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job, User } from "@shared/types";
import { EnhancedCalendarGrid } from "./EnhancedCalendarGrid";
import { JobDetailsModal } from "./JobDetailsModal";

interface StaffCalendarViewProps {
  jobs: Job[];
  staff?: User[];
  onJobClick?: (job: Job) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  selectedStaffId?: string;
  onStaffChange?: (staffId: string) => void;
}

export function StaffCalendarView({
  jobs,
  staff = [],
  onJobClick,
  selectedDate = new Date(),
  onDateChange,
  selectedStaffId,
  onStaffChange,
}: StaffCalendarViewProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Create a mock current user for the calendar (since StaffCalendarView doesn't receive currentUser)
  const mockCurrentUser: any = {
    id: "current-user",
    role: "staff",
    name: "Current User",
    username: "current",
    email: "user@example.com",
    createdAt: new Date().toISOString(),
  };

  // Filter jobs by selected staff
  const filteredJobs = selectedStaffId
    ? jobs.filter(
        (job) =>
          job.assignedTo === selectedStaffId ||
          job.assignedStaff?.includes(selectedStaffId),
      )
    : jobs;

  return (
    <div className="space-y-4">
      {/* Staff Filter */}
      {staff.length > 0 && (
        <div className="flex items-center justify-between">
          <Select
            value={selectedStaffId || "all"}
            onValueChange={onStaffChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">
            {selectedStaffId
              ? `${filteredJobs.length} jobs`
              : `${jobs.length} total jobs`}
          </Badge>
        </div>
      )}

      {/* Enhanced Calendar Grid */}
      <EnhancedCalendarGrid
        jobs={filteredJobs}
        staff={staff}
        currentUser={mockCurrentUser}
        onJobClick={(job) => {
          setSelectedJob(job);
          onJobClick?.(job);
        }}
        onJobDoubleClick={(job) => {
          setSelectedJob(job);
          setShowJobDetails(true);
        }}
        showJobActions={false}
        initialView="month"
      />

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          onSave={() => setShowJobDetails(false)}
          currentUser={mockCurrentUser}
        />
      )}
    </div>
  );
}
