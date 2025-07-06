import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  StickyNote,
  User,
  ArrowLeft,
} from "lucide-react";
import { Job, Form, FormSubmission, User as UserType } from "@shared/types";

interface StaffPortalViewProps {
  staff: UserType;
  onBack: () => void;
  currentUser: UserType;
}

export function StaffPortalView({
  staff,
  onBack,
  currentUser,
}: StaffPortalViewProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
  }, [staff.id]);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, formsRes, submissionsRes] = await Promise.all([
        fetch(`/api/jobs?assignedTo=${staff.id}`, { headers }),
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?submittedBy=${staff.id}`, { headers }),
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
      console.error("Failed to fetch staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getJobForms = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    const formIds = job.formIds || (job.formId ? [job.formId] : []);
    const assignedForms = forms.filter((f) => formIds.includes(f.id));

    // Add optional forms as "destiny forms"
    const optionalFormIds = ["form-material-list", "form-noncompliance"];
    const destinyForms = forms.filter(
      (f) => optionalFormIds.includes(f.id) && !formIds.includes(f.id),
    );

    return [...assignedForms, ...destinyForms];
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

  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    inProgressJobs: jobs.filter((j) => j.status === "in_progress").length,
    completedJobs: jobs.filter((j) => j.status === "completed").length,
    formsSubmitted: submissions.length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading {staff.name}'s portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{staff.name}'s Portal</h1>
              <p className="text-gray-600">
                @{staff.username} • {staff.role}
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          Viewing as {currentUser.name}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
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
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inProgressJobs}
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

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs & Paperwork</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs assigned
                </h3>
                <p className="text-gray-600">
                  This staff member doesn't have any jobs assigned yet.
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium">{job.title}</h3>
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
                      {job.dueDate && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(job.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

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
                              <span className="font-medium">Claim No:</span>{" "}
                              {job.claimNo}
                            </p>
                          )}
                          {job.policyNo && (
                            <p>
                              <span className="font-medium">Policy No:</span>{" "}
                              {job.policyNo}
                            </p>
                          )}
                          {job.insuredName && (
                            <p>
                              <span className="font-medium">Insured:</span>{" "}
                              {job.insuredName}
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
                              <span className="font-medium">Address:</span>{" "}
                              {job.riskAddress}
                            </p>
                          )}
                          {job.insCell && (
                            <p>
                              <span className="font-medium">Contact:</span>{" "}
                              {job.insCell}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forms Section */}
                  {getJobForms(job.id).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Available Forms</h4>
                      <div className="space-y-2">
                        {getJobForms(job.id).map((jobForm) => {
                          const formSubmitted = submissions.some(
                            (s) =>
                              s.jobId === job.id && s.formId === jobForm.id,
                          );
                          const isDestinyForm = [
                            "form-material-list",
                            "form-noncompliance",
                          ].includes(jobForm.id);
                          const formLabel = isDestinyForm
                            ? "Destiny Form"
                            : job.formIds?.includes(jobForm.id) ||
                                job.formId === jobForm.id
                              ? "Required Form"
                              : "Optional Form";

                          return (
                            <div
                              key={jobForm.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium">
                                  {jobForm.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={
                                    isDestinyForm
                                      ? "border-purple-300 text-purple-800"
                                      : ""
                                  }
                                >
                                  {formLabel}
                                </Badge>
                                {formSubmitted ? (
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
                                    className="bg-yellow-100 text-yellow-800"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Available
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                View Only
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
