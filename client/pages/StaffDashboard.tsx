import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  User,
  Calendar,
  List,
  StickyNote,
} from "lucide-react";
import { Job, Form, FormSubmission } from "@shared/types";
import { StaffCalendarView } from "@/components/StaffCalendarView";
import { JobExtensionModal } from "@/components/JobExtensionModal";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { JobNotesModal } from "@/components/JobNotesModal";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showJobExtension, setShowJobExtension] = useState(false);
  const [selectedJobForExtension, setSelectedJobForExtension] =
    useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<Job | null>(null);
  const [showJobNotes, setShowJobNotes] = useState(false);
  const [selectedJobForNotes, setSelectedJobForNotes] = useState<Job | null>(
    null,
  );

  useEffect(() => {
    if (user && (user.role === "staff" || user.role === "supervisor")) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, formsRes, submissionsRes] = await Promise.all([
        fetch(`/api/jobs?assignedTo=${user.id}`, { headers }),
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?submittedBy=${user.id}`, { headers }),
      ]);

      const [jobsData, formsData, submissionsData] = await Promise.all([
        jobsRes.json(),
        formsRes.json(),
        submissionsRes.json(),
      ]);

      setJobs(jobsData);
      setForms(formsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getJobForms = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    const formIds = job.formIds || (job.formId ? [job.formId] : []);
    const assignedForms = forms.filter((f) => formIds.includes(f.id));

    // Add optional forms as "destiny forms" for staff
    const optionalFormIds = ["form-material-list", "form-noncompliance"];
    const destinyForms = forms.filter(
      (f) => optionalFormIds.includes(f.id) && !formIds.includes(f.id),
    );

    return [...assignedForms, ...destinyForms];
  };

  const getJobForm = (jobId: string) => {
    const jobForms = getJobForms(jobId);
    return jobForms.length > 0 ? jobForms[0] : null;
  };

  const isFormSubmitted = (jobId: string) => {
    return submissions.some((s) => s.jobId === jobId);
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const handleExtendJob = (job: Job) => {
    setSelectedJobForExtension(job);
    setShowJobExtension(true);
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJobForDetails(job);
    setShowJobDetails(true);
  };

  const handleAddNote = (job: Job) => {
    setSelectedJobForNotes(job);
    setShowJobNotes(true);
  };

  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    inProgressJobs: jobs.filter((j) => j.status === "in_progress").length,
    completedJobs: jobs.filter((j) => j.status === "completed").length,
    formsSubmitted: submissions.length,
  };

  const completionRate =
    stats.totalJobs > 0
      ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  My Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Forms Submitted
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.formsSubmitted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Overall Completion
                  </span>
                  <span className="text-sm text-gray-600">
                    {completionRate}%
                  </span>
                </div>
                <Progress value={completionRate} className="w-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingJobs}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.inProgressJobs}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedJobs}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Assigned Jobs</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-2" />
                  List View
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar View
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "calendar" ? (
              <StaffCalendarView
                jobs={jobs}
                staff={user ? [user] : []}
                selectedStaff={user?.id}
                onStaffSelect={() => {}}
                onCreateJob={(staffId, timeSlot, date) => {
                  // Only supervisors can create jobs from calendar
                  if (user?.role === "supervisor") {
                    const [hours, minutes] = timeSlot.split(":").map(Number);
                    const jobDateTime = new Date(date);
                    jobDateTime.setHours(hours, minutes, 0, 0);

                    // Open job creation - this would need to be implemented
                    alert(
                      `Create job for ${jobDateTime.toLocaleString()} - Feature to be implemented`,
                    );
                  }
                }}
              />
            ) : (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No jobs assigned
                    </h3>
                    <p className="text-gray-600">
                      You don't have any jobs assigned to you yet. Check back
                      later or contact your administrator.
                    </p>
                  </div>
                ) : (
                  jobs.map((job) => {
                    const form = getJobForm(job.id);
                    const hasSubmittedForm = isFormSubmitted(job.id);

                    return (
                      <div
                        key={job.id}
                        className="border rounded-lg p-6 space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium">
                                {job.title}
                              </h3>
                              <Badge variant={getPriorityColor(job.priority)}>
                                {job.priority}
                              </Badge>
                              <Badge
                                className={getStatusColor(job.status)}
                                variant="secondary"
                              >
                                {job.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{job.description}</p>

                            {/* Job Details */}
                            {job.claimNo && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Claim Details
                                  </p>
                                  <div className="mt-2 space-y-1 text-sm">
                                    {job.claimNo && (
                                      <p>
                                        <span className="font-medium">
                                          Claim No:
                                        </span>{" "}
                                        {job.claimNo}
                                      </p>
                                    )}
                                    {job.policyNo && (
                                      <p>
                                        <span className="font-medium">
                                          Policy No:
                                        </span>{" "}
                                        {job.policyNo}
                                      </p>
                                    )}
                                    {job.insuredName && (
                                      <p>
                                        <span className="font-medium">
                                          Insured:
                                        </span>{" "}
                                        {job.insuredName}
                                      </p>
                                    )}
                                    {job.excess && (
                                      <p>
                                        <span className="font-medium">
                                          Excess:
                                        </span>{" "}
                                        {job.excess}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Contact & Location
                                  </p>
                                  <div className="mt-2 space-y-1 text-sm">
                                    {job.riskAddress && (
                                      <p>
                                        <span className="font-medium">
                                          Address:
                                        </span>{" "}
                                        {job.riskAddress}
                                      </p>
                                    )}
                                    {job.insCell && (
                                      <p>
                                        <span className="font-medium">
                                          Contact:
                                        </span>{" "}
                                        {job.insCell}
                                      </p>
                                    )}
                                    {job.email && (
                                      <p>
                                        <span className="font-medium">
                                          Email:
                                        </span>{" "}
                                        {job.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            {job.dueDate && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due:{" "}
                                {new Date(job.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            <p className="text-sm text-gray-500">
                              Created: {new Date(job.createdAt).toDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Form Section */}
                        {form && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium">
                                  Required Form: {form.name}
                                </span>
                                {hasSubmittedForm ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Submitted
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-800"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant={
                                  hasSubmittedForm ? "outline" : "default"
                                }
                                onClick={() => {
                                  if (form) {
                                    // Navigate to fill form page
                                    window.location.href = `/fill-form?jobId=${job.id}&formId=${form.id}`;
                                  }
                                }}
                              >
                                {hasSubmittedForm ? "View Form" : "Fill Form"}
                              </Button>
                            </div>
                            {form.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {form.description}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex space-x-2">
                            {job.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateJobStatus(job.id, "in_progress")
                                }
                              >
                                Start Job
                              </Button>
                            )}
                            {job.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Check if there are required forms and if they're submitted
                                  const assignedFormIds =
                                    job.formIds ||
                                    (job.formId ? [job.formId] : []);
                                  const availableForms = forms.filter((f) =>
                                    assignedFormIds.includes(f.id),
                                  );

                                  const submittedFormIds = submissions
                                    .filter((s) => s.jobId === job.id)
                                    .map((s) => s.formId);

                                  const missingForms = availableForms.filter(
                                    (f) => !submittedFormIds.includes(f.id),
                                  );

                                  if (missingForms.length > 0) {
                                    alert(
                                      `Please submit the following forms before marking the job as complete: ${missingForms.map((f) => f.name).join(", ")}`,
                                    );
                                    return;
                                  }

                                  updateJobStatus(job.id, "completed");
                                }}
                              >
                                Mark Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddNote(job)}
                            >
                              <StickyNote className="h-4 w-4 mr-1" />
                              Add Note
                            </Button>
                            {/* Allow extending jobs that are not completed or need follow-up */}
                            {(job.status !== "completed" ||
                              (job as any).carryOver) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExtendJob(job)}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Extend
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewJobDetails(job)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Extension Modal */}
        <JobExtensionModal
          open={showJobExtension}
          onOpenChange={(open) => {
            setShowJobExtension(open);
            if (!open) setSelectedJobForExtension(null);
          }}
          job={selectedJobForExtension}
          onJobExtended={fetchData}
        />

        {/* Job Details Modal */}
        <JobDetailsModal
          open={showJobDetails}
          onOpenChange={(open) => {
            setShowJobDetails(open);
            if (!open) setSelectedJobForDetails(null);
          }}
          job={selectedJobForDetails}
          onJobUpdated={fetchData}
        />

        {/* Job Notes Modal */}
        <JobNotesModal
          open={showJobNotes}
          onOpenChange={(open) => {
            setShowJobNotes(open);
            if (!open) setSelectedJobForNotes(null);
          }}
          job={selectedJobForNotes}
          onNotesUpdated={fetchData}
        />
      </div>
    </div>
  );
}
