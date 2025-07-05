import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  User,
  Building,
  Smartphone,
  Check,
  AlertCircle,
  Signature,
} from "lucide-react";
import { Job, Form, User as UserType, FormField } from "@shared/types";
import { FullScreenSignaturePad } from "@/components/FullScreenSignaturePad";

interface EnhancedFormFillPageComponentProps {
  jobId: string;
  formId: string;
  user: UserType;
  impersonatedUser?: UserType;
  onComplete?: () => void;
  onBack?: () => void;
}

export function EnhancedFormFillPageComponent({
  jobId,
  formId,
  user,
  impersonatedUser,
  onComplete,
  onBack,
}: EnhancedFormFillPageComponentProps) {
  const effectiveUser = impersonatedUser || user;

  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] =
    useState<string>("");
  const [currentSection, setCurrentSection] = useState<
    "staff" | "client" | "signature"
  >("staff");
  const [autoSaveKey, setAutoSaveKey] = useState<string>("");

  // Auto-save functionality
  const saveFormData = useCallback(
    (data: Record<string, any>) => {
      if (autoSaveKey) {
        localStorage.setItem(autoSaveKey, JSON.stringify(data));
      }
    },
    [autoSaveKey],
  );

  const loadSavedData = useCallback(() => {
    if (autoSaveKey) {
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved form data:", e);
        }
      }
    }
    return {};
  }, [autoSaveKey]);

  useEffect(() => {
    if (jobId && formId) {
      setAutoSaveKey(`form_${jobId}_${formId}_${effectiveUser.id}`);
      fetchData();
    } else {
      setError("Missing job or form information");
      setLoading(false);
    }
  }, [jobId, formId, effectiveUser.id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobRes, formRes, staffRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`, { headers }),
        fetch(`/api/forms/${formId}`, { headers }),
        fetch("/api/auth/users", { headers }),
      ]);

      if (!jobRes.ok || !formRes.ok || !staffRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [jobData, formData, staffData] = await Promise.all([
        jobRes.json(),
        formRes.json(),
        staffRes.json(),
      ]);

      setJob(jobData);
      setForm(formData);
      setStaff(staffData.filter((u: UserType) => u.role === "staff"));

      // Initialize form data with saved data or defaults
      const savedData = loadSavedData();
      const initialData: Record<string, any> = { ...savedData };

      // Auto-fill fields based on job and user data
      if (formData.fields) {
        formData.fields.forEach((field: FormField) => {
          if (!initialData[field.id]) {
            let defaultValue = field.defaultValue || "";

            // Auto-fill from user data
            if (field.autoFillFrom === "user.name" && effectiveUser) {
              defaultValue = effectiveUser.name;
            } else if (
              field.autoFillFrom === "user.username" &&
              effectiveUser
            ) {
              defaultValue = effectiveUser.username;
            } else if (field.autoFillFrom === "user.email" && effectiveUser) {
              defaultValue = effectiveUser.email;
            }
            // Auto-fill from job data
            else if (field.autoFillFrom && jobData[field.autoFillFrom]) {
              defaultValue = jobData[field.autoFillFrom];
            }

            if (defaultValue) {
              initialData[field.id] = defaultValue;
            }
          }
        });
      }

      setFormData(initialData);
      saveFormData(initialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    const newData = { ...formData, [fieldId]: value };
    setFormData(newData);
    saveFormData(newData);
  };

  const handleSignature = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setShowSignaturePad(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    handleInputChange(currentSignatureField, signatureData);
    setShowSignaturePad(false);
    setCurrentSignatureField("");
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const submissionData = {
        jobId,
        formId,
        data: formData,
        submittedBy: effectiveUser.id,
      };

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setSuccess(true);
        // Clear auto-saved data
        if (autoSaveKey) {
          localStorage.removeItem(autoSaveKey);
        }

        if (onComplete) {
          setTimeout(() => onComplete(), 1500);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || "";

    if (field.type === "signature") {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            {value ? (
              <div className="space-y-2">
                <img
                  src={value}
                  alt="Signature"
                  className="max-w-full h-20 border rounded"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSignature(field.id)}
                  >
                    <Signature className="h-4 w-4 mr-2" />
                    Change Signature
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange(field.id, "")}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSignature(field.id)}
              >
                <Signature className="h-4 w-4 mr-2" />
                Add Signature
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Handle other field types
    switch (field.type) {
      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(field.id, val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={field.placeholder || "Select an option"}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              readOnly={field.readonly}
              className={field.readonly ? "bg-gray-50" : ""}
            />
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              readOnly={field.readonly}
              className={field.readonly ? "bg-gray-50" : ""}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading form...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert>
        <Check className="h-4 w-4" />
        <AlertDescription>Form submitted successfully!</AlertDescription>
      </Alert>
    );
  }

  const staffFields =
    form?.fields.filter((f) => f.section === "staff" || !f.section) || [];
  const clientFields = form?.fields.filter((f) => f.section === "client") || [];
  const signatureFields =
    form?.fields.filter((f) => f.type === "signature") || [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" onClick={onBack} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <h1 className="text-2xl font-bold">{form?.name}</h1>
            </div>
            {impersonatedUser && (
              <p className="text-sm text-blue-600 mt-1">
                Filling as: {impersonatedUser.name} ({impersonatedUser.username}
                )
              </p>
            )}
          </div>
          <Badge variant="default">Job Form</Badge>
        </div>

        {job && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {job.title}
                </div>
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {job.category || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>{" "}
                  <Badge variant="outline">{job.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff Section */}
          {staffFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Staff Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {staffFields.map(renderField)}
              </CardContent>
            </Card>
          )}

          {/* Client Section */}
          {clientFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientFields.map(renderField)}
              </CardContent>
            </Card>
          )}

          {/* Signature Section */}
          {signatureFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Signature className="h-5 w-5" />
                  Signatures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {signatureFields.map(renderField)}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button onClick={handleSubmit} disabled={saving} className="min-w-32">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Form
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <FullScreenSignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </>
  );
}
