import { useState, useEffect, useCallback, useMemo } from "react";
import { Job, User } from "@shared/types";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
  isToday,
  getHours,
  getMinutes,
  addHours,
  differenceInMinutes,
} from "date-fns";

export type CalendarView = "month" | "week" | "day";

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  selectedDate: Date | null;
  currentTime: Date;
}

export interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date | null) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  goToToday: () => void;
  selectDayAndZoomToWeek: (date: Date) => void;
}

export interface JobPosition {
  job: Job;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  top: number;
  height: number;
  left: number;
  width: number;
  dayIndex: number;
}

export interface TimelineData {
  currentTimeTop: number;
  currentTimeLeft: number;
  isCurrentTimeVisible: boolean;
  timeSlotHeight: number;
  dayColumnWidth: number;
}

interface UseEnhancedCalendarProps {
  jobs: Job[];
  initialView?: CalendarView;
  timeSlotHeight?: number;
  dayColumnWidth?: number;
  onJobClick?: (job: Job) => void;
  onJobDoubleClick?: (job: Job) => void;
}

export function useEnhancedCalendar({
  jobs,
  initialView = "week",
  timeSlotHeight = 60,
  dayColumnWidth = 200,
  onJobClick,
  onJobDoubleClick,
}: UseEnhancedCalendarProps) {
  // Validate and sanitize input parameters
  const safeTimeSlotHeight = isNaN(timeSlotHeight)
    ? 60
    : Math.max(timeSlotHeight, 20);
  const safeDayColumnWidth = isNaN(dayColumnWidth)
    ? 200
    : Math.max(dayColumnWidth, 100);
  const [state, setState] = useState<CalendarState>({
    currentDate: new Date(),
    view: initialView,
    selectedDate: null,
    currentTime: new Date(),
  });

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      setState((prev) => ({ ...prev, currentTime: new Date() }));
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const actions: CalendarActions = useMemo(
    () => ({
      setCurrentDate: (date: Date) => {
        setState((prev) => ({ ...prev, currentDate: date }));
      },
      setView: (view: CalendarView) => {
        setState((prev) => ({ ...prev, view }));
      },
      setSelectedDate: (date: Date | null) => {
        setState((prev) => ({ ...prev, selectedDate: date }));
      },
      navigatePrevious: () => {
        setState((prev) => {
          const { currentDate, view } = prev;
          let newDate: Date;

          switch (view) {
            case "month":
              newDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                1,
              );
              break;
            case "week":
              newDate = addDays(currentDate, -7);
              break;
            case "day":
              newDate = addDays(currentDate, -1);
              break;
            default:
              newDate = currentDate;
          }

          return { ...prev, currentDate: newDate };
        });
      },
      navigateNext: () => {
        setState((prev) => {
          const { currentDate, view } = prev;
          let newDate: Date;

          switch (view) {
            case "month":
              newDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                1,
              );
              break;
            case "week":
              newDate = addDays(currentDate, 7);
              break;
            case "day":
              newDate = addDays(currentDate, 1);
              break;
            default:
              newDate = currentDate;
          }

          return { ...prev, currentDate: newDate };
        });
      },
      goToToday: () => {
        setState((prev) => ({
          ...prev,
          currentDate: new Date(),
          selectedDate: new Date(),
        }));
      },
      selectDayAndZoomToWeek: (date: Date) => {
        setState((prev) => ({
          ...prev,
          selectedDate: date,
          currentDate: date,
          view: "week",
        }));
      },
    }),
    [],
  );

  // Get visible days based on current view
  const visibleDays = useMemo(() => {
    const { currentDate, view } = state;

    switch (view) {
      case "month":
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        const days = [];
        let day = calendarStart;
        while (day <= calendarEnd) {
          days.push(day);
          day = addDays(day, 1);
        }
        return days;

      case "week":
        const weekStart = startOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      case "day":
        return [currentDate];

      default:
        return [];
    }
  }, [state.currentDate, state.view]);

  // Calculate job positions for the current view
  const jobPositions = useMemo(() => {
    const positions: JobPosition[] = [];

    visibleDays.forEach((day, dayIndex) => {
      const dayJobs = jobs.filter((job) => {
        const jobDate = job.scheduledDate ? parseISO(job.scheduledDate) : null;
        return jobDate && isSameDay(jobDate, day);
      });

      dayJobs.forEach((job) => {
        try {
          const startTime = job.startTime
            ? new Date(`${format(day, "yyyy-MM-dd")}T${job.startTime}`)
            : new Date(day.getTime() + 5 * 60 * 60 * 1000); // Default 5 AM

          // Calculate duration with validation
          let duration = 120; // Default 2 hours
          if (job.endTime && job.startTime) {
            try {
              const endTime = new Date(
                `${format(day, "yyyy-MM-dd")}T${job.endTime}`,
              );
              const calculatedDuration = differenceInMinutes(
                endTime,
                startTime,
              );
              // Validate the duration is a valid number and positive
              if (!isNaN(calculatedDuration) && calculatedDuration > 0) {
                duration = calculatedDuration;
              }
            } catch (e) {
              console.warn("Failed to calculate duration for job", job.id, e);
            }
          } else if (job.category) {
            // Use category-based duration
            const categoryDurations: Record<string, number> = {
              "Geyser Assessment": 60,
              "Leak Detection": 60,
              "Geyser Replacement": 180,
              "Drain Blockage": 120,
              "Camera Inspection": 90,
              "Toilet/Shower": 120,
            };
            duration = categoryDurations[job.category] || 120;
          }

          // Ensure duration is valid
          if (isNaN(duration) || duration <= 0) {
            duration = 120; // Fallback to 2 hours
          }

          const endTime = addHours(startTime, duration / 60);

          // Calculate position with validation
          const startHour = startTime.getHours() + startTime.getMinutes() / 60;
          const top = isNaN(startHour)
            ? 0
            : (startHour - 5) * safeTimeSlotHeight; // Start from 5 AM
          const height = Math.max(
            isNaN(duration) ? 120 : (duration / 60) * safeTimeSlotHeight,
            40,
          ); // Minimum height
          const left = dayIndex * safeDayColumnWidth;
          const width = safeDayColumnWidth - 8; // Padding

          // Validate all position values before adding
          if (!isNaN(top) && !isNaN(height) && !isNaN(left) && !isNaN(width)) {
            positions.push({
              job,
              startTime,
              endTime,
              duration,
              top,
              height,
              left,
              width,
              dayIndex,
            });
          }
        } catch (error) {
          console.warn("Failed to calculate position for job", job.id, error);
        }
      });
    });

    return positions;
  }, [jobs, visibleDays, safeTimeSlotHeight, safeDayColumnWidth]);

  // Calculate current time line position
  const timelineData = useMemo((): TimelineData => {
    const now = state.currentTime;
    const currentHour = getHours(now) + getMinutes(now) / 60;
    const currentTimeTop = isNaN(currentHour)
      ? 0
      : (currentHour - 5) * safeTimeSlotHeight; // Start from 5 AM

    // Find if current day is visible
    const todayIndex = visibleDays.findIndex((day) => isToday(day));
    const currentTimeLeft =
      todayIndex >= 0 ? todayIndex * safeDayColumnWidth : -1;

    return {
      currentTimeTop: isNaN(currentTimeTop) ? 0 : currentTimeTop,
      currentTimeLeft: isNaN(currentTimeLeft) ? -1 : currentTimeLeft,
      isCurrentTimeVisible:
        todayIndex >= 0 &&
        currentHour >= 5 &&
        currentHour <= 23 &&
        !isNaN(currentHour),
      timeSlotHeight: safeTimeSlotHeight,
      dayColumnWidth: safeDayColumnWidth,
    };
  }, [state.currentTime, visibleDays, safeTimeSlotHeight, safeDayColumnWidth]);

  // Handle job click with single/double click detection
  const handleJobClick = useCallback(
    (job: Job, event: React.MouseEvent) => {
      event.stopPropagation();

      // Simple click detection - in a real app, you might want more sophisticated double-click handling
      const now = Date.now();
      const timeSinceLastClick = now - (window as any).lastJobClickTime;
      (window as any).lastJobClickTime = now;

      if (timeSinceLastClick < 300) {
        // Double click
        onJobDoubleClick?.(job);
      } else {
        // Single click
        onJobClick?.(job);
      }
    },
    [onJobClick, onJobDoubleClick],
  );

  // Format view title
  const viewTitle = useMemo(() => {
    const { currentDate, view } = state;

    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      default:
        return "";
    }
  }, [state.currentDate, state.view]);

  return {
    state,
    actions,
    visibleDays,
    jobPositions,
    timelineData,
    viewTitle,
    handleJobClick,
  };
}
