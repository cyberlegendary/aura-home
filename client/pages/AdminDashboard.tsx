import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  FileText,
  Briefcase,
  Building2,
  Plus,
  Settings,
  BarChart3,
  Calendar,
  List,
  Search,
  User,
  Package,
  AlertCircle,
  Shield,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job, Form, User as UserType, Company } from "@shared/types";
import { CreateJobModal } from "@/components/CreateJobModal";
import { CreateFormModal } from "@/components/CreateFormModal";
import { JobCalendarView } from "@/components/JobCalendarView";
import { AdvancedCalendarView } from "@/components/AdvancedCalendarView";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CreateCompanyModal } from "@/components/CreateCompanyModal";
import { StaffProfileModal } from "@/components/StaffProfileModal";
import { JobEditModal } from "@/components/JobEditModal";
import { JobCreationCalendarModal } from "@/components/JobCreationCalendarModal";
import { EnhancedStaffCalendarView } from "@/components/EnhancedStaffCalendarView";
import { JobProgressModal } from "@/components/JobProgressModal";
import { StaffSalaryTracker } from "@/components/StaffSalaryTracker";
import { StaffScheduleManager } from "@/components/StaffScheduleManager";
import { MaterialListManager } from "@/components/MaterialListManager";
import { NoncomplianceForm } from "@/components/NoncomplianceForm";
import { EnhancedLiabilityForm } from "@/components/EnhancedLiabilityForm";
import { EnhancedShiftManagement } from "@/components/EnhancedShiftManagement";
import { ClientManagement } from "@/components/ClientManagement";
import { FormSubmissionList } from "@/components/FormSubmissionCounter";
import { getCalendarVisibleJobs } from "@/utils/jobVisibility";
import { CompanyManagementModal } from "@/components/CompanyManagementModal";
import { FormEditModal } from "@/components/FormEditModal";
import { PDFFormGenerator } from "@/components/PDFFormGenerator";
import { DeletionConfirmModal } from "@/components/DeletionConfirmModal";
import { JobTimeEditor } from "@/components/JobTimeEditor";
import { StaffManagementDashboard } from "@/components/StaffManagementDashboard";
import { AdvancedStaffCalendarView } from "@/components/AdvancedStaffCalendarView";
import { ActuarialSystem } from "@/components/ActuarialSystem";
import { EnhancedStaffSalaryTracker } from "@/components/EnhancedStaffSalaryTracker";
import { EnhancedClientManagement } from "@/components/EnhancedClientManagement";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showJobEdit, setShowJobEdit] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCalendarJobCreation, setShowCalendarJobCreation] = useState(false);
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] =
    useState<string>("");
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showPDFFormGenerator, setShowPDFFormGenerator] = useState(false);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionItem, setDeletionItem] = useState<{
    type: "staff" | "company";
    id: string;
    name: string;
  } | null>(null);
  const [showJobTimeEditor, setShowJobTimeEditor] = useState(false);
  const [showJobProgress, setShowJobProgress] = useState(false);
  const [selectedJobForProgress, setSelectedJobForProgress] =
    useState<Job | null>(null);
  const [selectedJobForTimeEdit, setSelectedJobForTimeEdit] =
    useState<Job | null>(null);
  const [showEnhancedShiftManagement, setShowEnhancedShiftManagement] =
    useState(false);
  const [jobView, setJobView] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobTime, setSelectedJobTime] = useState<{
    time: string;
    date: Date;
  } | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isSettingsSpinning, setIsSettingsSpinning] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "supervisor")) {
      fetchData();
      // Set default tab to analytics for admins and apollos
      if (!activeTab) {
        setActiveTab("analytics");
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Initialize default tab for apollos and admins
    if (
      user &&
      (user.role === "admin" || user.role === "supervisor") &&
      !activeTab
    ) {
      setActiveTab("analytics");
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, formsRes, usersRes, companiesRes] = await Promise.all([
        fetch("/api/jobs", { headers }),
        fetch("/api/forms", { headers }),
        fetch("/api/auth/users", { headers }),
        fetch("/api/companies", { headers }),
      ]);

      const [jobsData, formsData, usersData, companiesData] = await Promise.all(
        [jobsRes.json(), formsRes.json(), usersRes.json(), companiesRes.json()],
      );

      setJobs(jobsData);
      setForms(formsData);
      setStaff(usersData.filter((u: UserType) => u.role === "staff"));
      setCompanies(companiesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on user permissions and search term
  const filteredJobs = React.useMemo(() => {
    // First apply user-based filtering
    const visibleJobs = user ? getCalendarVisibleJobs(jobs, user) : jobs;

    if (!searchTerm.trim()) return visibleJobs;

    const term = searchTerm.toLowerCase();
    return visibleJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        (job.insuredName && job.insuredName.toLowerCase().includes(term)) ||
        (job.claimNo && job.claimNo.toLowerCase().includes(term)) ||
        (job.policyNo && job.policyNo.toLowerCase().includes(term)) ||
        (job.riskAddress && job.riskAddress.toLowerCase().includes(term)),
    );
  }, [jobs, searchTerm, user]);

  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    completedJobs: jobs.filter((j) => j.status === "completed").length,
    totalStaff: staff.length,
    totalForms: forms.length,
    totalCompanies: companies.length,
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

  const handleCreateJobFromCalendar = (timeSlot: string, date: Date) => {
    setSelectedJobTime({ time: timeSlot, date });
    setShowCreateJob(true);
  };

  const handleMoveJob = async (
    jobId: string,
    newTime: string,
    newDate: Date,
  ) => {
    try {
      const newDueDate = new Date(newDate);
      const [hours, minutes] = newTime.split(":").map(Number);
      newDueDate.setHours(hours, minutes);

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
        body: JSON.stringify({ dueDate: newDueDate.toISOString() }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to move job:", error);
    }
  };

  const handleExtendJob = async (jobId: string, duration: number) => {
    // Implementation for extending job duration
    console.log("Extending job", jobId, "by", duration, "minutes");
  };

  const handleUserClick = (user: UserType) => {
    setSelectedUser(user);
    setShowUserManagement(true);
  };

  const handleJobEdit = (job: Job) => {
    setSelectedJob(job);
    setShowJobEdit(true);
  };

  const handleSettingsClick = () => {
    setIsSettingsSpinning(true);
    setTimeout(() => {
      setShowSettingsDropdown(!showSettingsDropdown);
      setIsSettingsSpinning(false);
    }, 300);
  };

  const handleTabSelect = (tabValue: string) => {
    setActiveTab(tabValue);
    setShowSettingsDropdown(false);
  };

  const handleCreateJobWithTime = (
    staffId: string,
    timeSlot: string,
    date: Date,
  ) => {
    // Set the selected time and date for job creation
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes);

    setSelectedJobTime({
      time: timeSlot,
      date: scheduledDate,
      staffId, // Add staff ID to the selected job time
    });

    // Pre-select the staff member
    setSelectedJob(null); // Clear any existing job
    setShowCreateJob(true);
  };

  const handleCompanyManage = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyManagement(true);
  };

  const handleFormEdit = (form: Form) => {
    setSelectedForm(form);
    setShowFormEdit(true);
  };

  const handleJobTimeChange = async (
    jobId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) => {
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
        body: JSON.stringify({
          dueDate: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job time");
      }
    } catch (error) {
      console.error("Error updating job time:", error);
    }
  };

  const handleJobUpdate = async (jobId: string, updates: Partial<Job>) => {
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
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJobForProgress(job);
    setShowJobProgress(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
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
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  JobFlow Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to jobs tab and show all jobs
              const tabElement = document.querySelector(
                '[value="jobs"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
              setSearchTerm("");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
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

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to jobs tab and filter pending
              const tabElement = document.querySelector(
                '[value="jobs"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
              setSearchTerm("pending");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to staff tab
              const tabElement = document.querySelector(
                '[value="staff"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Staff Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalStaff}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to forms tab
              const tabElement = document.querySelector(
                '[value="forms"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Forms
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalForms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab || "analytics"}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            {user?.role === "supervisor" ? (
              // Apollo view - Only main tabs + settings dropdown
              <div className="flex items-center gap-2 w-full">
                <TabsList className="flex-1">
                  <TabsTrigger value="jobs">Jobs</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSettingsClick}
                    className="ml-2"
                  >
                    <Settings
                      className={`h-4 w-4 transition-transform duration-300 ${
                        isSettingsSpinning ? "animate-spin" : ""
                      }`}
                    />
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                  {showSettingsDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => handleTabSelect("calendar")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Calendar
                        </button>
                        <button
                          onClick={() => handleTabSelect("salary")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Salary
                        </button>
                        <button
                          onClick={() => handleTabSelect("materials")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Materials
                        </button>
                        <button
                          onClick={() => handleTabSelect("clients")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Clients
                        </button>
                        <button
                          onClick={() => handleTabSelect("forms")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Forms
                        </button>
                        <button
                          onClick={() => handleTabSelect("staff")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Staff
                        </button>
                        <button
                          onClick={() => handleTabSelect("staff-mgmt")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Staff Mgmt
                        </button>
                        <button
                          onClick={() => handleTabSelect("actuarial")}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Actuarial
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Admin view - All tabs visible
              <TabsList className="grid w-full grid-cols-12">
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="salary">Salary</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="forms">Forms</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="staff-mgmt">Staff Mgmt</TabsTrigger>
                {user?.role === "admin" && (
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                )}
                <TabsTrigger value="actuarial">Actuarial</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            )}
          </div>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Job Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => setShowCreateJob(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Quick Create
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCalendarJobCreation(true)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Job
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* View Toggle */}
                <div className="mb-4 flex space-x-2">
                  <Button
                    variant={jobView === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setJobView("calendar")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar View
                  </Button>
                  <Button
                    variant={jobView === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setJobView("list")}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List View
                  </Button>
                </div>

                {/* Calendar View */}
                {jobView === "calendar" && (
                  <div className="mb-6">
                    <AdvancedCalendarView
                      jobs={filteredJobs}
                      staff={staff}
                      onCreateJob={handleCreateJobFromCalendar}
                      onMoveJob={handleMoveJob}
                      onExtendJob={handleExtendJob}
                    />
                  </div>
                )}

                {/* List View */}
                {jobView === "list" && (
                  <div className="space-y-4">
                    {filteredJobs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm
                          ? `No jobs found matching "${searchTerm}"`
                          : "No jobs found. Create your first job to get started."}
                      </div>
                    ) : (
                      filteredJobs.map((job) => (
                        <div
                          key={job.id}
                          className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                          onDoubleClick={() => {
                            if (user?.role === "admin") {
                              setSelectedJobForTimeEdit(job);
                              setShowJobTimeEditor(true);
                            } else {
                              handleJobEdit(job);
                            }
                          }}
                          title={
                            user?.role === "admin"
                              ? "Double-click to edit job time"
                              : "Double-click to edit job"
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="font-medium" title={job.title}>
                                {job.title.length > 12
                                  ? `${job.title.substring(0, 12)}..`
                                  : job.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {job.description}
                              </p>
                              <div className="text-xs text-gray-500 space-y-1">
                                {job.claimNo && <p>Claim: {job.claimNo}</p>}
                                {job.insuredName && (
                                  <p>Client: {job.insuredName}</p>
                                )}
                                {job.riskAddress && (
                                  <p>Address: {job.riskAddress}</p>
                                )}
                                {job.excess && (
                                  <p className="text-green-600">
                                    Excess: {job.excess}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
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
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>
                              Assigned to:{" "}
                              {staff.find((s) => s.id === job.assignedTo)
                                ?.name || "Unassigned"}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span>
                                {new Date(job.createdAt).toDateString()}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleJobEdit(job)}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Calendar Tab */}
          <TabsContent value="calendar">
            <div className="space-y-6">
              {/* Staff Selection Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Staff Calendar Management</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowCalendarJobCreation(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule New Job
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">
                      Select Staff Member to View Calendar
                    </h3>
                    <div className="max-w-md">
                      <Select
                        value={selectedStaffForCalendar}
                        onValueChange={setSelectedStaffForCalendar}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{member.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {
                                    jobs.filter(
                                      (j) => j.assignedTo === member.id,
                                    ).length
                                  }{" "}
                                  jobs
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <EnhancedStaffCalendarView
                    jobs={filteredJobs}
                    staff={staff}
                    currentUser={user}
                    onJobUpdate={handleJobUpdate}
                    onJobClick={handleJobClick}
                    onCreateJob={(date, timeSlot) => {
                      // Create job with the selected date and time
                      const [hours, minutes] = timeSlot.split(":").map(Number);
                      const jobDateTime = new Date(date);
                      jobDateTime.setHours(hours, minutes, 0, 0);

                      setSelectedJobTime({
                        date: jobDateTime.toISOString(),
                        time: timeSlot,
                      });
                      setShowCreateJob(true);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Form Management</CardTitle>
                  <div className="space-x-2">
                    <Button size="sm" onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Form
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPDFFormGenerator(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate from PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Material Forms Templates Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Material Forms Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Material List Template */}
                      <div className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <Package className="h-6 w-6 text-blue-600 mr-3" />
                            <div>
                              <h4 className="font-medium text-blue-900">
                                Material List
                              </h4>
                              <p className="text-sm text-blue-600">
                                Complete material tracking
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            Template
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Track standard items, sizes, manufacturers, quantities
                          requested vs used
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            if (jobs.length > 0) {
                              // Open material list for first available job as template
                              setSelectedJobForProgress(jobs[0]);
                              setShowJobProgress(true);
                            }
                          }}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>

                      {/* Non Compliance Template */}
                      <div className="border rounded-lg p-4 hover:bg-red-50 cursor-pointer transition-colors border-red-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                            <div>
                              <h4 className="font-medium text-red-900">
                                Non Compliance
                              </h4>
                              <p className="text-sm text-red-600">
                                33-question compliance form
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800"
                          >
                            Template
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Comprehensive compliance assessment from cold vacuum
                          breaker to pipe types
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            if (jobs.length > 0) {
                              // Open non-compliance form for first available job as template
                              setSelectedJobForProgress(jobs[0]);
                              setShowJobProgress(true);
                            }
                          }}
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>

                      {/* Enhanced Liability Template */}
                      <div className="border rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors border-green-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <Shield className="h-6 w-6 text-green-600 mr-3" />
                            <div>
                              <h4 className="font-medium text-green-900">
                                Enhanced Liability
                              </h4>
                              <p className="text-sm text-green-600">
                                Before/after assessment
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Template
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          8 primary assessment items, 7 before/after comparison
                          sections
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            if (jobs.length > 0) {
                              // Open liability form for first available job as template
                              setSelectedJobForProgress(jobs[0]);
                              setShowJobProgress(true);
                            }
                          }}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Standard Forms Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-gray-600" />
                      Standard Forms
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        {forms.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No forms found. Create your first form to get
                            started.
                          </div>
                        ) : (
                          forms.map((form) => (
                            <div
                              key={form.id}
                              className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleFormEdit(form)}
                              title="Click to view and edit form details"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{form.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {form.description}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {form.fields.length} fields
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {form.isTemplate && (
                                    <Badge variant="secondary">Template</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {form.restrictedToCompanies?.length === 0
                                      ? "All Companies"
                                      : `${form.restrictedToCompanies?.length || 0} Companies`}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Form Submission Summary */}
                      <div>
                        <FormSubmissionList
                          forms={forms}
                          className="sticky top-4"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab - Only for staff and supervisors */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <p className="text-sm text-gray-600">
                  {user?.role === "supervisor"
                    ? "View and manage staff (limited permissions)"
                    : "View and manage staff members"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleUserClick(member)}
                      title="Click to view staff profile and details"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-600">
                            {member.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="outline">{member.role}</Badge>
                        <p className="text-xs text-gray-500">
                          {
                            jobs.filter((j) => j.assignedTo === member.id)
                              .length
                          }{" "}
                          active jobs
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (jobs.filter((j) => j.assignedTo === member.id && j.status === "completed").length / Math.max(1, jobs.filter((j) => j.assignedTo === member.id).length)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-green-600">
                          {
                            jobs.filter(
                              (j) =>
                                j.assignedTo === member.id &&
                                j.status === "completed",
                            ).length
                          }{" "}
                          completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Management Tab - Advanced features for admins and apollos */}
          <TabsContent value="staff-mgmt">
            <StaffManagementDashboard currentUser={user} />
          </TabsContent>

          {/* Actuarial System Tab - Admin only */}
          <TabsContent value="actuarial">
            <ActuarialSystem currentUser={user} />
          </TabsContent>

          {/* Companies Tab - Restricted for supervisors */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Company Management</CardTitle>
                  {user?.role === "admin" ? (
                    <Button
                      size="sm"
                      onClick={() => setShowCreateCompany(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Company
                    </Button>
                  ) : (
                    <Badge variant="secondary">View Only</Badge>
                  )}
                </div>
                {user?.role === "supervisor" && (
                  <p className="text-sm text-amber-600">
                    You have read-only access to company information
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleCompanyManage(company)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{company.name}</h3>
                          <p className="text-sm text-gray-600">
                            {
                              jobs.filter((j) => j.companyId === company.id)
                                .length
                            }{" "}
                            active jobs
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyManage(company);
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Staff Schedule Management
                </h2>
                {user?.role === "admin" && (
                  <Button
                    onClick={() => setShowEnhancedShiftManagement(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Enhanced Shift Management
                  </Button>
                )}
              </div>
              <StaffScheduleManager
                jobs={jobs}
                staff={staff}
                currentUser={user!}
              />
            </div>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent value="salary">
            <EnhancedStaffSalaryTracker
              currentUser={user!}
              staff={staff}
              jobs={jobs}
            />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materials & Advanced Forms Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="material-lists" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="material-lists">
                        Material Lists
                      </TabsTrigger>
                      <TabsTrigger value="noncompliance">
                        Noncompliance Forms
                      </TabsTrigger>
                      <TabsTrigger value="liability">
                        Enhanced Liability
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="material-lists" className="mt-6">
                      {jobs.length > 0 ? (
                        <MaterialListManager
                          job={jobs[0]}
                          onMaterialListSave={(materialList) => {
                            console.log("Material list saved:", materialList);
                            // In real implementation: save to backend
                          }}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Select a job to manage materials
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="noncompliance" className="mt-6">
                      {jobs.length > 0 ? (
                        <NoncomplianceForm
                          job={jobs[0]}
                          assignedStaff={
                            staff.find((s) => s.id === jobs[0].assignedTo) ||
                            null
                          }
                          onSubmit={(formData) => {
                            console.log(
                              "Noncompliance form submitted:",
                              formData,
                            );
                            // In real implementation: save to backend
                          }}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Select a job to create noncompliance form
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="liability" className="mt-6">
                      {jobs.length > 0 ? (
                        <EnhancedLiabilityForm
                          job={jobs[0]}
                          assignedStaff={
                            staff.find((s) => s.id === jobs[0].assignedTo) ||
                            null
                          }
                          onSubmit={(formData) => {
                            console.log(
                              "Enhanced liability form submitted:",
                              formData,
                            );
                            // In real implementation: save to backend
                          }}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Select a job to create enhanced liability form
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <EnhancedClientManagement currentUser={user!} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard jobs={jobs} staff={staff} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateJobModal
        open={showCreateJob}
        onOpenChange={(open) => {
          setShowCreateJob(open);
          if (!open) setSelectedJobTime(null);
        }}
        onJobCreated={fetchData}
        selectedJobTime={selectedJobTime}
      />

      <CreateFormModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onFormCreated={fetchData}
      />

      <CreateCompanyModal
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
        onCompanyCreated={fetchData}
      />

      <StaffProfileModal
        open={showUserManagement}
        onOpenChange={setShowUserManagement}
        staffMember={selectedUser}
        jobs={jobs}
        onProfileUpdated={fetchData}
      />

      <JobEditModal
        open={showJobEdit}
        onOpenChange={(open) => {
          setShowJobEdit(open);
          if (!open) setSelectedJob(null);
        }}
        job={selectedJob}
        onJobUpdated={fetchData}
      />

      <JobCreationCalendarModal
        open={showCalendarJobCreation}
        onOpenChange={setShowCalendarJobCreation}
        staff={staff}
        jobs={jobs}
        onCreateJobWithTime={handleCreateJobWithTime}
      />

      <CompanyManagementModal
        open={showCompanyManagement}
        onOpenChange={(open) => {
          setShowCompanyManagement(open);
          if (!open) setSelectedCompany(null);
        }}
        company={selectedCompany}
        onCompanyUpdated={fetchData}
      />

      <FormEditModal
        open={showFormEdit}
        onOpenChange={(open) => {
          setShowFormEdit(open);
          if (!open) setSelectedForm(null);
        }}
        form={selectedForm}
        onFormUpdated={fetchData}
        isAdmin={user?.role === "admin"}
      />

      <PDFFormGenerator
        open={showPDFFormGenerator}
        onOpenChange={setShowPDFFormGenerator}
        onFormCreated={fetchData}
      />

      <DeletionConfirmModal
        open={showDeletionConfirm}
        onOpenChange={setShowDeletionConfirm}
        title={`Delete ${deletionItem?.type === "staff" ? "Staff Member" : "Company"}`}
        description={`You are about to permanently delete this ${deletionItem?.type}. This action cannot be undone and may affect existing jobs and data.`}
        itemName={deletionItem?.name || ""}
        onConfirm={async () => {
          if (!deletionItem) return;

          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const endpoint =
            deletionItem.type === "staff"
              ? `/api/auth/users/${deletionItem.id}`
              : `/api/companies/${deletionItem.id}`;

          const response = await fetch(endpoint, {
            method: "DELETE",
            headers,
          });

          if (response.ok) {
            fetchData();
          } else {
            throw new Error("Failed to delete");
          }
        }}
      />

      <JobTimeEditor
        open={showJobTimeEditor}
        onOpenChange={(open) => {
          setShowJobTimeEditor(open);
          if (!open) setSelectedJobForTimeEdit(null);
        }}
        job={selectedJobForTimeEdit}
        onJobUpdated={fetchData}
      />

      <JobProgressModal
        job={selectedJobForProgress}
        isOpen={showJobProgress}
        onClose={() => {
          setShowJobProgress(false);
          setSelectedJobForProgress(null);
        }}
        staff={staff}
      />

      <EnhancedShiftManagement
        open={showEnhancedShiftManagement}
        onOpenChange={setShowEnhancedShiftManagement}
        staff={staff}
        currentUser={user!}
        onShiftUpdate={(assignments) => {
          console.log("Shift assignments updated:", assignments);
          // In real implementation: save to backend
          fetchData(); // Refresh data
        }}
      />
    </div>
  );
}
