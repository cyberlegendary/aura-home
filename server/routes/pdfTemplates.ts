import { RequestHandler } from "express";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

interface PDFTemplate {
  id: string;
  name: string;
  formId: string;
  formName: string;
  templateFile: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

interface FieldMapping {
  id: string;
  formFieldId: string;
  formFieldName: string;
  pdfFieldName: string;
  fieldType: "text" | "checkbox" | "radio" | "signature";
  transform?: "uppercase" | "lowercase" | "date" | "none";
}

// Mock storage - in production, use a proper database
let pdfTemplates: PDFTemplate[] = [];
let templateIdCounter = 1;

export const handleCreatePDFTemplate: RequestHandler = async (req, res) => {
  try {
    const { name, formId, fieldMappings } = req.body;
    const templateFile = req.file;

    if (!name || !formId || !templateFile) {
      return res
        .status(400)
        .json({ error: "Name, form ID, and template file are required" });
    }

    // Save the uploaded PDF file
    const templateDir = path.join(__dirname, "../templates/pdf-templates");
    await fs.mkdir(templateDir, { recursive: true });

    const fileName = `template-${templateIdCounter}-${Date.now()}.pdf`;
    const filePath = path.join(templateDir, fileName);
    await fs.writeFile(filePath, templateFile.buffer);

    // Get form name (this would come from the forms database in production)
    const formName = `Form ${formId}`; // Simplified for mock

    const newTemplate: PDFTemplate = {
      id: `template-${templateIdCounter++}`,
      name,
      formId,
      formName,
      templateFile: fileName,
      fieldMappings: JSON.parse(fieldMappings || "[]"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    pdfTemplates.push(newTemplate);
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Error creating PDF template:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetPDFTemplates: RequestHandler = (req, res) => {
  try {
    res.json(pdfTemplates);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdatePDFTemplate: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { fieldMappings } = req.body;

    const templateIndex = pdfTemplates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ error: "Template not found" });
    }

    pdfTemplates[templateIndex] = {
      ...pdfTemplates[templateIndex],
      fieldMappings: fieldMappings || pdfTemplates[templateIndex].fieldMappings,
      updatedAt: new Date().toISOString(),
    };

    res.json(pdfTemplates[templateIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeletePDFTemplate: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const templateIndex = pdfTemplates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = pdfTemplates[templateIndex];

    // Delete the template file
    try {
      const filePath = path.join(
        __dirname,
        "../templates/pdf-templates",
        template.templateFile,
      );
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn("Could not delete template file:", fileError);
    }

    pdfTemplates.splice(templateIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDownloadFilledForm: RequestHandler = async (req, res) => {
  try {
    const { jobId, formId } = req.query;

    if (!jobId || !formId) {
      return res.status(400).json({ error: "Job ID and form ID are required" });
    }

    // Find the PDF template for this form
    const template = pdfTemplates.find((t) => t.formId === formId);
    if (!template) {
      return res
        .status(404)
        .json({ error: "No PDF template found for this form" });
    }

    // Get form submission data (mock implementation)
    // In production, this would come from a database
    const mockSubmissions = [
      {
        id: "sub-1",
        jobId: jobId as string,
        formId: formId as string,
        data: {
          "field-1": "Sample Value",
          "field-2": "Another Value",
        },
        submittedAt: new Date().toISOString(),
      },
    ];

    const submission = mockSubmissions.find(
      (s) => s.jobId === jobId && s.formId === formId,
    );

    if (!submission) {
      return res.status(404).json({ error: "No form submission found" });
    }

    // Load the PDF template
    const templatePath = path.join(
      __dirname,
      "../templates/pdf-templates",
      template.templateFile,
    );
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Apply field mappings
    template.fieldMappings.forEach((mapping) => {
      try {
        const formData = submission.data;
        let value = formData[mapping.formFieldId];

        if (!value) return;

        // Apply transforms
        if (mapping.transform === "uppercase") {
          value = String(value).toUpperCase();
        } else if (mapping.transform === "lowercase") {
          value = String(value).toLowerCase();
        } else if (mapping.transform === "date" && value) {
          value = new Date(value).toLocaleDateString();
        }

        // Set field based on type
        if (mapping.fieldType === "text") {
          const field = form.getTextField(mapping.pdfFieldName);
          field.setText(String(value));
        } else if (mapping.fieldType === "checkbox") {
          const field = form.getCheckBox(mapping.pdfFieldName);
          if (value === true || value === "true" || value === "Yes") {
            field.check();
          }
        } else if (mapping.fieldType === "radio") {
          const field = form.getRadioGroup(mapping.pdfFieldName);
          field.select(String(value));
        }
        // Note: Signature handling would require additional implementation
      } catch (fieldError) {
        console.warn(
          `Error setting field ${mapping.pdfFieldName}:`,
          fieldError,
        );
      }
    });

    // Flatten the form to make it non-editable
    form.flatten();

    // Generate the PDF
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${template.name}_filled.pdf"`,
    );
    res.setHeader("Content-Length", pdfBytes.length);

    // Send the PDF
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating filled PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

function transformValue(value: any, transform?: string): string {
  if (!value) return "";

  switch (transform) {
    case "uppercase":
      return String(value).toUpperCase();
    case "lowercase":
      return String(value).toLowerCase();
    case "date":
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
}
