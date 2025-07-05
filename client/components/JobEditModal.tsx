import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedJobForm } from "@/components/EnhancedJobForm";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  assignedStaff?: string[];
  companyId?: string;
  location?: string;
  notes?: string;
}

interface JobEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobUpdated?: () => void;
}

export function JobEditModal({
  open,
  onOpenChange,
  job,
  onJobUpdated,
}: JobEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (updatedJob: Job) => {
    if (!job?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedJob),
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
      }

      onJobUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job - {job.jobNumber}</DialogTitle>
          <DialogDescription>
            Update the job details and settings.
          </DialogDescription>
        </DialogHeader>

        <EnhancedJobForm
          job={job}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
