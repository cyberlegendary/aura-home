import { RequestHandler } from "express";
import nodemailer from "nodemailer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

// Email configuration
const transporter = nodemailer.createTransport({
  host: "mail.bbplumbers.co.za",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "info@bbplumbers.co.za",
    pass: "f+rExbEPKZNj",
  },
});

interface JobCompletionData {
  job: {
    id: string;
    jobNumber: string;
    title: string;
    description: string;
    category?: string;
    spmNo?: string;
    underwriter?: string;
    claimStatus?: string;
    assignedTo: string;
    completedAt: string;
  };
  forms: Array<{
    id: string;
    name: string;
    data: Record<string, any>;
    submittedAt: string;
    submittedBy: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt: string;
  }>;
}

export const handleSendJobCompletionEmail: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { jobData }: { jobData: JobCompletionData } = req.body;

    if (!jobData) {
      return res.status(400).json({ error: "Job data is required" });
    }

    // Generate PDF report
    const reportPdf = await generateJobReport(jobData);

    // Prepare attachments
    const attachments = [
      {
        filename: `Job_Report_${jobData.job.jobNumber}.pdf`,
        content: reportPdf,
        contentType: "application/pdf",
      },
    ];

    // Add form PDFs if available
    for (const form of jobData.forms) {
      if (form.name.toLowerCase().includes("absa")) {
        const formPdf = await generateABSAForm(form.data, jobData.job);
        attachments.push({
          filename: `ABSA_Form_${jobData.job.jobNumber}.pdf`,
          content: formPdf,
          contentType: "application/pdf",
        });
      }
      // Add other form types as needed
    }

    // Email content
    const emailContent = `
      <h2>Job Completion Report</h2>
      <p><strong>Job Number:</strong> ${jobData.job.jobNumber}</p>
      <p><strong>Title:</strong> ${jobData.job.title}</p>
      <p><strong>Category:</strong> ${jobData.job.category || "N/A"}</p>
      <p><strong>SPM No:</strong> ${jobData.job.spmNo || "N/A"}</p>
      <p><strong>Underwriter:</strong> ${jobData.job.underwriter || "N/A"}</p>
      <p><strong>Claim Status:</strong> ${jobData.job.claimStatus || "N/A"}</p>
      <p><strong>Assigned To:</strong> ${jobData.job.assignedTo}</p>
      <p><strong>Completed At:</strong> ${new Date(jobData.job.completedAt).toLocaleString()}</p>

      <h3>Forms Submitted:</h3>
      <ul>
        ${jobData.forms
          .map(
            (form) => `
          <li>${form.name} - Submitted by ${form.submittedBy} on ${new Date(form.submittedAt).toLocaleString()}</li>
        `,
          )
          .join("")}
      </ul>

      <h3>Photos Attached:</h3>
      <p>${jobData.photos.length} photos have been included in the attached report.</p>

      <p>Please find the complete job report and forms attached to this email.</p>

      <p>Best regards,<br>BB Plumbing Team</p>
    `;

    // Send email
    await transporter.sendMail({
      from: "info@bbplumbers.co.za",
      to: "yashen@bbplumbing.co.za",
      subject: `Job Completion Report - ${jobData.job.jobNumber}`,
      html: emailContent,
      attachments,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

async function generateJobReport(jobData: JobCompletionData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size

  const { width, height } = page.getSize();
  const fontSize = 12;
  const titleFontSize = 16;

  let yPosition = height - 50;

  // Title
  page.drawText("Job Completion Report", {
    x: 50,
    y: yPosition,
    size: titleFontSize,
  });

  yPosition -= 40;

  // Job details
  const jobDetails = [
    `Job Number: ${jobData.job.jobNumber}`,
    `Title: ${jobData.job.title}`,
    `Description: ${jobData.job.description}`,
    `Category: ${jobData.job.category || "N/A"}`,
    `SPM No: ${jobData.job.spmNo || "N/A"}`,
    `Underwriter: ${jobData.job.underwriter || "N/A"}`,
    `Claim Status: ${jobData.job.claimStatus || "N/A"}`,
    `Assigned To: ${jobData.job.assignedTo}`,
    `Completed At: ${new Date(jobData.job.completedAt).toLocaleString()}`,
  ];

  for (const detail of jobDetails) {
    page.drawText(detail, {
      x: 50,
      y: yPosition,
      size: fontSize,
    });
    yPosition -= 20;
  }

  yPosition -= 20;

  // Forms section
  page.drawText("Forms Submitted:", {
    x: 50,
    y: yPosition,
    size: fontSize + 2,
  });
  yPosition -= 25;

  for (const form of jobData.forms) {
    page.drawText(
      `• ${form.name} - ${form.submittedBy} (${new Date(form.submittedAt).toLocaleDateString()})`,
      {
        x: 70,
        y: yPosition,
        size: fontSize,
      },
    );
    yPosition -= 18;
  }

  yPosition -= 20;

  // Photos section
  page.drawText("Photos:", {
    x: 50,
    y: yPosition,
    size: fontSize + 2,
  });
  yPosition -= 25;

  page.drawText(`Total photos attached: ${jobData.photos.length}`, {
    x: 70,
    y: yPosition,
    size: fontSize,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function generateABSAForm(
  formData: Record<string, any>,
  jobData: any,
): Promise<Buffer> {
  // This would be similar to the provided code but adapted for our structure
  // For now, return a basic PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  page.drawText("ABSA Form", {
    x: 50,
    y: 700,
    size: 16,
  });

  // Add form data
  let yPos = 650;
  for (const [key, value] of Object.entries(formData)) {
    if (yPos < 100) break; // Prevent overflow
    page.drawText(`${key}: ${value}`, {
      x: 50,
      y: yPos,
      size: 10,
    });
    yPos -= 15;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
