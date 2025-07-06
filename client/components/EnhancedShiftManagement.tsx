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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  location: string;
  role: string;
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: "scheduled" | "in-progress" | "completed" | "missed";
  hours: number;
  notes?: string;
}

interface EnhancedShiftManagementProps {
  staff: User[];
  onShiftCreated?: (shift: Shift) => void;
  onShiftUpdated?: (shift: Shift) => void;
  onShiftDeleted?: (shiftId: string) => void;
  hideDeleteButton?: boolean;
}

export function EnhancedShiftManagement({
  staff,
  onShiftCreated,
  onShiftUpdated,
  onShiftDeleted,
  hideDeleteButton = false,
}: EnhancedShiftManagementProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [shiftForm, setShiftForm] = useState({
    staffId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchShifts();
  }, [selectedDate]);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockShifts: Shift[] = [
        {
          id: "1",
          staffId: "freedom",
          staffName: "freedom",
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: "08:00",
          endTime: "17:00",
          location: "Johannesburg",
          status: "scheduled",
          hours: 9,
        },
        {
          id: "2",
          staffId: "lebo",
          staffName: "lebo",
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: "09:00",
          endTime: "18:00",
          location: "Johannesburg",
          status: "in-progress",
          hours: 9,
        },
        {
          id: "3",
          staffId: "keenan",
          staffName: "keenan",
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: "08:30",
          endTime: "17:30",
          location: "Cape Town",
          status: "scheduled",
          hours: 9,
        },
        {
          id: "4",
          staffId: "zaundre",
          staffName: "zaundre",
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: "09:00",
          endTime: "18:00",
          location: "Cape Town",
          status: "completed",
          hours: 9,
        },
      ];
      setShifts(mockShifts);
    } catch (err) {
      setError("Failed to fetch shifts");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleCreateShift = async () => {
    if (!shiftForm.staffId || !shiftForm.startTime || !shiftForm.endTime) {
      setError("Please fill in all required fields");
      return;
    }

    const selectedStaff = staff.find((s) => s.id === shiftForm.staffId);
    if (!selectedStaff) return;

    const hours = calculateHours(shiftForm.startTime, shiftForm.endTime);
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      staffId: shiftForm.staffId,
      staffName: selectedStaff.username,
      date: shiftForm.date,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      location:
        shiftForm.location ||
        (typeof selectedStaff.location === "string"
          ? selectedStaff.location
          : selectedStaff.location?.city || "Unknown"),
      status: "scheduled",
      hours,
      notes: shiftForm.notes,
    };

    setShifts([...shifts, newShift]);
    onShiftCreated?.(newShift);

    // Reset form
    setShiftForm({
      staffId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
      location: "",
      notes: "",
    });
    setShowCreateForm(false);
    setError("");
  };

  const handleUpdateShift = async () => {
    if (!editingShift) return;

    const hours = calculateHours(editingShift.startTime, editingShift.endTime);
    const updatedShift = { ...editingShift, hours };

    setShifts(shifts.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
    onShiftUpdated?.(updatedShift);
    setEditingShift(null);
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts(shifts.filter((s) => s.id !== shiftId));
    onShiftDeleted?.(shiftId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "missed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-yellow-500";
      case "missed":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const todaysShifts = shifts.filter(
    (shift) => shift.date === format(selectedDate, "yyyy-MM-dd"),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Shift Management
            </div>
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Badge variant="secondary">
              {todaysShifts.length} shifts scheduled
            </Badge>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Create New Shift</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Staff Member *</Label>
                    <Select
                      value={shiftForm.staffId}
                      onValueChange={(value) =>
                        setShiftForm({ ...shiftForm, staffId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {member.username} -{" "}
                              {typeof member.location === "string"
                                ? member.location
                                : member.location?.city || "Unknown"}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shiftDate">Date *</Label>
                    <Input
                      id="shiftDate"
                      type="date"
                      value={shiftForm.date}
                      onChange={(e) =>
                        setShiftForm({ ...shiftForm, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={shiftForm.startTime}
                      onChange={(e) =>
                        setShiftForm({
                          ...shiftForm,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={shiftForm.endTime}
                      onChange={(e) =>
                        setShiftForm({ ...shiftForm, endTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                      {calculateHours(shiftForm.startTime, shiftForm.endTime) ||
                        0}
                      h
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={shiftForm.location}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, location: e.target.value })
                    }
                    placeholder="Work location"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShift}>Create Shift</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading shifts...</div>
            ) : todaysShifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No shifts scheduled for {format(selectedDate, "PPP")}
              </div>
            ) : (
              todaysShifts.map((shift) => (
                <Card key={shift.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shift.status)}
                          <div>
                            <div className="font-medium">{shift.staffName}</div>
                            <div className="text-sm text-muted-foreground">
                              {typeof shift.location === "string"
                                ? shift.location
                                : shift.location?.city || "Unknown"}
                            </div>
                          </div>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            {shift.startTime} - {shift.endTime}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {shift.hours} hours
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(shift.status)} text-white`}
                        >
                          {shift.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingShift(shift)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!hideDeleteButton && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {editingShift && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Shift - {editingShift.staffName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingShift.status}
                  onValueChange={(value) =>
                    setEditingShift({
                      ...editingShift,
                      status: value as Shift["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={editingShift.location}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartTime">Start Time</Label>
                <Input
                  id="editStartTime"
                  type="time"
                  value={editingShift.startTime}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      startTime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndTime">End Time</Label>
                <Input
                  id="editEndTime"
                  type="time"
                  value={editingShift.endTime}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      endTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingShift(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateShift}>Update Shift</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
