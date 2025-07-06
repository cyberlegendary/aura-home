import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Users,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  Search,
  Eye,
  Plus,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Route,
  Navigation,
} from "lucide-react";
import { User as UserType, Job, Form, FormSubmission } from "@shared/types";
import { StaffImpersonationModal } from "./StaffImpersonationModal";
import { AdvancedStaffCalendarView } from "./AdvancedStaffCalendarView";

interface StaffManagementDashboardProps {
  currentUser: UserType;
}

export function StaffManagementDashboard({
  currentUser,
}: StaffManagementDashboardProps) {
  const [staff, setStaff] = useState<UserType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<UserType | null>(null);
  const [showImpersonation, setShowImpersonation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showJobCreation, setShowJobCreation] = useState(false);
  const [selectedStaffForJob, setSelectedStaffForJob] =
    useState<UserType | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] =
    useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all data in parallel
      const [staffRes, jobsRes, formsRes, submissionsRes] = await Promise.all([
        fetch("/api/auth/users", { headers }),
        fetch("/api/jobs", { headers }),
        fetch("/api/forms", { headers }),
        fetch("/api/form-submissions", { headers }),
      ]);

      const [staffData, jobsData, formsData, submissionsData] =
        await Promise.all([
          staffRes.json(),
          jobsRes.json(),
          formsRes.json(),
          submissionsRes.json(),
        ]);

      setStaff(staffData.filter((user: UserType) => user.role === "staff"));
      setJobs(jobsData);
      setForms(formsData);
      setFormSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobUpdate = async (jobId: string, updates: Partial<Job>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        setJobs((prev) =>
          prev.map((job) => (job.id === jobId ? updatedJob : job)),
        );
      }
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      locationFilter === "all" ||
      member.location?.city?.toLowerCase() === locationFilter.toLowerCase();

    // Status filtering based on recent activity
    if (statusFilter === "active") {
      const hasRecentJobs = jobs.some(
        (job) =>
          job.assignedTo === member.id &&
          job.status !== "completed" &&
          new Date(job.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      );
      return matchesSearch && matchesLocation && hasRecentJobs;
    }

    return matchesSearch && matchesLocation;
  });

  const getStaffStats = (staffMember: UserType) => {
    const staffJobs = jobs.filter((job) => job.assignedTo === staffMember.id);
    const staffSubmissions = formSubmissions.filter(
      (sub) => sub.submittedBy === staffMember.id,
    );

    const completedJobs = staffJobs.filter(
      (job) => job.status === "completed",
    ).length;
    const activeJobs = staffJobs.filter(
      (job) => job.status !== "completed",
    ).length;
    const totalSubmissions = staffSubmissions.length;

    return {
      totalJobs: staffJobs.length,
      completedJobs,
      activeJobs,
      totalSubmissions,
      completionRate:
        staffJobs.length > 0 ? (completedJobs / staffJobs.length) * 100 : 0,
    };
  };

  const handleStaffClick = (staffMember: UserType) => {
    setSelectedStaff(staffMember);
    setShowImpersonation(true);
  };

  const formatLocation = (location: UserType["location"]) => {
    if (!location) return "Unknown";
    return location.city || "Unknown";
  };

  const canManageStaff =
    currentUser.role === "admin" ||
    currentUser.role === "supervisor" ||
    currentUser.location?.city === "Cape Town";

  if (!canManageStaff) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            You don't have permission to access staff management features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-gray-600">
            Manage staff members and their assignments
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredStaff.length} staff members
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="calendar">Advanced Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search staff..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={locationFilter}
                  onValueChange={setLocationFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="johannesburg">Johannesburg</SelectItem>
                    <SelectItem value="cape town">Cape Town</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="active">Active This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading staff data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((staffMember) => {
                const stats = getStaffStats(staffMember);

                return (
                  <Card
                    key={staffMember.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleStaffClick(staffMember)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {staffMember.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              @{staffMember.username}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {staffMember.role}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {formatLocation(staffMember.location)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="font-medium text-blue-900">
                              {stats.activeJobs}
                            </div>
                            <div className="text-blue-600">Active Jobs</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="font-medium text-green-900">
                              {stats.completedJobs}
                            </div>
                            <div className="text-green-600">Completed</div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span>{Math.round(stats.completionRate)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${stats.completionRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <FileText className="h-3 w-3" />
                            {stats.totalSubmissions} forms
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <AdvancedStaffCalendarView
            jobs={jobs}
            staff={staff}
            onJobUpdate={handleJobUpdate}
            onJobClick={(job) => {
              // Handle job click if needed
            }}
            currentUser={currentUser}
            selectedStaffId={selectedStaffForCalendar}
            onStaffChange={setSelectedStaffForCalendar}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold">{staff.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold">
                      {jobs.filter((job) => job.status !== "completed").length}
                    </p>
                  </div>
                  <Briefcase className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                    <p className="text-2xl font-bold">
                      {jobs.filter((job) => job.status === "completed").length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Form Submissions</p>
                    <p className="text-2xl font-bold">
                      {formSubmissions.length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Distribution by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Johannesburg", "Cape Town", "Unknown"].map((location) => {
                  const count = staff.filter(
                    (s) => formatLocation(s.location) === location,
                  ).length;
                  const percentage =
                    staff.length > 0 ? (count / staff.length) * 100 : 0;

                  return (
                    <div key={location}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{location}</span>
                        <span>
                          {count} staff ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Impersonation Modal */}
      {selectedStaff && (
        <StaffImpersonationModal
          isOpen={showImpersonation}
          onClose={() => {
            setShowImpersonation(false);
            setSelectedStaff(null);
          }}
          selectedStaff={selectedStaff}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
