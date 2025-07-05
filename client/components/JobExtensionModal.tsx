import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Clock, AlertCircle } from "lucide-react";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  scheduledDate?: string;
  endTime?: string;
}

interface JobExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onExtensionRequested?: () => void;
}

export function JobExtensionModal({
  open,
  onOpenChange,
  job,
  onExtensionRequested,
}: JobExtensionModalProps) {
  const [extensionData, setExtensionData] = useState({
    newEndDate: "",
    newEndTime: "",
    reason: "",
    additionalHours: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsLoading(true);
    setError("");

    try {
      if (!extensionData.reason.trim()) {
        throw new Error("Please provide a reason for the extension");
      }

      // Create a job note for the extension request
      const noteResponse = await fetch(`/api/jobs/${job.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: `EXTENSION REQUEST: ${extensionData.reason}${
            extensionData.newEndDate
              ? ` | New End Date: ${extensionData.newEndDate}`
              : ""
          }${
            extensionData.newEndTime
              ? ` | New End Time: ${extensionData.newEndTime}`
              : ""
          }${
            extensionData.additionalHours
              ? ` | Additional Hours: ${extensionData.additionalHours}`
              : ""
          }`,
          isExtensionRequest: true,
        }),
      });

      if (!noteResponse.ok) {
        throw new Error("Failed to submit extension request");
      }

      onExtensionRequested?.();
      onOpenChange(false);
      setExtensionData({
        newEndDate: "",
        newEndTime: "",
        reason: "",
        additionalHours: "",
      });
      setSelectedDate(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setExtensionData({
      ...extensionData,
      newEndDate: date ? date.toISOString().split("T")[0] : "",
    });
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Request Extension
          </DialogTitle>
          <DialogDescription>
            Request an extension for job {job.jobNumber} - {job.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current End Date</Label>
            <div className="text-sm text-muted-foreground">
              {job.scheduledDate
                ? format(new Date(job.scheduledDate), "PPP")
                : "Not scheduled"}
              {job.endTime && ` at ${job.endTime}`}
            </div>
          </div>

          <div className="space-y-2">
            <Label>New End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "PPP")
                    : "Pick a new date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEndTime">New End Time (Optional)</Label>
            <Input
              id="newEndTime"
              type="time"
              value={extensionData.newEndTime}
              onChange={(e) =>
                setExtensionData({
                  ...extensionData,
                  newEndTime: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalHours">
              Additional Hours Needed (Optional)
            </Label>
            <Input
              id="additionalHours"
              type="number"
              step="0.5"
              min="0"
              value={extensionData.additionalHours}
              onChange={(e) =>
                setExtensionData({
                  ...extensionData,
                  additionalHours: e.target.value,
                })
              }
              placeholder="e.g. 2.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extension *</Label>
            <Textarea
              id="reason"
              value={extensionData.reason}
              onChange={(e) =>
                setExtensionData({ ...extensionData, reason: e.target.value })
              }
              placeholder="Please explain why you need an extension..."
              rows={3}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Extension"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
