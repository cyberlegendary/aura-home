import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, FileText, Loader2 } from "lucide-react";
import { Form } from "@shared/types";
import { canEditForms } from "@/utils/jobVisibility";
import { useAuth } from "@/contexts/AuthContext";

interface FormSubmissionCounterProps {
  form: Form;
  jobId?: string;
  className?: string;
}

export function FormSubmissionCounter({
  form,
  jobId,
  className,
}: FormSubmissionCounterProps) {
  const { user } = useAuth();
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSubmissionCount();
  }, [form.id, jobId]);

  const fetchSubmissionCount = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams();
      if (jobId) params.append("jobId", jobId);

      const response = await fetch(
        `/api/form-submissions/counts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const counts = await response.json();
        setSubmissionCount(counts[form.id] || 0);
      }
    } catch (error) {
      console.error("Failed to fetch submission count:", error);
    }
  };

  const handleDownload = async () => {
    if (!user || submissionCount === 0) return;

    setDownloading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({ formId: form.id });
      if (jobId) params.append("jobId", jobId);

      const response = await fetch(
        `/api/form-submissions/download?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Handle PDF or JSON download
        const contentType = response.headers.get("content-type");
        const contentDisposition = response.headers.get("content-disposition");

        let filename = `${form.name}_submission.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error("Failed to download form submissions:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (!user) return null;

  const canEdit = canEditForms(user);
  const showDownload =
    submissionCount > 0 && (canEdit || user.role === "staff");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{form.name}</span>
      </div>

      {submissionCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={showDownload ? handleDownload : undefined}
              >
                {submissionCount}
                {showDownload && !downloading && (
                  <Download className="h-3 w-3 ml-1" />
                )}
                {downloading && (
                  <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {submissionCount} submission{submissionCount !== 1 ? "s" : ""}
                {showDownload && " • Click to download"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {submissionCount === 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          0
        </Badge>
      )}
    </div>
  );
}

interface FormSubmissionListProps {
  forms: Form[];
  jobId?: string;
  className?: string;
}

export function FormSubmissionList({
  forms,
  jobId,
  className,
}: FormSubmissionListProps) {
  const { user } = useAuth();

  if (!user || forms.length === 0) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Form Submissions
          </h4>
          <div className="space-y-2">
            {forms.map((form) => (
              <FormSubmissionCounter
                key={form.id}
                form={form}
                jobId={jobId}
                className="p-2 rounded-md border bg-muted/20"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
