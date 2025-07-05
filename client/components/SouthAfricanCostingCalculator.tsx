import React, { useState } from "react";
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
import { Calculator, MapPin, Clock, Wrench, Plus, Trash2 } from "lucide-react";

interface MaterialItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface CostingCalculation {
  distanceCost: number;
  laborCost: number;
  overtimeCost: number;
  materialCost: number;
  subtotal: number;
  riskBuffer: number;
  totalCost: number;
}

interface SouthAfricanCostingCalculatorProps {
  onCalculationComplete?: (
    calculation: CostingCalculation & { materials: MaterialItem[] },
  ) => void;
}

export function SouthAfricanCostingCalculator({
  onCalculationComplete,
}: SouthAfricanCostingCalculatorProps) {
  const [distance, setDistance] = useState(0);
  const [ratePerKm, setRatePerKm] = useState(5);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:30");
  const [hourlyRate, setHourlyRate] = useState(200);
  const [riskMargin, setRiskMargin] = useState(10);
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { name: "PVC Pipes", qty: 4, unitPrice: 90, total: 360 },
    { name: "Sealant", qty: 2, unitPrice: 45, total: 90 },
  ]);

  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { name: "", qty: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const updateMaterial = (
    index: number,
    field: keyof MaterialItem,
    value: string | number,
  ) => {
    setMaterials((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === "qty" || field === "unitPrice") {
            updated.total = Number(updated.qty) * Number(updated.unitPrice);
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateCosts = (): CostingCalculation => {
    // 1. Distance Cost
    const distanceCost = distance * ratePerKm;

    // 2. Labor Cost (with overtime after 5 PM)
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startTimeDecimal = startHour + startMin / 60;
    const endTimeDecimal = endHour + endMin / 60;

    let regularHours = 0;
    let overtimeHours = 0;

    if (endTimeDecimal <= 17) {
      // No overtime
      regularHours = endTimeDecimal - startTimeDecimal;
    } else if (startTimeDecimal >= 17) {
      // All overtime
      overtimeHours = endTimeDecimal - startTimeDecimal;
    } else {
      // Split between regular and overtime
      regularHours = 17 - startTimeDecimal;
      overtimeHours = endTimeDecimal - 17;
    }

    const laborCost = regularHours * hourlyRate;
    const overtimeCost = overtimeHours * (hourlyRate * 1.5);

    // 3. Material Cost
    const materialCost = materials.reduce((sum, item) => sum + item.total, 0);

    // 4. Subtotal and Risk Buffer
    const subtotal = distanceCost + laborCost + overtimeCost + materialCost;
    const riskBuffer = subtotal * (riskMargin / 100);
    const totalCost = subtotal + riskBuffer;

    return {
      distanceCost,
      laborCost,
      overtimeCost,
      materialCost,
      subtotal,
      riskBuffer,
      totalCost,
    };
  };

  const calculation = calculateCosts();

  const handleCompleteCalculation = () => {
    onCalculationComplete?.({
      ...calculation,
      materials,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            South African Job Costing Calculator (ZAR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distance Section */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Distance & Travel Cost</h3>
            </div>
            <div>
              <Label>Distance (km)</Label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                placeholder="20"
              />
            </div>
            <div>
              <Label>Rate per km (R)</Label>
              <Input
                type="number"
                value={ratePerKm}
                onChange={(e) => setRatePerKm(Number(e.target.value))}
                placeholder="5"
              />
            </div>
            <div className="col-span-2 bg-white p-3 rounded border">
              <div className="flex justify-between">
                <span>Distance Cost:</span>
                <span className="font-bold">
                  R{calculation.distanceCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Labor Section */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 col-span-3">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Labor Time & Cost</h3>
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <Label>Hourly Rate (R)</Label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                placeholder="200"
              />
            </div>
            <div className="col-span-3 bg-white p-3 rounded border space-y-2">
              <div className="flex justify-between">
                <span>Regular Hours Cost:</span>
                <span className="font-bold">
                  R{calculation.laborCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Cost (after 5 PM):</span>
                <span className="font-bold">
                  R{calculation.overtimeCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total Labor:</span>
                <span className="font-bold">
                  R
                  {(calculation.laborCost + calculation.overtimeCost).toFixed(
                    2,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Materials Section */}
          <div className="p-4 bg-purple-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Materials</h3>
              </div>
              <Button size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price (R)</TableHead>
                  <TableHead>Total (R)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateMaterial(index, "name", e.target.value)
                        }
                        placeholder="Item name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateMaterial(index, "qty", Number(e.target.value))
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateMaterial(
                            index,
                            "unitPrice",
                            Number(e.target.value),
                          )
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="font-bold">
                      R{item.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-white p-3 rounded border">
              <div className="flex justify-between">
                <span>Total Materials:</span>
                <span className="font-bold">
                  R{calculation.materialCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Margin & Total */}
          <div className="p-4 bg-orange-50 rounded-lg space-y-4">
            <div>
              <Label>Risk Margin (%)</Label>
              <Input
                type="number"
                value={riskMargin}
                onChange={(e) => setRiskMargin(Number(e.target.value))}
                placeholder="10"
                className="w-32"
              />
            </div>

            <div className="bg-white p-4 rounded border space-y-2">
              <div className="flex justify-between">
                <span>Distance Cost:</span>
                <span>R{calculation.distanceCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor Cost:</span>
                <span>R{calculation.laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Cost:</span>
                <span>R{calculation.overtimeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Material Cost:</span>
                <span>R{calculation.materialCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Subtotal:</span>
                <span className="font-medium">
                  R{calculation.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Risk Buffer ({riskMargin}%):</span>
                <span>R{calculation.riskBuffer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>TOTAL JOB COST:</span>
                <span className="text-green-600">
                  R{calculation.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {onCalculationComplete && (
            <Button onClick={handleCompleteCalculation} className="w-full">
              Save Calculation
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
