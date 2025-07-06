import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Company, Form, CreateJobRequest } from "@shared/types";
import {
  Loader2,
  Upload,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { parseJobText, type ParsedJobData } from "@/utils/textParser";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSmartJobSuggestions,
  type JobSuggestion,
} from "@/utils/smartJobAssignment";

interface EnhancedCreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
  selectedJobTime?: {
    time: string;
    date: Date;
    staffId?: string;
  } | null;
}

export function EnhancedCreateJobModal({
  open,
  onOpenChange,
  onJobCreated,
  selectedJobTime,
}: EnhancedCreateJobModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [parsedData, setParsedData] = useState<any>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [jobData, setJobData] = useState<CreateJobRequest>({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: new Date().toISOString().split("T")[0],
    category: undefined,
    categoryOther: "",
  });

  const [timeDetails, setTimeDetails] = useState({
    time: selectedJobTime?.time || "09:00",
    duration: 60, // minutes
    endTime: "",
  });

  const [rawText, setRawText] = useState("");
  const [parseLoading, setParseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [smartSuggestions, setSmartSuggestions] = useState<JobSuggestion[]>([]);

  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";
  const canSetTime = isAdmin || isSupervisor;

  useEffect(() => {
    if (open) {
      fetchData();
      setError(null);
      setParsedData(null);
      setRawText("");
      setActiveTab("manual");
      setDuplicateWarning(null);

      if (selectedJobTime) {
        const scheduledDate = selectedJobTime.date.toISOString().split("T")[0];
        const scheduledTime = selectedJobTime.time;

        setJobData((prev) => ({
          ...prev,
          dueDate: scheduledDate,
          assignedTo: selectedJobTime.staffId || "",
        }));

        setTimeDetails((prev) => ({
          ...prev,
          time: scheduledTime,
        }));
      }
    }
  }, [open, selectedJobTime]);

  useEffect(() => {
    // Calculate end time when time or duration changes
    if (timeDetails.time && timeDetails.duration) {
      const [hours, minutes] = timeDetails.time.split(":").map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + timeDetails.duration;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
      setTimeDetails((prev) => ({ ...prev, endTime }));
    }
  }, [timeDetails.time, timeDetails.duration]);

  useEffect(() => {
    // Check for duplicate job allocations
    if (jobData.assignedTo && jobData.dueDate && timeDetails.time) {
      checkForDuplicates();
    }
  }, [jobData.assignedTo, jobData.dueDate, timeDetails.time]);

  useEffect(() => {
    // Calculate smart suggestions when parsed data has location
    if (parsedData?.riskAddress && staff.length > 0) {
      calculateSmartSuggestions();
    }
  }, [parsedData?.riskAddress, staff]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [staffRes, companiesRes, formsRes] = await Promise.all([
        fetch("/api/auth/users", { headers }),
        fetch("/api/companies", { headers }),
        fetch("/api/forms", { headers }),
      ]);

      const [staffData, companiesData, formsData] = await Promise.all([
        staffRes.json(),
        companiesRes.json(),
        formsRes.json(),
      ]);

      setStaff(staffData.filter((u: User) => u.role === "staff"));
      setCompanies(companiesData);
      setForms(formsData);
    } catch (error) {
      setError("Failed to load form data");
      console.error("Error fetching data:", error);
    }
  };

  const checkForDuplicates = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(
        `/api/jobs?assignedTo=${jobData.assignedTo}&date=${jobData.dueDate}`,
        { headers },
      );

      if (response.ok) {
        const existingJobs = await response.json();
        const sameTimeJobs = existingJobs.filter((job: any) => {
          if (!job.dueDate) return false;
          const jobTime = new Date(job.dueDate).toTimeString().slice(0, 5);
          return jobTime === timeDetails.time;
        });

        if (sameTimeJobs.length > 0) {
          setDuplicateWarning(
            `Warning: ${sameTimeJobs.length} job(s) already assigned to this staff member at ${timeDetails.time} on ${jobData.dueDate}. Email notification will be sent.`,
          );
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
    }
  };

  const calculateSmartSuggestions = async () => {
    if (!parsedData?.riskAddress) return;

    try {
      // Convert address to coordinates (in a real app, use geocoding service)
      // For now, use mock coordinates based on city
      let coordinates = { lat: -26.1076, lng: 28.0567 }; // Default Johannesburg

      if (
        parsedData.riskAddress.toLowerCase().includes("cape town") ||
        parsedData.riskAddress.toLowerCase().includes("cape") ||
        parsedData.riskAddress.toLowerCase().includes("western cape")
      ) {
        coordinates = { lat: -33.8903, lng: 18.4979 }; // Cape Town
      }

      // Fetch current jobs for workload calculation
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const jobsResponse = await fetch("/api/jobs", { headers });
      const allJobs = jobsResponse.ok ? await jobsResponse.json() : [];

      const suggestions = getSmartJobSuggestions(coordinates, staff, allJobs);
      setSmartSuggestions(suggestions.slice(0, 3)); // Show top 3 suggestions

      // Auto-assign best suggestion if no staff is selected
      if (!jobData.assignedTo && suggestions.length > 0) {
        setJobData((prev) => ({
          ...prev,
          assignedTo: suggestions[0].staffMember.id,
        }));
      }
    } catch (error) {
      console.error("Failed to calculate smart suggestions:", error);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 5; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!jobData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!jobData.assignedTo) {
      setError("Please assign the job to a staff member");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Combine date and time for dueDate
      const dueDateTime = new Date(`${jobData.dueDate}T${timeDetails.time}:00`);

      const jobPayload = {
        ...jobData,
        dueDate: dueDateTime.toISOString(),
        duration: timeDetails.duration,
        endTime: new Date(
          `${jobData.dueDate}T${timeDetails.endTime}:00`,
        ).toISOString(),
        rawText: rawText || undefined,
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(jobPayload),
      });

      if (response.ok) {
        // Send email notification if duplicate detected
        if (duplicateWarning) {
          await sendDuplicateNotification();
        }

        onJobCreated();
        onOpenChange(false);

        // Reset form
        setJobData({
          title: "",
          description: "",
          assignedTo: "",
          priority: "medium",
          dueDate: new Date().toISOString().split("T")[0],
          category: undefined,
          categoryOther: "",
        });
        setTimeDetails({
          time: "09:00",
          duration: 60,
          endTime: "",
        });
        setRawText("");
        setParsedData(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create job");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const sendDuplicateNotification = async () => {
    try {
      const staffMember = staff.find((s) => s.id === jobData.assignedTo);
      const notification = {
        subject: "Double Job Allocation Alert",
        message: `Double job allocation detected for ${staffMember?.name} on ${jobData.dueDate} at ${timeDetails.time}. Please adjust if possible.`,
        timestamp: new Date().toISOString(),
      };

      // In real implementation, this would send an actual email
      console.log("Email notification:", notification);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Create a new job assignment with precise timing controls
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          {/* Basic Job Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={jobData.title}
                onChange={(e) =>
                  setJobData({ ...jobData, title: e.target.value })
                }
                placeholder="Enter job title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={jobData.priority}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setJobData({ ...jobData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Job Category</Label>
              <Select
                value={jobData.category || ""}
                onValueChange={(value) =>
                  setJobData({
                    ...jobData,
                    category: value as any,
                    categoryOther:
                      value !== "Other" ? "" : jobData.categoryOther,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Geyser Assessment">
                    Geyser Assessment
                  </SelectItem>
                  <SelectItem value="Geyser Replacement">
                    Geyser Replacement
                  </SelectItem>
                  <SelectItem value="Leak Detection">Leak Detection</SelectItem>
                  <SelectItem value="Drain Blockage">Drain Blockage</SelectItem>
                  <SelectItem value="Camera Inspection">
                    Camera Inspection
                  </SelectItem>
                  <SelectItem value="Toilet/Shower">Toilet/Shower</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="assignedTo">Assign to Staff</Label>
                {smartSuggestions.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Smart Suggestions
                  </Badge>
                )}
              </div>
              <Select
                value={jobData.assignedTo}
                onValueChange={(value) =>
                  setJobData({ ...jobData, assignedTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} -{" "}
                      {typeof member.location === "string"
                        ? member.location
                        : member.location?.city || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Smart Suggestions Display */}
              {smartSuggestions.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Recommended Staff (by proximity & availability)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {smartSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.staffMember.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          jobData.assignedTo === suggestion.staffMember.id
                            ? "bg-blue-100 border border-blue-300"
                            : "bg-white hover:bg-blue-50"
                        }`}
                        onClick={() =>
                          setJobData((prev) => ({
                            ...prev,
                            assignedTo: suggestion.staffMember.id,
                          }))
                        }
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {index === 0 && "🥇"}{" "}
                              {suggestion.staffMember.name}
                            </span>
                            <Badge
                              variant={index === 0 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {suggestion.distance.toFixed(1)}km
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {suggestion.travelTime.toFixed(0)}min travel
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {jobData.category === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="categoryOther">Specify Category</Label>
              <Input
                id="categoryOther"
                value={jobData.categoryOther || ""}
                onChange={(e) =>
                  setJobData({ ...jobData, categoryOther: e.target.value })
                }
                placeholder="Please specify the job category"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={jobData.description}
              onChange={(e) =>
                setJobData({ ...jobData, description: e.target.value })
              }
              placeholder="Enter job description"
              required
            />
          </div>

          {/* Enhanced Time Controls */}
          {canSetTime && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">
                  Time & Duration Settings
                </h3>
                <Badge variant="outline">Admin/Supervisor Only</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={jobData.dueDate}
                    onChange={(e) =>
                      setJobData({ ...jobData, dueDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={timeDetails.time}
                    onValueChange={(value) =>
                      setTimeDetails({ ...timeDetails, time: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-40">
                      {generateTimeOptions().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={timeDetails.duration}
                    onChange={(e) =>
                      setTimeDetails({
                        ...timeDetails,
                        duration: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
              </div>

              <div className="text-sm text-blue-700">
                <strong>End Time:</strong> {timeDetails.endTime} (
                {timeDetails.duration} minutes duration)
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
