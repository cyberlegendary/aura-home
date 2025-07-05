import React, { useState } from "react";
import { Job, User } from "@shared/types";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { EnhancedCalendarGrid } from "./EnhancedCalendarGrid";
import { JobDetailsModal } from "./JobDetailsModal";

interface AdvancedStaffCalendarViewProps {
  jobs: Job[];
  staff: User[];
  onJobUpdate?: (jobId: string, updates: Partial<Job>) => void;
  onJobClick?: (job: Job) => void;
  currentUser: User;
  selectedStaffId?: string;
  onStaffChange?: (staffId: string) => void;
}

interface JobActionModalData {
  job: Job;
  action: "move" | "cancel" | "comeback" | "repair";
  isOpen: boolean;
}

export function AdvancedStaffCalendarView({
  jobs,
  staff,
  onJobUpdate,
  onJobClick,
  currentUser,
  selectedStaffId,
  onStaffChange,
}: AdvancedStaffCalendarViewProps) {
  const [actionModal, setActionModal] = useState<JobActionModalData>({
    job: {} as Job,
    action: "move",
    isOpen: false,
  });
  const [newDate, setNewDate] = useState<Date>(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  const canEditJobs =
    currentUser.role === "admin" ||
    currentUser.role === "supervisor" ||
    currentUser.location?.city === "Cape Town";

  const filteredJobs = selectedStaffId
    ? jobs.filter((job) => job.assignedTo === selectedStaffId)
    : jobs;

  const staffOptions = staff.filter(
    (s) =>
      currentUser.role === "admin" ||
      currentUser.role === "supervisor" ||
      currentUser.location?.city === "Cape Town",
  );

  const handleJobAction = (
    job: Job,
    action: "move" | "cancel" | "comeback" | "repair" | "extend",
  ) => {
    setActionModal({ job, action: action as any, isOpen: true });
  };

  const handleActionConfirm = async () => {
    const { job, action } = actionModal;

    try {
      const updates: Partial<Job> = {};

      switch (action) {
        case "move":
          updates.scheduledDate = newDate.toISOString();
          break;
        case "cancel":
          updates.status = "cancelled" as any;
          updates.notes =
            (job.notes || "") + "\n[CANCELLED] " + new Date().toISOString();
          break;
        case "comeback":
          updates.scheduledDate = newDate.toISOString();
          updates.status = "pending";
          updates.notes =
            (job.notes || "") +
            "\n[COMEBACK SCHEDULED] " +
            format(newDate, "yyyy-MM-dd");
          break;
        case "repair":
          updates.scheduledDate = newDate.toISOString();
          updates.status = "pending";
          updates.category = "Geyser Replacement";
          updates.notes =
            (job.notes || "") +
            "\n[REPAIR SCHEDULED] " +
            format(newDate, "yyyy-MM-dd");
          break;
      }

      if (onJobUpdate) {
        onJobUpdate(job.id, updates);
      }

      setActionModal({ job: {} as Job, action: "move", isOpen: false });
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Staff Filter */}
      {staffOptions.length > 0 && (
        <div className="flex justify-end">
          <Select
            value={selectedStaffId || "all"}
            onValueChange={onStaffChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.location?.city || "Unknown"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Enhanced Calendar Grid */}
      <EnhancedCalendarGrid
        jobs={filteredJobs}
        staff={staff}
        currentUser={currentUser}
        onJobClick={(job) => {
          setSelectedJob(job);
          onJobClick?.(job);
        }}
        onJobDoubleClick={(job) => {
          setSelectedJob(job);
          setShowJobDetails(true);
        }}
        onJobAction={handleJobAction}
        showJobActions={canEditJobs}
        initialView="week"
      />

      {/* Job Action Modal */}
      <Dialog
        open={actionModal.isOpen}
        onOpenChange={(open) =>
          setActionModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionModal.action === "move" && "Move Job"}
              {actionModal.action === "cancel" && "Cancel Job"}
              {actionModal.action === "comeback" && "Schedule Comeback"}
              {actionModal.action === "repair" && "Schedule Repair"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">
                Job: {actionModal.job.title}
              </span>
            </div>

            {actionModal.action !== "cancel" && (
              <div>
                <span className="text-sm font-medium">Select New Date</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-2"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDate}
                      onSelect={(date) => date && setNewDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {actionModal.action === "cancel" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    This will cancel the job permanently
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleActionConfirm}
              variant={
                actionModal.action === "cancel" ? "destructive" : "default"
              }
            >
              Confirm {actionModal.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          onSave={(updates) => {
            if (onJobUpdate) {
              onJobUpdate(selectedJob.id, updates);
            }
            setShowJobDetails(false);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
