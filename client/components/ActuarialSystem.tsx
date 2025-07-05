import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Calculator,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Calendar,
  Users,
  Package,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Upload,
  LineChart,
} from "lucide-react";
import { SouthAfricanCostingCalculator } from "./SouthAfricanCostingCalculator";
import { CostVisualizationCharts } from "./CostVisualizationCharts";
import { Job, User } from "@shared/types";

interface ActuarialSystemProps {
  currentUser: User;
}

interface JobCostingData {
  jobId: string;
  distanceCost: number;
  laborCost: number;
  materialCost: number;
  overtimeCost: number;
  riskMargin: number;
  expectedRevenue: number;
  finalQuote: number;
  expectedProfit: number;
  distance: number;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  materialItems: {
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  presentValue?: number;
  futureValue?: number;
  interestRate?: number;
  periods?: number;
}

interface MaterialRequest {
  id: string;
  jobId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  requestDate: string;
  status: "pending" | "ordered" | "delivered";
}

interface ActuarialFormData {
  clientName: string;
  serviceProvider: string;
  materials: string;
  estimatedCost: number;
  riskMargin: number;
  startDate: string;
  endDate: string;
  description: string;
  distance: number;
  startTime: string;
  endTime: string;
  hourlyRate: number;
}

interface RateGuide {
  id: string;
  fileName: string;
  uploadDate: string;
  ratePerKm: number;
  normalHourlyRate: number;
  overtimeMultiplier: number;
  materialRates: { [key: string]: number };
}

interface CompanyCostData {
  companyId: string;
  companyName: string;
  totalJobs: number;
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  avgJobValue: number;
}

export function ActuarialSystem({ currentUser }: ActuarialSystemProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [costingData, setCostingData] = useState<JobCostingData[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(
    [],
  );
  const [showJobCostingModal, setShowJobCostingModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<ActuarialFormData>({
    clientName: "",
    serviceProvider: "",
    materials: "",
    estimatedCost: 0,
    riskMargin: 10,
    startDate: "",
    endDate: "",
    description: "",
    distance: 0,
    startTime: "09:00",
    endTime: "17:00",
    hourlyRate: 200,
  });
  const [rateGuides, setRateGuides] = useState<RateGuide[]>([]);
  const [companyCosts, setCompanyCosts] = useState<CompanyCostData[]>([]);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [showChartView, setShowChartView] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<
    "line" | "bar" | "pie" | "timeline"
  >("line");

  // Check if user is admin
  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/jobs", { headers });
      const jobsData = await response.json();
      setJobs(jobsData);

      // Generate mock costing data for demonstration
      const mockCostingData = jobsData.map((job: Job) => ({
        jobId: job.id,
        laborCost: Math.random() * 400 + 200,
        materialCost: Math.random() * 200 + 100,
        overhead: Math.random() * 100 + 50,
        riskMargin: 10,
        expectedRevenue: Math.random() * 800 + 600,
        finalQuote: 0,
        expectedProfit: 0,
      }));

      const calculatedData = mockCostingData.map((data) => {
        const totalCost = data.laborCost + data.materialCost + data.overhead;
        const riskBuffer = totalCost * (data.riskMargin / 100);
        const finalQuote = totalCost + riskBuffer;
        const expectedProfit = data.expectedRevenue - finalQuote;

        return {
          ...data,
          finalQuote,
          expectedProfit,
        };
      });

      setCostingData(calculatedData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const calculateJobCosting = (
    laborCost: number,
    materialCost: number,
    overhead: number,
    riskMargin: number,
  ) => {
    const totalCost = laborCost + materialCost + overhead;
    const riskBuffer = totalCost * (riskMargin / 100);
    const finalQuote = totalCost + riskBuffer;

    return {
      totalCost,
      riskBuffer,
      finalQuote,
    };
  };

  const calculatePresentValue = (
    futureValue: number,
    interestRate: number,
    periods: number,
  ) => {
    return futureValue / Math.pow(1 + interestRate / 100, periods);
  };

  const calculateFutureValue = (
    presentValue: number,
    interestRate: number,
    periods: number,
  ) => {
    return presentValue * Math.pow(1 + interestRate / 100, periods);
  };

  const getTotalStats = () => {
    const totalRevenue = costingData.reduce(
      (sum, data) => sum + data.expectedRevenue,
      0,
    );
    const totalCosts = costingData.reduce(
      (sum, data) => sum + data.finalQuote,
      0,
    );
    const totalProfit = totalRevenue - totalCosts;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      profitMargin,
      jobCount: costingData.length,
    };
  };

  const handleSubmitJobCosting = () => {
    const newJobId = `ACT-${Date.now()}`;
    const calculation = calculateJobCosting(
      formData.estimatedCost * 0.6, // 60% labor
      formData.estimatedCost * 0.3, // 30% materials
      formData.estimatedCost * 0.1, // 10% overhead
      formData.riskMargin,
    );

    const newCosting: JobCostingData = {
      jobId: newJobId,
      laborCost: formData.estimatedCost * 0.6,
      materialCost: formData.estimatedCost * 0.3,
      overhead: formData.estimatedCost * 0.1,
      riskMargin: formData.riskMargin,
      expectedRevenue: calculation.finalQuote * 1.2, // 20% markup
      finalQuote: calculation.finalQuote,
      expectedProfit: calculation.finalQuote * 1.2 - calculation.finalQuote,
    };

    setCostingData((prev) => [...prev, newCosting]);
    setShowJobCostingModal(false);
    setFormData({
      clientName: "",
      serviceProvider: "",
      materials: "",
      estimatedCost: 0,
      riskMargin: 10,
      startDate: "",
      endDate: "",
      description: "",
    });
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
            Actuarial System is only accessible to administrators.
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
            <Calculator className="h-6 w-6" />
            Actuarial System
          </h2>
          <p className="text-gray-600">
            Job costing, profitability analysis, and risk management
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowJobCostingModal(true)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            New Job Analysis
          </Button>
          <Button variant="outline" onClick={() => setShowMaterialModal(true)}>
            <Package className="h-4 w-4 mr-2" />
            Material Request
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  R{stats.totalRevenue.toFixed(2)}
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
                <p className="text-sm text-gray-600">Total Costs</p>
                <p className="text-xl font-bold text-red-600">
                  R{stats.totalCosts.toFixed(2)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expected Profit</p>
                <p className="text-xl font-bold text-blue-600">
                  R{stats.totalProfit.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.profitMargin.toFixed(1)}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-xl font-bold text-orange-600">
                  {stats.jobCount}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="costing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="costing">Job Costing</TabsTrigger>
          <TabsTrigger value="calculator">SA Calculator</TabsTrigger>
          <TabsTrigger value="charts">Charts & Graphs</TabsTrigger>
          <TabsTrigger value="pdf-upload">PDF Upload</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="costing">
          <Card>
            <CardHeader>
              <CardTitle>Job Costing & Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Labor Cost</TableHead>
                    <TableHead>Material Cost</TableHead>
                    <TableHead>Overhead</TableHead>
                    <TableHead>Risk Margin</TableHead>
                    <TableHead>Final Quote</TableHead>
                    <TableHead>Expected Profit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costingData.map((data) => (
                    <TableRow key={data.jobId}>
                      <TableCell className="font-medium">
                        {data.jobId}
                      </TableCell>
                      <TableCell>${data.laborCost.toFixed(2)}</TableCell>
                      <TableCell>${data.materialCost.toFixed(2)}</TableCell>
                      <TableCell>${data.overhead.toFixed(2)}</TableCell>
                      <TableCell>{data.riskMargin}%</TableCell>
                      <TableCell className="font-medium">
                        ${data.finalQuote.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={
                          data.expectedProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        ${data.expectedProfit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            data.expectedProfit >= 0 ? "default" : "destructive"
                          }
                        >
                          {data.expectedProfit >= 0 ? "Profitable" : "Loss"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-medium">Seasonal Spike</h4>
                      <p className="text-2xl font-bold text-blue-600">+23%</p>
                      <p className="text-sm text-gray-600">
                        Winter demand increase
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <h4 className="font-medium">Avg Response Time</h4>
                      <p className="text-2xl font-bold text-green-600">2.3h</p>
                      <p className="text-sm text-gray-600">Emergency calls</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <h4 className="font-medium">Material Cost Trend</h4>
                    <p className="text-lg text-purple-600">
                      +5.2% monthly increase
                    </p>
                    <p className="text-sm text-gray-600">
                      Based on 6-month moving average
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Worker Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Freedom", "Lebo", "Keenan", "Zaundre"].map(
                    (worker, index) => (
                      <div
                        key={worker}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4" />
                          <span>{worker}</span>
                        </div>
                        <Badge
                          variant={index % 2 === 0 ? "default" : "secondary"}
                        >
                          {index % 2 === 0 ? "Available" : "Busy"}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Material Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Material tracking and inventory management coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator">
          <SouthAfricanCostingCalculator />
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium">Cost Visualization</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedChartType === "pie" ? "default" : "outline"}
                  onClick={() => setSelectedChartType("pie")}
                >
                  <PieChart className="h-4 w-4 mr-1" />
                  Pie Chart
                </Button>
                <Button
                  size="sm"
                  variant={selectedChartType === "bar" ? "default" : "outline"}
                  onClick={() => setSelectedChartType("bar")}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Bar Chart
                </Button>
                <Button
                  size="sm"
                  variant={selectedChartType === "line" ? "default" : "outline"}
                  onClick={() => setSelectedChartType("line")}
                >
                  <LineChart className="h-4 w-4 mr-1" />
                  Line Chart
                </Button>
                <Button
                  size="sm"
                  variant={
                    selectedChartType === "timeline" ? "default" : "outline"
                  }
                  onClick={() => setSelectedChartType("timeline")}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Timeline
                </Button>
              </div>
            </div>
            <CostVisualizationCharts
              costingData={costingData}
              chartType={selectedChartType}
            />
          </div>
        </TabsContent>

        <TabsContent value="pdf-upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                PDF Rate Guide Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Upload company rate guides and pricing PDFs for cross-checking
                </p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF Files
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <p>Supported features:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Company-specific rate guides</li>
                  <li>Material pricing catalogs</li>
                  <li>Labor cost standards</li>
                  <li>Cross-reference with job schedules</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Present Value Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Future Value ($)</Label>
                    <Input type="number" placeholder="1000" />
                  </div>
                  <div>
                    <Label>Interest Rate (%)</Label>
                    <Input type="number" placeholder="5" />
                  </div>
                </div>
                <div>
                  <Label>Periods (years)</Label>
                  <Input type="number" placeholder="10" />
                </div>
                <Button className="w-full">Calculate Present Value</Button>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Present Value:</p>
                  <p className="text-xl font-bold">$613.91</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Buffer Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Total Base Cost ($)</Label>
                  <Input type="number" placeholder="800" />
                </div>
                <div>
                  <Label>Risk Margin (%)</Label>
                  <Input type="number" placeholder="15" />
                </div>
                <Button className="w-full">Calculate Final Quote</Button>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <span>$800.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Buffer:</span>
                      <span>$120.00</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Final Quote:</span>
                      <span>$920.00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Costing Modal */}
      <Dialog open={showJobCostingModal} onOpenChange={setShowJobCostingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Job Cost Analysis</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Name</Label>
              <Input
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }))
                }
                placeholder="ABC Ltd"
              />
            </div>
            <div>
              <Label>Service Provider</Label>
              <Select
                value={formData.serviceProvider}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, serviceProvider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freedom">Freedom</SelectItem>
                  <SelectItem value="lebo">Lebo</SelectItem>
                  <SelectItem value="keenan">Keenan</SelectItem>
                  <SelectItem value="zaundre">Zaundre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Cost ($)</Label>
              <Input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedCost: Number(e.target.value),
                  }))
                }
                placeholder="600"
              />
            </div>
            <div>
              <Label>Risk Margin (%)</Label>
              <Input
                type="number"
                value={formData.riskMargin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    riskMargin: Number(e.target.value),
                  }))
                }
                placeholder="10"
              />
            </div>
            <div className="col-span-2">
              <Label>Materials</Label>
              <Input
                value={formData.materials}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    materials: e.target.value,
                  }))
                }
                placeholder="Pipes, sealant, fittings"
              />
            </div>
            <div className="col-span-2">
              <Label>Job Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Detailed job description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowJobCostingModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitJobCosting}>Create Analysis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
