import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react";

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

interface CostVisualizationChartsProps {
  costingData: Array<{
    jobId: string;
    distanceCost: number;
    laborCost: number;
    materialCost: number;
    overtimeCost: number;
    finalQuote: number;
    expectedProfit: number;
  }>;
  chartType: "line" | "bar" | "pie" | "timeline";
}

export function CostVisualizationCharts({
  costingData,
  chartType,
}: CostVisualizationChartsProps) {
  // Calculate aggregated data for charts
  const totalDistanceCost = costingData.reduce(
    (sum, job) => sum + job.distanceCost,
    0,
  );
  const totalLaborCost = costingData.reduce(
    (sum, job) => sum + job.laborCost,
    0,
  );
  const totalMaterialCost = costingData.reduce(
    (sum, job) => sum + job.materialCost,
    0,
  );
  const totalOvertimeCost = costingData.reduce(
    (sum, job) => sum + job.overtimeCost,
    0,
  );
  const totalRevenue = costingData.reduce(
    (sum, job) => sum + job.finalQuote,
    0,
  );

  // Pie Chart Data (Cost Breakdown)
  const pieChartData = [
    { name: "Distance", value: totalDistanceCost, color: "#3B82F6" },
    { name: "Labor", value: totalLaborCost, color: "#10B981" },
    { name: "Materials", value: totalMaterialCost, color: "#F59E0B" },
    { name: "Overtime", value: totalOvertimeCost, color: "#EF4444" },
  ];

  // Bar Chart Data (Job Comparison)
  const barChartData = costingData.slice(0, 8).map((job) => ({
    jobId: job.jobId.substring(0, 8),
    cost: job.finalQuote,
    profit: job.expectedProfit,
  }));

  // Line Chart Data (Timeline)
  const lineChartData = costingData.slice(0, 10).map((job, index) => ({
    period: `Job ${index + 1}`,
    revenue: job.finalQuote,
    costs: job.finalQuote - job.expectedProfit,
  }));

  const renderMockChart = (
    type: string,
    data: any[],
    title: string,
    color: string,
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {type === "pie" && <PieChart className="h-4 w-4" />}
          {type === "bar" && <BarChart3 className="h-4 w-4" />}
          {type === "line" && <TrendingUp className="h-4 w-4" />}
          {type === "timeline" && <Activity className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg relative overflow-hidden">
          {type === "pie" && (
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-8 border-gray-200 relative">
                {/* Mock pie segments */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(
                      #3B82F6 0deg ${(totalDistanceCost / (totalDistanceCost + totalLaborCost + totalMaterialCost + totalOvertimeCost)) * 360}deg,
                      #10B981 ${(totalDistanceCost / (totalDistanceCost + totalLaborCost + totalMaterialCost + totalOvertimeCost)) * 360}deg ${((totalDistanceCost + totalLaborCost) / (totalDistanceCost + totalLaborCost + totalMaterialCost + totalOvertimeCost)) * 360}deg,
                      #F59E0B ${((totalDistanceCost + totalLaborCost) / (totalDistanceCost + totalLaborCost + totalMaterialCost + totalOvertimeCost)) * 360}deg ${((totalDistanceCost + totalLaborCost + totalMaterialCost) / (totalDistanceCost + totalLaborCost + totalMaterialCost + totalOvertimeCost)) * 360}deg,
                      #EF4444 ${((totalDistanceCost + totalLaborCost + totalMaterialCost) / (totalDistanceCost + totalLaborCost + totalMaterialCost + totalOvertimeCost)) * 360}deg 360deg
                    )`,
                  }}
                />
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Total</div>
                    <div className="font-bold">
                      R
                      {(
                        totalDistanceCost +
                        totalLaborCost +
                        totalMaterialCost +
                        totalOvertimeCost
                      ).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "bar" && (
            <div className="w-full h-full flex items-end justify-center gap-2 p-4">
              {barChartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 bg-blue-500 rounded-t"
                    style={{
                      height: `${Math.max((item.cost / Math.max(...barChartData.map((d) => d.cost))) * 150, 20)}px`,
                    }}
                  />
                  <div className="text-xs mt-1 transform -rotate-45 origin-top-left">
                    {item.jobId}
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === "line" && (
            <div className="w-full h-full relative p-4">
              <svg width="100%" height="100%" className="absolute inset-0">
                {lineChartData.map((item, index) => {
                  if (index === 0) return null;
                  const x1 = ((index - 1) / (lineChartData.length - 1)) * 100;
                  const x2 = (index / (lineChartData.length - 1)) * 100;
                  const y1 =
                    80 -
                    (lineChartData[index - 1].revenue /
                      Math.max(...lineChartData.map((d) => d.revenue))) *
                      60;
                  const y2 =
                    80 -
                    (item.revenue /
                      Math.max(...lineChartData.map((d) => d.revenue))) *
                      60;
                  return (
                    <line
                      key={index}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                  );
                })}
                {lineChartData.map((item, index) => {
                  const x = (index / (lineChartData.length - 1)) * 100;
                  const y =
                    80 -
                    (item.revenue /
                      Math.max(...lineChartData.map((d) => d.revenue))) *
                      60;
                  return (
                    <circle
                      key={index}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="3"
                      fill="#3B82F6"
                    />
                  );
                })}
              </svg>
            </div>
          )}

          {type === "timeline" && (
            <div className="w-full h-full flex flex-col justify-center p-4">
              {costingData.slice(0, 5).map((job, index) => (
                <div key={index} className="flex items-center gap-4 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 bg-gray-100 rounded p-2">
                    <div className="text-xs font-medium">
                      {job.jobId.substring(0, 12)}
                    </div>
                    <div className="text-xs text-gray-600">
                      R{job.finalQuote.toFixed(2)}
                    </div>
                  </div>
                  <Badge
                    variant={job.expectedProfit > 0 ? "default" : "destructive"}
                  >
                    R{job.expectedProfit.toFixed(0)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend for pie chart */}
        {type === "pie" && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs">
                  {item.name}: R{item.value.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartType === "pie" &&
          renderMockChart("pie", pieChartData, "Cost Breakdown", "#3B82F6")}
        {chartType === "bar" &&
          renderMockChart("bar", barChartData, "Job Comparison", "#10B981")}
        {chartType === "line" &&
          renderMockChart("line", lineChartData, "Revenue Trend", "#F59E0B")}
        {chartType === "timeline" &&
          renderMockChart("timeline", costingData, "Job Timeline", "#EF4444")}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Financial Summary (ZAR)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Revenue:</span>
              <span className="font-bold text-green-600">
                R{totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Distance Costs:</span>
              <span>R{totalDistanceCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Labor Costs:</span>
              <span>R{totalLaborCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Material Costs:</span>
              <span>R{totalMaterialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Overtime Costs:</span>
              <span>R{totalOvertimeCost.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm font-medium">Net Profit:</span>
              <span className="font-bold text-blue-600">
                R
                {costingData
                  .reduce((sum, job) => sum + job.expectedProfit, 0)
                  .toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
