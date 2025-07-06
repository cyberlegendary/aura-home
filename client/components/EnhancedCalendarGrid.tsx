import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Route,
} from "lucide-react";
import { Job, User } from "@shared/types";
import { format, isToday, isSameMonth } from "date-fns";
import {
  useEnhancedCalendar,
  CalendarView,
  JobPosition,
  TimelineData,
} from "@/hooks/useEnhancedCalendar";
import { JobActionButtons } from "./JobActionButtons";
import { formatTravelTime } from "@/utils/locationUtils";
import { getCalendarVisibleJobs } from "@/utils/jobVisibility";

interface EnhancedCalendarGridProps {
  jobs: Job[];
  staff?: User[];
  currentUser: User;
  onJobClick?: (job: Job) => void;
  onJobDoubleClick?: (job: Job) => void;
  onJobAction?: (
    action: "move" | "cancel" | "comeback" | "repair" | "extend",
    job: Job,
  ) => void;
  showJobActions?: boolean;
  initialView?: CalendarView;
}

export function EnhancedCalendarGrid({
  jobs,
  staff = [],
  currentUser,
  onJobClick,
  onJobDoubleClick,
  onJobAction,
  showJobActions = true,
  initialView = "week",
}: EnhancedCalendarGridProps) {
  const {
    state,
    actions,
    visibleDays,
    jobPositions,
    timelineData,
    viewTitle,
    handleJobClick,
  } = useEnhancedCalendar({
    jobs,
    initialView,
    onJobClick,
    onJobDoubleClick,
  });

  const timeSlots = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM to 11 PM

  const getJobStatusColor = (job: Job) => {
    if ((job.status as any) === "cancelled")
      return "bg-red-500/80 border-red-600";

    switch (job.status) {
      case "completed":
        return "bg-gradient-to-r from-purple-400 to-gray-400 border-purple-500";
      case "in_progress":
        return "bg-orange-500/80 border-orange-600";
      case "pending":
        return "bg-blue-500/80 border-blue-600";
      default:
        return "bg-gray-500/80 border-gray-600";
    }
  };

  const renderJobCard = (position: JobPosition) => {
    const { job } = position;
    const isCancelled = (job.status as any) === "cancelled";

    // Validate position values to prevent NaN and standardize width
    const safeTop = isNaN(position.top) ? 0 : position.top;
    const safeLeft = isNaN(position.left) ? 0 : position.left;
    const safeWidth = 141; // Standard width for all job cards
    const safeHeight = isNaN(position.height)
      ? 40
      : Math.max(position.height, 29);

    return (
      <div
        key={job.id}
        className={`absolute rounded-lg border-2 p-2 cursor-pointer transition-all hover:shadow-lg text-white text-xs overflow-visible z-10 ${getJobStatusColor(job)}`}
        style={{
          top: safeTop,
          left: safeLeft + 7,
          width: safeWidth,
          height: safeHeight,
          minHeight: "29px", // Ensure minimum visibility
          boxSizing: "border-box",
        }}
        onClick={(e) => handleJobClick(job, e)}
        title={`${job.title} - ${job.category || "No category"}`}
      >
        {isCancelled && (
          <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs transform rotate-12 translate-x-2 -translate-y-1 z-20">
            CANCELLED
          </div>
        )}

        <div className="font-medium truncate">{job.title}</div>
        <div className="text-xs opacity-90 truncate">{job.category}</div>

        {job.timeExtensions && job.timeExtensions > 0 && (
          <Badge variant="secondary" className="mt-1 text-xs">
            +{job.timeExtensions}h ext
          </Badge>
        )}

        {job.startTime && (
          <div className="text-xs opacity-75 mt-1">
            {job.startTime} - {job.endTime || "TBD"}
          </div>
        )}

        {showJobActions && onJobAction && (
          <div className="absolute bottom-1 right-1 z-30">
            <JobActionButtons
              job={job}
              currentUser={currentUser}
              onAction={(action) => onJobAction(action, job)}
              size="sm"
              variant="icon"
            />
          </div>
        )}
      </div>
    );
  };

  const renderCurrentTimeLine = () => {
    if (!timelineData.isCurrentTimeVisible) return null;

    // Validate timeline data to prevent NaN
    const safeCurrentTimeLeft = isNaN(timelineData.currentTimeLeft)
      ? -1
      : timelineData.currentTimeLeft;
    const safeDayColumnWidth = isNaN(timelineData.dayColumnWidth)
      ? 200
      : timelineData.dayColumnWidth;
    const safeCurrentTimeTop = isNaN(timelineData.currentTimeTop)
      ? 0
      : timelineData.currentTimeTop;

    if (safeCurrentTimeLeft < 0) return null;

    return (
      <>
        {/* Vertical line for current day */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{
            left: safeCurrentTimeLeft + safeDayColumnWidth / 2,
          }}
        />

        {/* Horizontal line for current time */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none flex items-center"
          style={{
            top: safeCurrentTimeTop,
          }}
        >
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-r">
            {format(state.currentTime, "HH:mm")}
          </div>
        </div>
      </>
    );
  };

  const renderMonthView = () => {
    const weeks = [];
    const daysInMonth = visibleDays;

    // Group days into weeks (7 days each)
    for (let i = 0; i < daysInMonth.length; i += 7) {
      weeks.push(daysInMonth.slice(i, i + 7));
    }

    return (
      <div className="grid grid-cols-7 gap-1 p-4">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center font-medium text-sm border-b"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dayJobs = jobs.filter((job) => {
              const jobDate = job.scheduledDate
                ? new Date(job.scheduledDate)
                : null;
              return (
                jobDate &&
                format(jobDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
              );
            });

            const isCurrentMonth = isSameMonth(day, state.currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  min-h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors
                  ${!isCurrentMonth ? "text-gray-400 bg-gray-50" : ""}
                  ${isDayToday ? "bg-blue-50 border-blue-300" : ""}
                  ${state.selectedDate && format(state.selectedDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd") ? "ring-2 ring-blue-500" : ""}
                `}
                onClick={() => actions.selectDayAndZoomToWeek(day)}
              >
                <div
                  className={`text-sm font-medium mb-1 ${isDayToday ? "text-blue-600" : ""}`}
                >
                  {format(day, "d")}
                  {isDayToday && (
                    <div className="w-1 h-1 bg-red-500 rounded-full inline-block ml-1" />
                  )}
                </div>

                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className={`text-xs p-1 rounded truncate text-white cursor-pointer ${getJobStatusColor(job)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job, e);
                      }}
                      title={job.title}
                    >
                      {job.title}
                    </div>
                  ))}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayJobs.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="relative overflow-auto" style={{ height: "600px" }}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-20 flex">
          <div className="w-20 p-2 border-r bg-gray-50">
            <div className="text-xs font-medium">Time</div>
          </div>
          {visibleDays.map((day, index) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={index}
                className={`border-r bg-gray-50 p-2 text-center ${isDayToday ? "bg-blue-50 border-blue-300" : ""}`}
                style={{
                  width: isNaN(timelineData.dayColumnWidth)
                    ? 200
                    : timelineData.dayColumnWidth,
                }}
              >
                <div
                  className={`text-sm font-medium ${isDayToday ? "text-blue-600" : ""}`}
                >
                  {format(day, "EEE")}
                  {isDayToday && (
                    <div className="w-1 h-1 bg-red-500 rounded-full inline-block ml-1" />
                  )}
                </div>
                <div
                  className={`text-xs ${isDayToday ? "text-blue-600" : "text-gray-600"}`}
                >
                  {format(day, "MMM d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="relative">
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="flex border-b"
              style={{
                height: isNaN(timelineData.timeSlotHeight)
                  ? 60
                  : timelineData.timeSlotHeight,
              }}
            >
              <div className="w-20 p-2 border-r bg-gray-50 text-xs flex items-start">
                {hour}:00
              </div>
              {visibleDays.map((day, dayIndex) => (
                <div
                  key={`${hour}-${dayIndex}`}
                  className="border-r relative overflow-visible"
                  style={{
                    width: isNaN(timelineData.dayColumnWidth)
                      ? 200
                      : timelineData.dayColumnWidth,
                    overflow: "visible", // Allow content to extend beyond cell
                  }}
                />
              ))}
            </div>
          ))}

          {/* Job Cards */}
          {jobPositions.map((position) => renderJobCard(position))}

          {/* Current Time Line */}
          {renderCurrentTimeLine()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={actions.navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-64 text-center">
            {viewTitle}
          </h3>
          <Button variant="outline" onClick={actions.navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={state.view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => actions.setView("month")}
              className="rounded-r-none"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Month
            </Button>
            <Button
              variant={state.view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => actions.setView("week")}
              className="rounded-none border-x"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Week
            </Button>
            <Button
              variant={state.view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => actions.setView("day")}
              className="rounded-l-none"
            >
              <Clock className="h-4 w-4 mr-1" />
              Day
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={actions.goToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {state.view === "month" && renderMonthView()}
          {(state.view === "week" || state.view === "day") && renderWeekView()}
        </CardContent>
      </Card>
    </div>
  );
}
