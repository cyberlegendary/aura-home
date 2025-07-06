import { RequestHandler } from "express";
import {
  PDFDocument,
  PDFForm,
  PDFTextField,
  PDFRadioGroup,
  PDFCheckBox,
} from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

export const handleGenerateABSAPDF: RequestHandler = async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({ error: "Form data is required" });
    }

    // Path to the ABSA PDF template (you'll need to add this file)
    const templatePath = path.join(__dirname, "../templates/ABSA_template.pdf");

    // Check if template exists
    try {
      await fs.access(templatePath);
    } catch {
      return res.status(404).json({ error: "ABSA template not found" });
    }

    // Load the PDF template
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get the form
    const form = pdfDoc.getForm();

    // Log available field names for debugging
    const fieldNames = form.getFields().map((f) => f.getName());
    console.log("Available fields:", fieldNames);

    // Fill the form fields based on the provided data structure
    try {
      // Basic text fields
      if (formData.CSARef) {
        const field = form.getTextField("CSA Ref");
        field.setText(formData.CSARef);
      }

      if (formData.FName) {
        const field = form.getTextField("Full name of Insured");
        field.setText(formData.FName);
      }

      if (formData.CNumber) {
        const field = form.getTextField("Claim no");
        field.setText(formData.CNumber);
      }

      if (formData.Paddress) {
        const field = form.getTextField("Property address");
        field.setText(formData.Paddress);
      }

      if (formData.Cdamage) {
        const field = form.getTextField("Cause of damage");
        field.setText(formData.Cdamage);
      }

      if (formData.StaffName) {
        const field = form.getTextField(
          "IWe confirm that the work undertaken by",
        );
        field.setText(formData.StaffName);
      }

      // Radio group for excess
      if (formData.Excess) {
        const radioGroup = form.getRadioGroup("Group1");
        if (formData.Excess === "Yes" || formData.Excess === "yes") {
          radioGroup.select("Choice1");
        } else {
          radioGroup.select("Choice2");
        }
      }

      // Date field
      const currentDate = new Date().toLocaleDateString();
      const dateField = form.getTextField("Text2");
      dateField.setText(currentDate);

      // Handle signature if provided
      if (formData.signature) {
        try {
          let pngImageBytes;

          // Handle base64 signature
          if (formData.signature.startsWith("data:image/")) {
            const base64Data = formData.signature.split(",")[1];
            pngImageBytes = Buffer.from(base64Data, "base64");
          } else if (formData.signature.startsWith("http")) {
            // Handle URL signature
            const response = await fetch(formData.signature);
            pngImageBytes = await response.arrayBuffer();
          }

          if (pngImageBytes) {
            const pngImage = await pdfDoc.embedPng(pngImageBytes);
            const pngDims = pngImage.scale(0.5);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            firstPage.drawImage(pngImage, {
              x: pngDims.width / 15,
              y: pngDims.height + 322,
              width: pngDims.width,
              height: pngDims.height,
            });
          }
        } catch (signatureError) {
          console.warn("Failed to add signature:", signatureError);
        }
      }

      // Handle checkboxes
      const checkboxMappings = [
        { data: "CheckBox1", prefix: "Check Box3.2." },
        { data: "CheckBox2", prefix: "Check Box3.3." },
        { data: "CheckBox3", prefix: "Check Box3.4." },
        { data: "CheckBox4", prefix: "Check Box3.5." },
        { data: "CheckBox5", prefix: "Check Box3.6." },
        { data: "CheckBox6", prefix: "Check Box3.7." },
        { data: "CheckBox7", prefix: "Check Box3.8." },
        { data: "CheckBox8", prefix: "Check Box3.9." },
        { data: "CheckBox9", prefix: "Check Box3.10." },
        { data: "CheckBox10", prefix: "Check Box3.11." },
        { data: "CheckBox11", prefix: "Check Box3.12." },
        { data: "CheckBox12", prefix: "Check Box3.13." },
        { data: "CheckBox13", prefix: "Check Box3.14." },
      ];

      for (const mapping of checkboxMappings) {
        const value = formData[mapping.data];
        if (value && value > 0) {
          const checkboxIndex = value - 1;
          const checkboxName = mapping.prefix + checkboxIndex.toString();
          try {
            const checkbox = form.getCheckBox(checkboxName);
            checkbox.check();
          } catch (error) {
            console.warn(`Checkbox ${checkboxName} not found`);
          }
        }
      }
    } catch (fieldError) {
      console.warn("Some fields could not be filled:", fieldError);
    }

    // Flatten the form to prevent further editing
    form.flatten();

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ABSA_Form.pdf"',
    );
    res.setHeader("Content-Length", pdfBytes.length);

    // Send the PDF
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

export const handleGenerateSAHLPDF: RequestHandler = async (req, res) => {
  try {
    const formData = req.body;

    if (!formData) {
      return res.status(400).json({ error: "Form data is required" });
    }

    // Path to the SAHL PDF template
    const templatePath = path.join(__dirname, "../templates/sahlld.pdf");

    // Check if template file exists
    try {
      await fs.access(templatePath);
    } catch {
      return res.status(404).json({ error: "SAHL PDF template not found" });
    }

    // Load the PDF template
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get the form
    const form = pdfDoc.getForm();
    const fieldNames = form.getFields().map((f) => f.getName());
    console.log({ fieldNames });

    // Fill form fields
    if (formData.ClientName) {
      form.getTextField("ClientName_ZIUG").setText(formData.ClientName);
    }
    if (formData.ClientRef) {
      form.getTextField("ClientRef").setText(formData.ClientRef);
    }
    if (formData.ClientAddress) {
      form.getTextField("ClientAddress").setText(formData.ClientAddress);
    }
    if (formData.ClientDamage) {
      form.getTextField("ClientDamage").setText(formData.ClientDamage);
    }
    if (formData.StaffName) {
      form.getTextField("StaffName").setText(formData.StaffName);
    }
    if (formData.textarea_26kyol) {
      form.getTextField("textarea_26kyol").setText(formData.textarea_26kyol);
    }

    // Handle checkboxes
    if (formData.CheckBox1 === "Yes" || formData.CheckBox1 === "yes") {
      form.getTextField("CheckBox1-1").setText("X");
    } else {
      form.getTextField("CheckBox1-2").setText("X");
    }

    if (formData.CheckBox2 === "Yes" || formData.CheckBox2 === "yes") {
      form.getTextField("CheckBox2-1").setText("X");
    } else {
      form.getTextField("CheckBox2-2").setText("X");
    }

    if (formData.CheckBox3 === "Yes" || formData.CheckBox3 === "yes") {
      form.getTextField("CheckBox3-1").setText("X");
    } else {
      form.getTextField("CheckBox3-2").setText("X");
    }

    if (formData.CheckBox4 === "Yes" || formData.CheckBox4 === "yes") {
      form.getTextField("CheckBox4-1").setText("X");
    } else {
      form.getTextField("CheckBox4-2").setText("X");
    }

    if (formData.CheckBox5 === "Yes" || formData.CheckBox5 === "yes") {
      form.getTextField("CheckBox5-1").setText("X");
    } else {
      form.getTextField("CheckBox5-2").setText("X");
    }

    // Set current date
    const now = new Date();
    form.getTextField("Date").setText(
      now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );

    // Handle CheckBox6 (numbered field)
    if (formData.CheckBox6 > 0) {
      const fieldName = `CheckBox6-${formData.CheckBox6}`;
      form.getTextField(fieldName).setText("X");
    }

    // Handle signature if provided
    if (formData.signature) {
      try {
        const response = await fetch(formData.signature);
        const pngImageBytes = await response.arrayBuffer();
        const pngImage = await pdfDoc.embedPng(pngImageBytes);
        const pngDims = pngImage.scale(0.2);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        firstPage.drawImage(pngImage, {
          x: pngDims.width + 16,
          y: pngDims.height / 26,
          width: pngDims.width,
          height: pngDims.height,
        });
      } catch (error) {
        console.warn("Failed to embed signature:", error);
      }
    }

    if (formData.CheckBox7 === "Yes" || formData.CheckBox7 === "yes") {
      form.getTextField("CheckBox7-1").setText("X");
    } else {
      form.getTextField("CheckBox7-2").setText("X");
    }

    // Flatten form (make it non-editable)
    form.flatten();

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SAHL_Form.pdf"',
    );
    res.setHeader("Content-Length", pdfBytes.length);

    // Send the PDF
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("SAHL PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate SAHL PDF" });
  }
};

export const handleViewFormPDF: RequestHandler = async (req, res) => {
  try {
    const { formType, formData } = req.body;

    switch (formType) {
      case "absa":
        return handleGenerateABSAPDF(req, res);
      case "sahl":
        return handleGenerateSAHLPDF(req, res);
      default:
        return res.status(400).json({ error: "Unsupported form type" });
    }
  } catch (error) {
    console.error("PDF viewing error:", error);
    res.status(500).json({ error: "Failed to process PDF" });
  }
};
