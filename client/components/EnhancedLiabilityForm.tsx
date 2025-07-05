import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Shield,
  FileText,
  Camera,
  Signature,
  Save,
} from "lucide-react";

interface LiabilityFormData {
  id: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  incidentType: string;
  severity: string;
  description: string;
  witnessName: string;
  witnessContact: string;
  injuredPerson: string;
  injuryType: string;
  medicalAttention: boolean;
  emergencyServices: boolean;
  propertyDamage: boolean;
  estimatedCost: string;
  immediateActions: string;
  reportedBy: string;
  signature: string;
  photos: string[];
  preventiveMeasures: string;
  followUpRequired: boolean;
  followUpDetails: string;
}

interface EnhancedLiabilityFormProps {
  onSubmit: (formData: LiabilityFormData) => void;
  existingData?: LiabilityFormData;
  isSubmitting?: boolean;
}

export function EnhancedLiabilityForm({
  onSubmit,
  existingData,
  isSubmitting = false,
}: EnhancedLiabilityFormProps) {
  const [formData, setFormData] = useState<LiabilityFormData>(() => ({
    id: existingData?.id || `liability-${Date.now()}`,
    incidentDate: existingData?.incidentDate || "",
    incidentTime: existingData?.incidentTime || "",
    location: existingData?.location || "",
    incidentType: existingData?.incidentType || "",
    severity: existingData?.severity || "",
    description: existingData?.description || "",
    witnessName: existingData?.witnessName || "",
    witnessContact: existingData?.witnessContact || "",
    injuredPerson: existingData?.injuredPerson || "",
    injuryType: existingData?.injuryType || "",
    medicalAttention: existingData?.medicalAttention || false,
    emergencyServices: existingData?.emergencyServices || false,
    propertyDamage: existingData?.propertyDamage || false,
    estimatedCost: existingData?.estimatedCost || "",
    immediateActions: existingData?.immediateActions || "",
    reportedBy: existingData?.reportedBy || "",
    signature: existingData?.signature || "",
    photos: existingData?.photos || [],
    preventiveMeasures: existingData?.preventiveMeasures || "",
    followUpRequired: existingData?.followUpRequired || false,
    followUpDetails: existingData?.followUpDetails || "",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.incidentDate)
      newErrors.incidentDate = "Incident date is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.incidentType)
      newErrors.incidentType = "Incident type is required";
    if (!formData.description)
      newErrors.description = "Description is required";
    if (!formData.reportedBy)
      newErrors.reportedBy = "Reporter name is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const incidentTypes = [
    "Workplace Injury",
    "Property Damage",
    "Vehicle Accident",
    "Slip and Fall",
    "Equipment Malfunction",
    "Chemical Spill",
    "Fire Incident",
    "Security Breach",
    "Other",
  ];

  const severityLevels = [
    { value: "low", label: "Low", color: "bg-green-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-orange-500" },
    { value: "critical", label: "Critical", color: "bg-red-500" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Incident Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incidentDate">Date of Incident *</Label>
              <Input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) =>
                  setFormData({ ...formData, incidentDate: e.target.value })
                }
                className={errors.incidentDate ? "border-red-500" : ""}
              />
              {errors.incidentDate && (
                <p className="text-sm text-red-500">{errors.incidentDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="incidentTime">Time of Incident</Label>
              <Input
                id="incidentTime"
                type="time"
                value={formData.incidentTime}
                onChange={(e) =>
                  setFormData({ ...formData, incidentTime: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Specific location where incident occurred"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select
                value={formData.incidentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, incidentType: value })
                }
              >
                <SelectTrigger
                  className={errors.incidentType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.incidentType && (
                <p className="text-sm text-red-500">{errors.incidentType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Severity Level</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData({ ...formData, severity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${level.color}`}
                        />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description of Incident *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provide detailed description of what happened"
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            People Involved
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="witnessName">Witness Name</Label>
              <Input
                id="witnessName"
                value={formData.witnessName}
                onChange={(e) =>
                  setFormData({ ...formData, witnessName: e.target.value })
                }
                placeholder="Name of witness (if any)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="witnessContact">Witness Contact</Label>
              <Input
                id="witnessContact"
                value={formData.witnessContact}
                onChange={(e) =>
                  setFormData({ ...formData, witnessContact: e.target.value })
                }
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="injuredPerson">Injured Person</Label>
              <Input
                id="injuredPerson"
                value={formData.injuredPerson}
                onChange={(e) =>
                  setFormData({ ...formData, injuredPerson: e.target.value })
                }
                placeholder="Name of injured person (if any)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="injuryType">Type of Injury</Label>
              <Input
                id="injuryType"
                value={formData.injuryType}
                onChange={(e) =>
                  setFormData({ ...formData, injuryType: e.target.value })
                }
                placeholder="Description of injury"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="medicalAttention"
                checked={formData.medicalAttention}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    medicalAttention: checked as boolean,
                  })
                }
              />
              <Label htmlFor="medicalAttention">
                Medical attention required
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emergencyServices"
                checked={formData.emergencyServices}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    emergencyServices: checked as boolean,
                  })
                }
              />
              <Label htmlFor="emergencyServices">
                Emergency services called
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response & Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="immediateActions">Immediate Actions Taken</Label>
            <Textarea
              id="immediateActions"
              value={formData.immediateActions}
              onChange={(e) =>
                setFormData({ ...formData, immediateActions: e.target.value })
              }
              placeholder="What immediate actions were taken?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preventiveMeasures">Preventive Measures</Label>
            <Textarea
              id="preventiveMeasures"
              value={formData.preventiveMeasures}
              onChange={(e) =>
                setFormData({ ...formData, preventiveMeasures: e.target.value })
              }
              placeholder="What measures can prevent similar incidents?"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUpRequired"
              checked={formData.followUpRequired}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  followUpRequired: checked as boolean,
                })
              }
            />
            <Label htmlFor="followUpRequired">Follow-up action required</Label>
          </div>

          {formData.followUpRequired && (
            <div className="space-y-2">
              <Label htmlFor="followUpDetails">Follow-up Details</Label>
              <Textarea
                id="followUpDetails"
                value={formData.followUpDetails}
                onChange={(e) =>
                  setFormData({ ...formData, followUpDetails: e.target.value })
                }
                placeholder="Describe required follow-up actions"
                rows={2}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="reportedBy">Reported By *</Label>
            <Input
              id="reportedBy"
              value={formData.reportedBy}
              onChange={(e) =>
                setFormData({ ...formData, reportedBy: e.target.value })
              }
              placeholder="Name of person filing this report"
              className={errors.reportedBy ? "border-red-500" : ""}
            />
            {errors.reportedBy && (
              <p className="text-sm text-red-500">{errors.reportedBy}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Submit Liability Report
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
