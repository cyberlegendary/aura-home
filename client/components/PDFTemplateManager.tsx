import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  Plus,
  Edit,
  Trash2,
  Download,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Map,
} from "lucide-react";
import { Form } from "@shared/types";

interface PDFTemplate {
  id: string;
  name: string;
  formId: string;
  formName: string;
  templateFile: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

interface FieldMapping {
  id: string;
  formFieldId: string;
  formFieldName: string;
  pdfFieldName: string;
  fieldType: "text" | "checkbox" | "radio" | "signature";
  transform?: "uppercase" | "lowercase" | "date" | "none";
}

interface PDFTemplateManagerProps {
  forms: Form[];
  onTemplateCreated?: (template: PDFTemplate) => void;
  onTemplateUpdated?: (template: PDFTemplate) => void;
  onTemplateDeleted?: (templateId: string) => void;
}

export function PDFTemplateManager({
  forms,
  onTemplateCreated,
  onTemplateUpdated,
  onTemplateDeleted,
}: PDFTemplateManagerProps) {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [templateForm, setTemplateForm] = useState({
    name: "",
    formId: "",
    templateFile: null as File | null,
  });

  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/pdf-templates", { headers });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setError("Failed to load PDF templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (
      !templateForm.name ||
      !templateForm.formId ||
      !templateForm.templateFile
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("name", templateForm.name);
      formData.append("formId", templateForm.formId);
      formData.append("templateFile", templateForm.templateFile);
      formData.append("fieldMappings", JSON.stringify(fieldMappings));

      const response = await fetch("/api/pdf-templates", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates([...templates, newTemplate]);
        onTemplateCreated?.(newTemplate);
        setShowCreateModal(false);
        resetForm();
      } else {
        throw new Error("Failed to create template");
      }
    } catch (error) {
      console.error("Failed to create template:", error);
      setError("Failed to create PDF template");
    }
  };

  const handleEditTemplate = (template: PDFTemplate) => {
    setSelectedTemplate(template);
    setFieldMappings(template.fieldMappings);
    setShowEditModal(true);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(
        `/api/pdf-templates/${selectedTemplate.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            fieldMappings,
          }),
        },
      );

      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplates(
          templates.map((t) =>
            t.id === updatedTemplate.id ? updatedTemplate : t,
          ),
        );
        onTemplateUpdated?.(updatedTemplate);
        setShowEditModal(false);
        setSelectedTemplate(null);
      } else {
        throw new Error("Failed to update template");
      }
    } catch (error) {
      console.error("Failed to update template:", error);
      setError("Failed to update PDF template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this PDF template?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`/api/pdf-templates/${templateId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== templateId));
        onTemplateDeleted?.(templateId);
      } else {
        throw new Error("Failed to delete template");
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
      setError("Failed to delete PDF template");
    }
  };

  const resetForm = () => {
    setTemplateForm({ name: "", formId: "", templateFile: null });
    setFieldMappings([]);
    setError("");
  };

  const addFieldMapping = () => {
    const selectedForm = forms.find((f) => f.id === templateForm.formId);
    if (!selectedForm) return;

    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      formFieldId: "",
      formFieldName: "",
      pdfFieldName: "",
      fieldType: "text",
      transform: "none",
    };

    setFieldMappings([...fieldMappings, newMapping]);
  };

  const updateFieldMapping = (
    index: number,
    updates: Partial<FieldMapping>,
  ) => {
    const updated = [...fieldMappings];
    updated[index] = { ...updated[index], ...updates };
    setFieldMappings(updated);
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const selectedForm = forms.find((f) => f.id === templateForm.formId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">PDF Template Manager</h2>
          <p className="text-gray-600">
            Manage PDF templates for form data export
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600">{template.formName}</p>
                </div>
                <Badge variant="outline">
                  {template.fieldMappings.length} mappings
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create PDF Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formSelect">Form</Label>
                <Select
                  value={templateForm.formId}
                  onValueChange={(value) =>
                    setTemplateForm((prev) => ({ ...prev, formId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a form" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateFile">PDF Template File</Label>
              <Input
                id="templateFile"
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateFile: e.target.files?.[0] || null,
                  }))
                }
              />
              <p className="text-xs text-gray-600">
                Upload a PDF file that will serve as the template for this form
              </p>
            </div>

            {/* Field Mapping Section */}
            {selectedForm && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Field Mappings</h3>
                  <Button size="sm" onClick={addFieldMapping}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Mapping
                  </Button>
                </div>

                <div className="space-y-3">
                  {fieldMappings.map((mapping, index) => (
                    <div
                      key={mapping.id}
                      className="grid grid-cols-4 gap-2 p-3 border rounded-lg"
                    >
                      <Select
                        value={mapping.formFieldId}
                        onValueChange={(value) => {
                          const field = selectedForm.fields.find(
                            (f) => f.id === value,
                          );
                          updateFieldMapping(index, {
                            formFieldId: value,
                            formFieldName: field?.label || "",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Form Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedForm.fields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="PDF Field Name"
                        value={mapping.pdfFieldName}
                        onChange={(e) =>
                          updateFieldMapping(index, {
                            pdfFieldName: e.target.value,
                          })
                        }
                      />

                      <Select
                        value={mapping.fieldType}
                        onValueChange={(value: any) =>
                          updateFieldMapping(index, { fieldType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                          <SelectItem value="signature">Signature</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Select
                          value={mapping.transform}
                          onValueChange={(value: any) =>
                            updateFieldMapping(index, { transform: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Transform</SelectItem>
                            <SelectItem value="uppercase">Uppercase</SelectItem>
                            <SelectItem value="lowercase">Lowercase</SelectItem>
                            <SelectItem value="date">Format Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFieldMapping(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Field Mappings - {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Field Mappings</h3>
                  <Button size="sm" onClick={addFieldMapping}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Mapping
                  </Button>
                </div>

                <div className="space-y-3">
                  {fieldMappings.map((mapping, index) => (
                    <div
                      key={mapping.id}
                      className="grid grid-cols-4 gap-2 p-3 border rounded-lg"
                    >
                      <div className="text-sm font-medium flex items-center">
                        {mapping.formFieldName || "Select field"}
                      </div>
                      <Input
                        placeholder="PDF Field Name"
                        value={mapping.pdfFieldName}
                        onChange={(e) =>
                          updateFieldMapping(index, {
                            pdfFieldName: e.target.value,
                          })
                        }
                      />
                      <Select
                        value={mapping.fieldType}
                        onValueChange={(value: any) =>
                          updateFieldMapping(index, { fieldType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                          <SelectItem value="signature">Signature</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Select
                          value={mapping.transform}
                          onValueChange={(value: any) =>
                            updateFieldMapping(index, { transform: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Transform</SelectItem>
                            <SelectItem value="uppercase">Uppercase</SelectItem>
                            <SelectItem value="lowercase">Lowercase</SelectItem>
                            <SelectItem value="date">Format Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFieldMapping(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
