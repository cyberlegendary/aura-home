import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleGetUsers,
  handleVerifyToken,
  handleUpdateUser,
  handleDeleteUser,
} from "./routes/auth";
import {
  handleCreateJob,
  handleGetJobs,
  handleUpdateJob,
  handleDeleteJob,
  handleParseJobText,
  handleCheckJobExists,
  handleGetJobNotes,
  handleAddJobNote,
} from "./routes/jobs";
import {
  handleCreateForm,
  handleGetForms,
  handleGetForm,
  handleUpdateForm,
  handleDeleteForm,
  handleSubmitForm,
  handleGetFormSubmissions,
  handleParseFormSchema,
} from "./routes/forms";
import {
  handleCreateCompany,
  handleGetCompanies,
  handleGetCompany,
  handleUpdateCompany,
  handleDeleteCompany,
} from "./routes/companies";
import {
  handleGetStaffProfile,
  handleUpdateStaffProfile,
  handleGetStaffPhotos,
  handleUploadJobPhoto,
  handleGetJobPhotos,
  handleCheckIn,
} from "./routes/staff";
import { handleSendJobCompletionEmail } from "./routes/email";
import { handleGenerateABSAPDF, handleViewFormPDF } from "./routes/pdf";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Job Management System API v1.0" });
  });

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/verify", handleVerifyToken);
  app.get("/api/auth/users", handleGetUsers);
  app.put("/api/auth/users/:id", handleUpdateUser);
  app.delete("/api/auth/users/:id", handleDeleteUser);

  // Job routes
  app.post("/api/jobs", handleCreateJob);
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/jobs/check-exists", handleCheckJobExists);
  app.put("/api/jobs/:id", handleUpdateJob);
  app.delete("/api/jobs/:id", handleDeleteJob);
  app.post("/api/jobs/parse", handleParseJobText);

  // Job notes routes
  app.get("/api/jobs/:jobId/notes", handleGetJobNotes);
  app.post("/api/jobs/:jobId/notes", handleAddJobNote);

  // Form routes
  app.post("/api/forms", handleCreateForm);
  app.get("/api/forms", handleGetForms);
  app.get("/api/forms/:id", handleGetForm);
  app.put("/api/forms/:id", handleUpdateForm);
  app.delete("/api/forms/:id", handleDeleteForm);
  app.post("/api/forms/parse-schema", handleParseFormSchema);

  // Form submission routes
  app.post("/api/form-submissions", handleSubmitForm);
  app.get("/api/form-submissions", handleGetFormSubmissions);

  // Company routes
  app.post("/api/companies", handleCreateCompany);
  app.get("/api/companies", handleGetCompanies);
  app.get("/api/companies/:id", handleGetCompany);
  app.put("/api/companies/:id", handleUpdateCompany);
  app.delete("/api/companies/:id", handleDeleteCompany);

  // Staff profile routes
  app.get("/api/staff/profile/:staffId", handleGetStaffProfile);
  app.put("/api/staff/profile/:staffId", handleUpdateStaffProfile);
  app.get("/api/staff/:staffId/photos", handleGetStaffPhotos);
  app.post("/api/staff/:staffId/photos", handleUploadJobPhoto);
  app.get("/api/jobs/:jobId/photos", handleGetJobPhotos);
  app.post("/api/staff/:staffId/checkin", handleCheckIn);

  // Email routes
  app.post("/api/email/job-completion", handleSendJobCompletionEmail);

  // PDF routes
  app.post("/api/pdf/absa", handleGenerateABSAPDF);
  app.post("/api/pdf/view", handleViewFormPDF);

  // Legacy demo route
  app.get("/api/demo", handleDemo);

  return app;
}
