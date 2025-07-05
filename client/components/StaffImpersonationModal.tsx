import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  Briefcase,
  Eye,
  Edit3,
} from "lucide-react";
import { User as UserType, Job, Form, FormSubmission } from "@shared/types";
import { JobDetailsModal } from "./JobDetailsModal";
import { EnhancedFormFillPageComponent } from "./EnhancedFormFillPageComponent";

interface StaffImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStaff: UserType;
  currentUser: UserType;
}

export function StaffImpersonationModal({
  isOpen,
  onClose,
  selectedStaff,
  currentUser,
}: StaffImpersonationModalProps) {
  const [staffJobs, setStaffJobs] = useState<Job[]>([]);
  const [availableForms, setAvailableForms] = useState<Form[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showFormFill, setShowFormFill] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && selectedStaff) {
      fetchStaffData();
    }
  }, [isOpen, selectedStaff]);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch staff jobs
      const jobsResponse = await fetch(
        `/api/jobs?assignedTo=${selectedStaff.id}`,
        {
          headers,
        },
      );
      const jobsData = await jobsResponse.json();
      setStaffJobs(jobsData);

      // Fetch available forms
      const formsResponse = await fetch("/api/forms", { headers });
      const formsData = await formsResponse.json();
      setAvailableForms(formsData);

      // Fetch form submissions for this staff
      const submissionsResponse = await fetch(
        `/api/form-submissions?submittedBy=${selectedStaff.id}`,
        {
          headers,
        },
      );
      const submissionsData = await submissionsResponse.json();
      setFormSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getJobProgress = (job: Job) => {
    const jobForms = job.formIds || (job.formId ? [job.formId] : []);
    const completedForms = formSubmissions.filter(
      (sub) => sub.jobId === job.id && jobForms.includes(sub.formId),
    ).length;
    const totalForms = jobForms.length;
    return {
      completed: completedForms,
      total: totalForms,
      percentage: totalForms > 0 ? (completedForms / totalForms) * 100 : 0,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "pending":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleFillForm = (job: Job, form: Form) => {
    setSelectedJob(job);
    setSelectedForm(form);
    setShowFormFill(true);
  };

  const formatLocation = (location: UserType["location"]) => {
    if (!location) return "Unknown";
    return location.city || "Unknown";
  };

  if (showFormFill && selectedJob && selectedForm) {
    return (
      <Dialog open={true} onOpenChange={() => setShowFormFill(false)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Fill Form as {selectedStaff.name} - {selectedForm.name}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[80vh] overflow-auto">
            <EnhancedFormFillPageComponent
              jobId={selectedJob.id}
              formId={selectedForm.id}
              user={currentUser}
              impersonatedUser={selectedStaff}
              onComplete={() => {
                setShowFormFill(false);
                fetchStaffData(); // Refresh data
              }}
              onBack={() => setShowFormFill(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff View: {selectedStaff.name}
              <Badge variant="outline" className="ml-2">
                {selectedStaff.role}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
            {/* Staff Info Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Staff Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedStaff.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {formatLocation(selectedStaff.location)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {staffJobs.length} Active Jobs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {formSubmissions.length} Forms Submitted
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Job Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Job Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {["pending", "in_progress", "completed"].map((status) => {
                      const count = staffJobs.filter(
                        (job) => job.status === status,
                      ).length;
                      return (
                        <div
                          key={status}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm capitalize">
                            {status.replace("_", " ")}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(status)} text-white`}
                          >
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Jobs and Forms Panel */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="jobs" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobs">
                    Jobs ({staffJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="forms">Available Forms</TabsTrigger>
                </TabsList>

                <TabsContent value="jobs" className="h-full">
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-3">
                      {loading ? (
                        <div className="text-center py-8">Loading...</div>
                      ) : staffJobs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No jobs assigned to this staff member
                        </div>
                      ) : (
                        staffJobs.map((job) => {
                          const progress = getJobProgress(job);
                          return (
                            <Card
                              key={job.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{job.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {job.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge
                                        variant="outline"
                                        className={`${getStatusColor(job.status)} text-white`}
                                      >
                                        {job.status.replace("_", " ")}
                                      </Badge>
                                      <Badge variant="outline">
                                        {job.category || "No Category"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right space-y-2">
                                    <div className="text-sm text-gray-600">
                                      Progress: {progress.completed}/
                                      {progress.total} forms
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleJobClick(job)}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Form Quick Actions */}
                                {job.formIds && job.formIds.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="text-xs text-gray-600 mb-2">
                                      Quick Form Actions:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {job.formIds.map((formId) => {
                                        const form = availableForms.find(
                                          (f) => f.id === formId,
                                        );
                                        if (!form) return null;

                                        const hasSubmission =
                                          formSubmissions.some(
                                            (sub) =>
                                              sub.jobId === job.id &&
                                              sub.formId === formId,
                                          );

                                        return (
                                          <Button
                                            key={formId}
                                            size="sm"
                                            variant={
                                              hasSubmission
                                                ? "secondary"
                                                : "outline"
                                            }
                                            onClick={() =>
                                              handleFillForm(job, form)
                                            }
                                            className="text-xs"
                                          >
                                            <Edit3 className="h-3 w-3 mr-1" />
                                            {form.name}
                                            {hasSubmission && (
                                              <CheckCircle2 className="h-3 w-3 ml-1" />
                                            )}
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="forms" className="h-full">
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-3">
                      {availableForms.map((form) => (
                        <Card key={form.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{form.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {form.description || "No description"}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">
                                    {form.fields.length} fields
                                  </Badge>
                                  {form.isRequired && (
                                    <Badge variant="destructive">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                Used in{" "}
                                {
                                  staffJobs.filter(
                                    (job) =>
                                      job.formIds?.includes(form.id) ||
                                      job.formId === form.id,
                                  ).length
                                }{" "}
                                jobs
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          onSave={(updates) => {
            // Update job logic here
            setShowJobDetails(false);
          }}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
