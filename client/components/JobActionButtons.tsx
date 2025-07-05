import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Move,
  X,
  RotateCcw,
  Wrench,
  Clock,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Job, User } from "@shared/types";

interface JobActionButtonsProps {
  job: Job;
  currentUser: User;
  onAction: (
    action: "move" | "cancel" | "comeback" | "repair" | "extend",
    job: Job,
  ) => void;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "dropdown" | "buttons";
}

export function JobActionButtons({
  job,
  currentUser,
  onAction,
  size = "sm",
  variant = "dropdown",
}: JobActionButtonsProps) {
  const canEditJobs =
    currentUser.role === "admin" ||
    currentUser.role === "supervisor" ||
    currentUser.location?.city === "Cape Town";

  const isCancelled = (job.status as any) === "cancelled";

  if (!canEditJobs || isCancelled) {
    return null;
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
            <span className="sr-only">Job actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onAction("move", job)}>
              <Move className="mr-2 h-4 w-4" />
              Move to Another Day
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("extend", job)}>
              <Clock className="mr-2 h-4 w-4" />
              Extend Time
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onAction("comeback", job)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Schedule Comeback
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("repair", job)}>
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Repair
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAction("cancel", job)}
            className="text-red-600 focus:text-red-600"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "buttons") {
    return (
      <div className="flex gap-1">
        <Button
          size={size}
          variant="outline"
          onClick={() => onAction("move", job)}
          title="Move to another day"
        >
          <Move className="h-3 w-3" />
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={() => onAction("extend", job)}
          title="Extend time"
        >
          <Clock className="h-3 w-3" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={size}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction("comeback", job)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Schedule Comeback
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("repair", job)}>
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Repair
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction("cancel", job)}
              className="text-red-600"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Icon variant - just the move button
  return (
    <Button
      size={size}
      variant="outline"
      onClick={() => onAction("move", job)}
      className="h-6 w-6 p-0"
    >
      <Move className="h-3 w-3" />
    </Button>
  );
}
