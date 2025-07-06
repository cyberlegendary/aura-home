import { RequestHandler } from "express";
import {
  Form,
  FormField,
  CreateFormRequest,
  FormSubmission,
} from "@shared/types";
import { predefinedForms } from "./predefinedForms";

// Mock storage - in production, use a proper database
let forms: Form[] = [...predefinedForms]; // Initialize with predefined forms
let formSubmissions: FormSubmission[] = [];
let formIdCounter = predefinedForms.length + 1;
let submissionIdCounter = 1;

// Schema parser for form creation
function parseFormSchema(schema: string): Omit<FormField, "id">[] {
  const fields: Omit<FormField, "id">[] = [];

  // Split by lines and clean
  const lines = schema
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    // Skip headers or obvious non-field lines
    if (
      line.includes("Details") ||
      line.includes("Notification") ||
      line.includes("Appointment")
    ) {
      continue;
    }

    // Check if line contains a field pattern (word followed by tab/colon and value)
    const fieldMatch = line.match(/^([^:\t]+)[\t:]\s*(.*)$/);

    if (fieldMatch) {
      const label = fieldMatch[1].trim();
      const sampleValue = fieldMatch[2].trim();

      let fieldType: FormField["type"] = "text";
      let required = true;

      // Determine field type based on label and sample value
      if (label.toLowerCase().includes("email")) {
        fieldType = "email";
      } else if (
        label.toLowerCase().includes("date") ||
        sampleValue.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ||
        sampleValue.match(/\d{1,2}\s+\w+\s+\d{4}/)
      ) {
        fieldType = "date";
      } else if (
        label.toLowerCase().includes("amount") ||
        label.toLowerCase().includes("sum") ||
        label.toLowerCase().includes("estimate") ||
        sampleValue.match(/^\d+\.?\d*$/)
      ) {
        fieldType = "number";
      } else if (
        label.toLowerCase().includes("description") ||
        label.toLowerCase().includes("address") ||
        sampleValue.length > 50
      ) {
        fieldType = "textarea";
      } else if (
        label.toLowerCase().includes("status") ||
        label.toLowerCase().includes("section") ||
        label.toLowerCase().includes("peril")
      ) {
        fieldType = "select";
      }

      fields.push({
        type: fieldType,
        label,
        required,
        placeholder: fieldType === "select" ? undefined : `Enter ${label}`,
        options:
          fieldType === "select"
            ? ["Current", "Pending", "Completed"]
            : undefined,
      });
    }
  }

  return fields;
}

export const handleCreateForm: RequestHandler = (req, res) => {
  try {
    const formData: CreateFormRequest = req.body;

    if (!formData.name) {
      return res.status(400).json({ error: "Form name is required" });
    }

    let fields = formData.fields;

    // Parse schema if provided
    if (formData.rawSchema) {
      const parsedFields = parseFormSchema(formData.rawSchema);
      if (parsedFields.length > 0) {
        fields = parsedFields;
      }
    }

    // Add IDs to fields
    const fieldsWithIds: FormField[] = fields.map((field, index) => ({
      ...field,
      id: `field-${formIdCounter}-${index + 1}`,
    }));

    const newForm: Form = {
      id: `form-${formIdCounter++}`,
      name: formData.name,
      description: formData.description,
      fields: fieldsWithIds,
      isTemplate: formData.isTemplate,
      restrictedToCompanies: formData.restrictedToCompanies || [],
      createdBy: "admin-1", // Mock admin user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    forms.push(newForm);
    res.status(201).json(newForm);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetForms: RequestHandler = (req, res) => {
  try {
    const { isTemplate, companyId } = req.query;

    let filteredForms = forms;

    if (isTemplate !== undefined) {
      filteredForms = filteredForms.filter(
        (form) => form.isTemplate === (isTemplate === "true"),
      );
    }

    if (companyId) {
      filteredForms = filteredForms.filter(
        (form) =>
          form.restrictedToCompanies.length === 0 ||
          form.restrictedToCompanies.includes(companyId as string),
      );
    }

    res.json(filteredForms);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const form = forms.find((f) => f.id === id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const formIndex = forms.findIndex((form) => form.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    forms[formIndex] = {
      ...forms[formIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    res.json(forms[formIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSubmitForm: RequestHandler = (req, res) => {
  try {
    const { jobId, formId, data } = req.body;

    if (!jobId || !formId || !data) {
      return res.status(400).json({
        error: "jobId, formId, and data are required",
      });
    }

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "admin-1";

    const submission: FormSubmission = {
      id: `submission-${submissionIdCounter++}`,
      jobId,
      formId,
      submittedBy: userId,
      data,
      submittedAt: new Date().toISOString(),
    };

    formSubmissions.push(submission);
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetFormSubmissions: RequestHandler = (req, res) => {
  try {
    const { jobId, formId, submittedBy } = req.query;

    let filteredSubmissions = formSubmissions;

    if (jobId) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.jobId === jobId,
      );
    }

    if (formId) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.formId === formId,
      );
    }

    if (submittedBy) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.submittedBy === submittedBy,
      );
    }

    res.json(filteredSubmissions);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin (simple check for mock implementation)
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    if (userId !== "admin-1") {
      return res
        .status(403)
        .json({ error: "Only administrators can delete forms" });
    }

    const formIndex = forms.findIndex((form) => form.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Remove the form
    forms.splice(formIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleParseFormSchema: RequestHandler = (req, res) => {
  try {
    const { schema } = req.body;

    if (!schema) {
      return res.status(400).json({ error: "Schema is required" });
    }

    const fields = parseFormSchema(schema);
    res.json({ fields });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetFormSubmissionCounts: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.query;

    let relevantSubmissions = formSubmissions;

    if (jobId) {
      relevantSubmissions = relevantSubmissions.filter(
        (sub) => sub.jobId === jobId,
      );
    }

    // Count submissions by form ID
    const counts: Record<string, number> = {};
    relevantSubmissions.forEach((submission) => {
      counts[submission.formId] = (counts[submission.formId] || 0) + 1;
    });

    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDownloadFormSubmissions: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { formId, jobId } = req.query;

    if (!formId) {
      return res.status(400).json({ error: "Form ID is required" });
    }

    // Get form submissions
    let submissions = formSubmissions.filter((sub) => sub.formId === formId);

    if (jobId) {
      submissions = submissions.filter((sub) => sub.jobId === jobId);
    }

    if (submissions.length === 0) {
      return res.status(404).json({ error: "No submissions found" });
    }

    // Get form details
    const form = forms.find((f) => f.id === formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Determine form type for PDF generation
    let formType = "generic";
    if (form.name.toLowerCase().includes("absa")) {
      formType = "absa";
    } else if (form.name.toLowerCase().includes("sahl")) {
      formType = "sahl";
    }

    // For now, download the latest submission
    const latestSubmission = submissions[submissions.length - 1];

    if (formType === "absa" || formType === "sahl") {
      // Generate PDF using existing PDF generation logic
      req.body = latestSubmission.data;

      if (formType === "absa") {
        const { handleGenerateABSAPDF } = await import("./pdf");
        return handleGenerateABSAPDF(req, res);
      } else if (formType === "sahl") {
        const { handleGenerateSAHLPDF } = await import("./pdf");
        return handleGenerateSAHLPDF(req, res);
      }
    } else {
      // For other forms, return JSON data
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${form.name}_submissions.json"`,
      );
      res.json(submissions);
    }
  } catch (error) {
    console.error("Download form submissions error:", error);
    res.status(500).json({ error: "Failed to download form submissions" });
  }
};
