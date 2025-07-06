import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Job, Form, FormSubmission } from "@shared/types";
import {
  FileText,
  ExternalLink,
  StickyNote,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Building,
  Package,
  Shield,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedJobForm } from "@/components/EnhancedJobForm";
import {
  getJobDetailsConfig,
  getVisibleJobFields,
  isFormRequired,
  getMaxSubmissions,
} from "@/utils/jobVisibility";

interface JobDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobUpdated: () => void;
}

export function JobDetailsModal({
  open,
  onOpenChange,
  job,
  onJobUpdated,
}: JobDetailsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnhancedJobForm, setShowEnhancedJobForm] = useState(false);
  const [showTimeExtension, setShowTimeExtension] = useState(false);
  const [extensionHours, setExtensionHours] = useState<number>(0);

  // Get role-based visibility configuration
  const visibilityConfig = user ? getJobDetailsConfig(user) : null;
  const canExtendTime =
    user && (user.role === "admin" || user.role === "supervisor");

  useEffect(() => {
    if (open && job) {
      fetchData();
      setError(null);
    }
  }, [open, job]);

  const fetchData = async () => {
    if (!job) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [formsRes, submissionsRes] = await Promise.all([
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?jobId=${job.id}`, { headers }),
      ]);

      const [formsData, submissionsData] = await Promise.all([
        formsRes.json(),
        submissionsRes.json(),
      ]);

      setForms(formsData);
      setSubmissions(submissionsData);
    } catch (error) {
      setError("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = (formId: string) => {
    if (!job) return;

    navigate("/fill-form", {
      state: { jobId: job.id, formId },
    });
  };

  const handleTimeExtension = async () => {
    if (!job || extensionHours <= 0) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add note about time extension
      await fetch(`/api/jobs/${job.id}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: `TIME EXTENSION: Added ${extensionHours} hours by ${user?.username} (${user?.role})`,
          isTimeExtension: true,
        }),
      });

      setShowTimeExtension(false);
      setExtensionHours(0);
      fetchData(); // Refresh data
    } catch (error) {
      setError("Failed to extend time");
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!job) return;

    // Check if all required forms are submitted before allowing completion
    if (status === "completed") {
      const availableForms = getAvailableForms();
      const submittedFormIds = submissions.map((s) => s.formId);
      const missingForms = availableForms.filter(
        (f) => !submittedFormIds.includes(f.id),
      );

      if (missingForms.length > 0) {
        setError(
          `Cannot complete job. Please fill out the following forms first: ${missingForms.map((f) => f.name).join(", ")}`,
        );
        return;
      }
    }

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        onJobUpdated();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update job status");
      }
    } catch (error) {
      setError("Network error occurred");
    }
  };

  const getFormSubmissions = (formId: string) => {
    return submissions.filter((s) => s.formId === formId);
  };

  const getFormSubmissionCount = (formId: string) => {
    return getFormSubmissions(formId).length;
  };

  const canSubmitForm = (form: Form) => {
    const maxSubs = form.maxSubmissions || getMaxSubmissions(form.name);
    const currentSubs = getFormSubmissionCount(form.id);
    return currentSubs < maxSubs;
  };

  const getAvailableForms = () => {
    // Get forms that are attached to this job or are available templates
    return forms.filter(
      (f) =>
        f.id === job?.formId ||
        job?.formIds?.includes(f.id) ||
        f.isTemplate ||
        f.restrictedToCompanies?.length === 0 ||
        f.restrictedToCompanies?.includes(job?.companyId || ""),
    );
  };

  const getRequiredForms = () => {
    return getAvailableForms().filter(
      (f) => f.isRequired !== false && isFormRequired(f.name),
    );
  };

  const getOptionalForms = () => {
    return getAvailableForms().filter(
      (f) => f.isRequired === false || !isFormRequired(f.name),
    );
  };

  if (!job) {
    return null;
  }

  const availableForms = getAvailableForms();
  const requiredForms = getRequiredForms();
  const optionalForms = getOptionalForms();
  const submittedFormIds = submissions.map((s) => s.formId);
  const allRequiredFormsSubmitted = requiredForms.every((f) =>
    submittedFormIds.includes(f.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Job Details
          </DialogTitle>
          <DialogDescription>
            View job information and manage progress
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Job Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{job.title}</span>
                  <div className="flex space-x-2">
                    <Badge
                      variant={
                        job.priority === "high"
                          ? "destructive"
                          : job.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {job.priority}
                    </Badge>
                    <Badge variant="outline">
                      {job.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{job.description}</p>

                {job.dueDate && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due: {new Date(job.dueDate).toLocaleDateString()}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Created: {new Date(job.createdAt).toDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Job Details - Role-based visibility */}
            {visibilityConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Always visible fields */}
                    {job.category && (
                      <div>
                        <span className="font-medium">Category:</span>
                        <br />
                        <Badge variant="outline">{job.category}</Badge>
                      </div>
                    )}
                    {job.spmNo && (
                      <div>
                        <span className="font-medium">SPM No:</span>
                        <br />
                        {job.spmNo}
                      </div>
                    )}
                    {job.underwriter && (
                      <div>
                        <span className="font-medium">Underwriter:</span>
                        <br />
                        {job.underwriter}
                      </div>
                    )}
                    {job.claimStatus && (
                      <div>
                        <span className="font-medium">Claim Status:</span>
                        <br />
                        <Badge
                          variant={
                            job.claimStatus === "Open" ? "default" : "secondary"
                          }
                          className={
                            job.claimStatus === "Open"
                              ? "bg-blue-100 text-blue-800"
                              : ""
                          }
                        >
                          {job.claimStatus}
                        </Badge>
                      </div>
                    )}

                    {/* Conditional fields based on role */}
                    {visibilityConfig.visibleFields.claimNo &&
                      (job.claimNo || job.ClaimNo) && (
                        <div>
                          <span className="font-medium">Claim No:</span>
                          <br />
                          {job.claimNo || job.ClaimNo}
                        </div>
                      )}
                    {visibilityConfig.visibleFields.policyNo &&
                      (job.policyNo || job.PolicyNo) && (
                        <div>
                          <span className="font-medium">Policy No:</span>
                          <br />
                          {job.policyNo || job.PolicyNo}
                        </div>
                      )}
                    {visibilityConfig.visibleFields.insuredName &&
                      (job.insuredName || job.InsuredName) && (
                        <div>
                          <span className="font-medium">Client:</span>
                          <br />
                          {job.insuredName || job.InsuredName}
                        </div>
                      )}
                    {visibilityConfig.visibleFields.insCell &&
                      (job.insCell || job.InsCell) && (
                        <div>
                          <span className="font-medium">Contact:</span>
                          <br />
                          {job.insCell || job.InsCell}
                        </div>
                      )}
                    {visibilityConfig.visibleFields.riskAddress &&
                      (job.riskAddress || job.RiskAddress) && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Address:</span>
                          <br />
                          {job.riskAddress || job.RiskAddress}
                        </div>
                      )}
                    {visibilityConfig.visibleFields.excess &&
                      (job.excess || job.Excess) && (
                        <div>
                          <span className="font-medium">Excess:</span>
                          <br />
                          <span className="text-green-600 font-medium">
                            {job.excess || job.Excess}
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Show message about limited view for non-Apollos staff */}
                  {!visibilityConfig.showFullDetails && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-blue-700">
                          Limited view - Additional details available to Apollos
                          staff and administrators
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Required Forms Section */}
            {requiredForms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Required Forms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {requiredForms.map((form) => {
                      const submissionCount = getFormSubmissionCount(form.id);
                      const maxSubmissions =
                        form.maxSubmissions || getMaxSubmissions(form.name);
                      const canSubmit = canSubmitForm(form);
                      const submissions = getFormSubmissions(form.id);

                      return (
                        <div
                          key={form.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-red-600" />
                              <span className="font-medium">{form.name}</span>
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {submissionCount > 0 ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {submissionCount}/{maxSubmissions} Submitted
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 border-red-300"
                                >
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {canSubmit && (
                              <Button
                                onClick={() => handleFillForm(form.id)}
                                size="sm"
                                variant={
                                  submissionCount > 0 ? "outline" : "default"
                                }
                              >
                                {submissionCount > 0
                                  ? "Submit Again"
                                  : "Fill Form"}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                            {submissions.length > 0 && (
                              <Button
                                onClick={() => handleFillForm(form.id)}
                                size="sm"
                                variant="ghost"
                                className="text-blue-600"
                              >
                                View Submissions
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Optional Forms Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Optional Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optionalForms.map((form) => {
                    const submissionCount = getFormSubmissionCount(form.id);
                    const maxSubmissions =
                      form.maxSubmissions || getMaxSubmissions(form.name);
                    const canSubmit = canSubmitForm(form);
                    const submissions = getFormSubmissions(form.id);

                    return (
                      <div
                        key={form.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">{form.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {submissionCount > 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {submissionCount}/{maxSubmissions} Submitted
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Submitted</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canSubmit && (
                            <Button
                              onClick={() => handleFillForm(form.id)}
                              size="sm"
                              variant="outline"
                            >
                              {submissionCount > 0
                                ? "Submit Again"
                                : "Fill Form"}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          {submissions.length > 0 && (
                            <Button
                              onClick={() => handleFillForm(form.id)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-600"
                            >
                              View Submissions
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Hard-coded optional forms */}
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Additional Optional Forms
                    </h4>

                    {/* Liability Form */}
                    <div className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">Liability Form</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Optional
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEnhancedJobForm(true)}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Fill Liability Form
                      </Button>
                    </div>

                    {/* ABSA Form */}
                    <div className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">ABSA Form</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          <Building className="h-3 w-3 mr-1" />
                          Optional
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEnhancedJobForm(true)}
                      >
                        <Building className="h-3 w-3 mr-1" />
                        Fill ABSA Form
                      </Button>
                    </div>

                    {/* SAHL Certificate Form */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="font-medium">SAHL Certificate</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Optional
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEnhancedJobForm(true)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Fill SAHL Certificate
                      </Button>
                    </div>
                  </div>

                  {availableForms.length === 0 &&
                    optionalForms.length === 0 && (
                      <p className="text-gray-600 text-center py-4">
                        No forms assigned for this job.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.status === "pending" && (
                  <Button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="w-full"
                  >
                    Start Job
                  </Button>
                )}

                {job.status === "in_progress" && (
                  <Button
                    onClick={() => handleUpdateStatus("completed")}
                    className="w-full"
                    disabled={!allRequiredFormsSubmitted}
                    title={
                      !allRequiredFormsSubmitted
                        ? "Please submit all required forms before completing the job"
                        : "Mark job as completed"
                    }
                  >
                    {allRequiredFormsSubmitted ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Complete Job
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    // Close this modal and let parent handle notes
                    onOpenChange(false);
                    // The parent should handle opening notes modal
                  }}
                  className="w-full"
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Add Note
                </Button>

                {canExtendTime && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTimeExtension(!showTimeExtension)}
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Extend Time
                  </Button>
                )}

                {showTimeExtension && (
                  <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-2">Extend Job Time</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="extensionHours">Additional Hours</Label>
                        <Input
                          id="extensionHours"
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={extensionHours}
                          onChange={(e) =>
                            setExtensionHours(Number(e.target.value))
                          }
                          placeholder="Enter hours to add"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleTimeExtension}
                          disabled={extensionHours <= 0}
                          size="sm"
                          className="flex-1"
                        >
                          Add Time
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowTimeExtension(false);
                            setExtensionHours(0);
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            {Object.entries(job)
              .filter(
                ([key, value]) =>
                  value &&
                  typeof value === "string" &&
                  ![
                    "id",
                    "title",
                    "description",
                    "assignedTo",
                    "assignedBy",
                    "companyId",
                    "formId",
                    "status",
                    "priority",
                    "dueDate",
                    "createdAt",
                    "updatedAt",
                    "notes",
                    "carryOver",
                    "claimNo",
                    "policyNo",
                    "insuredName",
                    "insCell",
                    "riskAddress",
                    "excess",
                    "ClaimNo",
                    "PolicyNo",
                    "InsuredName",
                    "InsCell",
                    "RiskAddress",
                    "Excess",
                  ].includes(key),
              )
              .slice(0, 8).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(job)
                    .filter(
                      ([key, value]) =>
                        value &&
                        typeof value === "string" &&
                        ![
                          "id",
                          "title",
                          "description",
                          "assignedTo",
                          "assignedBy",
                          "companyId",
                          "formId",
                          "status",
                          "priority",
                          "dueDate",
                          "createdAt",
                          "updatedAt",
                          "notes",
                          "carryOver",
                          "claimNo",
                          "policyNo",
                          "insuredName",
                          "insCell",
                          "riskAddress",
                          "excess",
                          "ClaimNo",
                          "PolicyNo",
                          "InsuredName",
                          "InsCell",
                          "RiskAddress",
                          "Excess",
                        ].includes(key),
                    )
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <br />
                        <span className="text-gray-600">
                          {String(value).length > 30
                            ? `${String(value).substring(0, 30)}...`
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Enhanced Job Form Modal */}
      {showEnhancedJobForm && job && (
        <Dialog
          open={showEnhancedJobForm}
          onOpenChange={(open) => {
            setShowEnhancedJobForm(open);
            if (!open) {
              onJobUpdated(); // Refresh parent data when forms are submitted
            }
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Forms - {job.title}</DialogTitle>
              <DialogDescription>
                Complete the required forms for this job. All data will be
                auto-filled from the job details.
              </DialogDescription>
            </DialogHeader>
            <EnhancedJobForm
              job={job}
              onSave={(updatedJob) => {
                console.log("Job updated:", updatedJob);
                setShowEnhancedJobForm(false);
                onJobUpdated?.();
              }}
              onCancel={() => setShowEnhancedJobForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
