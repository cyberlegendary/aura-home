import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { User } from "@shared/types";

interface SimpleJobCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: any) => void;
  staff: User[];
}

export function SimpleJobCreationModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
}: SimpleJobCreationModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    category: "",
    priority: "medium",
    scheduledDate: new Date(),
    startTime: "09:00",
    endTime: "11:00",
  });

  const handleSubmit = () => {
    const jobData = {
      ...formData,
      scheduledDate: formData.scheduledDate.toISOString(),
      status: "pending",
    };

    onSubmit(jobData);

    // Reset form
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      category: "",
      priority: "medium",
      scheduledDate: new Date(),
      startTime: "09:00",
      endTime: "11:00",
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Job Title</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter job title"
            />
          </div>

          <div>
            <Label>Assigned Staff</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, assignedTo: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geyser Assessment">
                  Geyser Assessment
                </SelectItem>
                <SelectItem value="Geyser Replacement">
                  Geyser Replacement
                </SelectItem>
                <SelectItem value="Leak Detection">Leak Detection</SelectItem>
                <SelectItem value="Drain Blockage">Drain Blockage</SelectItem>
                <SelectItem value="Camera Inspection">
                  Camera Inspection
                </SelectItem>
                <SelectItem value="Toilet/Shower">Toilet/Shower</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Scheduled Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.scheduledDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduledDate}
                  onSelect={(date) =>
                    date &&
                    setFormData((prev) => ({ ...prev, scheduledDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Start Time</Label>
            <Select
              value={formData.startTime}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, startTime: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 17 }, (_, i) => {
                  const hour = 5 + i;
                  const time = `${hour.toString().padStart(2, "0")}:00`;
                  return (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>End Time</Label>
            <Select
              value={formData.endTime}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, endTime: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 17 }, (_, i) => {
                  const hour = 5 + i;
                  const time = `${hour.toString().padStart(2, "0")}:00`;
                  return (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter job description"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
