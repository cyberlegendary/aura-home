import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Users,
  Edit3,
  Calculator,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Clock,
} from "lucide-react";
import { User, Job } from "@shared/types";

interface SalaryData {
  staffId: string;
  staffName: string;
  role: string;
  location: string;
  paymentType: "monthly" | "commission";
  baseSalary: number;
  commissionRate: number;
  completedJobs: number;
  totalEarnings: number;
  monthlyHours: number;
  overtimeHours: number;
  overtimeRate: number;
  jobsValue: number;
  deductions: number;
  netPay: number;
}

interface EnhancedStaffSalaryTrackerProps {
  currentUser: User;
  staff: User[];
  jobs: Job[];
}

export function EnhancedStaffSalaryTracker({
  currentUser,
  staff,
  jobs,
}: EnhancedStaffSalaryTrackerProps) {
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<SalaryData | null>(null);
  const [editForm, setEditForm] = useState<Partial<SalaryData>>({});

  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      calculateSalaries();
    }
  }, [isAdmin, staff, jobs]);

  const calculateSalaries = () => {
    const salaries = staff.map((member) => {
      const memberJobs = jobs.filter(
        (job) => job.assignedTo === member.id && job.status === "completed",
      );

      // Base salary rates (ZAR)
      const baseSalaries = {
        staff: 15000,
        supervisor: 25000,
        admin: 35000,
      };

      const baseSalary =
        baseSalaries[member.role as keyof typeof baseSalaries] || 15000;
      const commissionRate = member.location?.city === "Cape Town" ? 8 : 6; // % of job value
      const completedJobs = memberJobs.length;

      // Calculate job values (mock calculation)
      const jobsValue = memberJobs.reduce((sum, job) => {
        // Estimate job value based on category
        const jobValues = {
          "Geyser Assessment": 800,
          "Geyser Replacement": 3500,
          "Leak Detection": 1200,
          "Drain Blockage": 1800,
          "Camera Inspection": 1500,
          "Toilet/Shower": 2200,
        };
        return (
          sum + (jobValues[job.category as keyof typeof jobValues] || 1000)
        );
      }, 0);

      // Calculate hours (mock)
      const monthlyHours = completedJobs * 4; // 4 hours average per job
      const overtimeHours = Math.max(0, monthlyHours - 160); // Over 160 hours is overtime
      const regularHours = Math.min(monthlyHours, 160);

      const hourlyRate = baseSalary / 160; // Based on 160 hours/month
      const overtimeRate = hourlyRate * 1.5;

      // Determine payment type (mock logic)
      const paymentType: "monthly" | "commission" =
        member.role === "staff" ? "commission" : "monthly";

      let totalEarnings = 0;
      if (paymentType === "monthly") {
        totalEarnings = baseSalary + overtimeHours * overtimeRate;
      } else {
        const commissionEarnings = (jobsValue * commissionRate) / 100;
        totalEarnings = Math.max(baseSalary * 0.7, commissionEarnings); // Minimum guarantee
      }

      const deductions = totalEarnings * 0.1; // 10% for taxes/deductions
      const netPay = totalEarnings - deductions;

      return {
        staffId: member.id,
        staffName: member.name,
        role: member.role,
        location: member.location?.city || "Unknown",
        paymentType,
        baseSalary,
        commissionRate,
        completedJobs,
        totalEarnings,
        monthlyHours: regularHours,
        overtimeHours,
        overtimeRate,
        jobsValue,
        deductions,
        netPay,
      };
    });

    setSalaryData(salaries);
  };

  const handleEditSalary = (salary: SalaryData) => {
    setSelectedStaff(salary);
    setEditForm(salary);
    setShowEditModal(true);
  };

  const handleSaveSalary = () => {
    setSalaryData((prev) =>
      prev.map((salary) =>
        salary.staffId === selectedStaff?.staffId
          ? { ...salary, ...editForm }
          : salary,
      ),
    );
    setShowEditModal(false);
    setSelectedStaff(null);
    setEditForm({});
  };

  const getTotalStats = () => {
    const totalPayroll = salaryData.reduce(
      (sum, salary) => sum + salary.netPay,
      0,
    );
    const totalStaff = salaryData.length;
    const avgSalary = totalStaff > 0 ? totalPayroll / totalStaff : 0;
    const totalJobsCompleted = salaryData.reduce(
      (sum, salary) => sum + salary.completedJobs,
      0,
    );

    return { totalPayroll, totalStaff, avgSalary, totalJobsCompleted };
  };

  const stats = getTotalStats();

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            Staff Salary Tracker is only accessible to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Staff Salary Tracker (ZAR)
          </h2>
          <p className="text-gray-600">
            Manage staff salaries and commission calculations
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-xl font-bold text-green-600">
                  R{stats.totalPayroll.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff Count</p>
                <p className="text-xl font-bold text-blue-600">
                  {stats.totalStaff}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Salary</p>
                <p className="text-xl font-bold text-purple-600">
                  R{stats.avgSalary.toFixed(2)}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jobs Completed</p>
                <p className="text-xl font-bold text-orange-600">
                  {stats.totalJobsCompleted}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Salary Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Jobs Completed</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryData.map((salary) => (
                <TableRow key={salary.staffId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{salary.staffName}</span>
                      <Badge variant="outline" className="w-fit text-xs">
                        {salary.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {salary.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        salary.paymentType === "monthly"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {salary.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell>R{salary.baseSalary.toFixed(2)}</TableCell>
                  <TableCell>{salary.completedJobs}</TableCell>
                  <TableCell className="font-medium">
                    R{salary.totalEarnings.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-red-600">
                    R{salary.deductions.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    R{salary.netPay.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSalary(salary)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Johannesburg Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {salaryData
              .filter((s) => s.location === "Johannesburg")
              .map((salary) => (
                <div
                  key={salary.staffId}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <span>{salary.staffName}</span>
                  <span className="font-bold">R{salary.netPay.toFixed(2)}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cape Town Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {salaryData
              .filter((s) => s.location === "Cape Town")
              .map((salary) => (
                <div
                  key={salary.staffId}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <span>{salary.staffName}</span>
                  <span className="font-bold">R{salary.netPay.toFixed(2)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Edit Salary Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Salary - {selectedStaff?.staffName}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Type</Label>
              <Select
                value={editForm.paymentType}
                onValueChange={(value: "monthly" | "commission") =>
                  setEditForm((prev) => ({ ...prev, paymentType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Base Salary (R)</Label>
              <Input
                type="number"
                value={editForm.baseSalary}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    baseSalary: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                value={editForm.commissionRate}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    commissionRate: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Overtime Rate (R/hour)</Label>
              <Input
                type="number"
                value={editForm.overtimeRate}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    overtimeRate: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSalary}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
