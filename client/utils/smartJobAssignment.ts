import { User, Job } from "@shared/types";

export interface StaffWorkload {
  staffId: string;
  currentJobs: number;
  hoursRemaining: number;
  nextAvailableTime: string;
}

export interface JobSuggestion {
  staffMember: User;
  distance: number;
  workload: StaffWorkload;
  travelTime: number;
  priority: number;
  reason: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate estimated travel time based on distance
 */
function calculateTravelTime(distance: number): number {
  // Assuming average speed of 40 km/h in urban areas
  return (distance / 40) * 60; // Return time in minutes
}

/**
 * Calculate staff workload based on current jobs
 */
function calculateStaffWorkload(staffId: string, jobs: Job[]): StaffWorkload {
  const staffJobs = jobs.filter(
    (job) => job.assignedTo === staffId && job.status !== "completed",
  );

  // Estimate remaining hours based on job types
  const hoursRemaining = staffJobs.reduce((total, job) => {
    switch (job.category) {
      case "Geyser Replacement":
        return total + 4;
      case "Geyser Assessment":
        return total + 2;
      case "Leak Detection":
        return total + 3;
      case "Drain Blockage":
        return total + 2;
      case "Camera Inspection":
        return total + 1.5;
      case "Toilet/Shower":
        return total + 2;
      default:
        return total + 2.5;
    }
  }, 0);

  // Calculate next available time based on current workload
  const now = new Date();
  const nextAvailableTime = new Date(
    now.getTime() + hoursRemaining * 60 * 60 * 1000,
  );

  return {
    staffId,
    currentJobs: staffJobs.length,
    hoursRemaining,
    nextAvailableTime: nextAvailableTime.toISOString(),
  };
}

/**
 * Get team boundaries for the 4 teams
 */
function getTeamBoundaries() {
  return {
    johannesburg_north: {
      name: "Johannesburg North",
      center: { lat: -26.0269, lng: 28.0334 },
      bounds: { north: -25.8, south: -26.2, east: 28.3, west: 27.8 },
    },
    johannesburg_south: {
      name: "Johannesburg South",
      center: { lat: -26.2481, lng: 28.0473 },
      bounds: { north: -26.1, south: -26.4, east: 28.3, west: 27.8 },
    },
    cape_town_north: {
      name: "Cape Town North",
      center: { lat: -33.8553, lng: 18.4497 },
      bounds: { north: -33.7, south: -33.95, east: 18.6, west: 18.3 },
    },
    cape_town_south: {
      name: "Cape Town South",
      center: { lat: -34.0522, lng: 18.4241 },
      bounds: { north: -33.9, south: -34.2, east: 18.6, west: 18.2 },
    },
  };
}

/**
 * Determine which team area a job location falls into
 */
function getJobTeamArea(jobCoordinates: { lat: number; lng: number }): string {
  const teams = getTeamBoundaries();

  for (const [teamId, team] of Object.entries(teams)) {
    if (
      jobCoordinates.lat >= team.bounds.south &&
      jobCoordinates.lat <= team.bounds.north &&
      jobCoordinates.lng >= team.bounds.west &&
      jobCoordinates.lng <= team.bounds.east
    ) {
      return teamId;
    }
  }

  // Default to closest team if not in any boundary
  let closestTeam = "johannesburg_north";
  let minDistance = Infinity;

  for (const [teamId, team] of Object.entries(teams)) {
    const distance = calculateDistance(
      jobCoordinates.lat,
      jobCoordinates.lng,
      team.center.lat,
      team.center.lng,
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestTeam = teamId;
    }
  }

  return closestTeam;
}

/**
 * Get staff suggestions for job assignment based on location and workload
 */
export function getSmartJobSuggestions(
  jobLocation: { lat: number; lng: number },
  staff: User[],
  jobs: Job[],
): JobSuggestion[] {
  const suggestions: JobSuggestion[] = [];
  const jobTeamArea = getJobTeamArea(jobLocation);

  staff.forEach((staffMember) => {
    if (staffMember.role !== "staff" || !staffMember.location?.coordinates) {
      return;
    }

    const distance = calculateDistance(
      jobLocation.lat,
      jobLocation.lng,
      staffMember.location.coordinates.lat,
      staffMember.location.coordinates.lng,
    );

    const workload = calculateStaffWorkload(staffMember.id, jobs);
    const travelTime = calculateTravelTime(distance);

    // Calculate priority score (lower is better)
    let priority = distance * 2; // Base score on distance
    priority += workload.currentJobs * 5; // Penalty for current workload
    priority += travelTime * 0.5; // Slight penalty for travel time

    // Bonus for being in the same team area
    const staffTeamArea = getJobTeamArea(staffMember.location.coordinates);
    if (staffTeamArea === jobTeamArea) {
      priority -= 10; // Bonus for same team area
    }

    // Check if staff is available based on shift schedule
    const now = new Date();
    const currentHour = now.getHours();
    const isLateShift = staffMember.schedule?.workingLateShift;
    const shiftStart = parseInt(
      staffMember.schedule?.shiftStartTime?.split(":")[0] || "5",
    );
    const shiftEnd = parseInt(
      staffMember.schedule?.shiftEndTime?.split(":")[0] ||
        (isLateShift ? "19" : "17"),
    );

    let reason = `Distance: ${distance.toFixed(1)}km, Travel: ${travelTime.toFixed(0)}min`;

    if (currentHour < shiftStart || currentHour >= shiftEnd) {
      priority += 20; // Penalty for being outside shift hours
      reason += " (Outside shift hours)";
    }

    if (workload.currentJobs === 0) {
      reason += " - Available now";
    } else {
      reason += ` - ${workload.currentJobs} active jobs, next available: ${new Date(workload.nextAvailableTime).toLocaleTimeString()}`;
    }

    suggestions.push({
      staffMember,
      distance,
      workload,
      travelTime,
      priority,
      reason,
    });
  });

  // Sort by priority (ascending - lower is better)
  return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * Get the best staff member suggestion for a job
 */
export function getBestStaffSuggestion(
  jobLocation: { lat: number; lng: number },
  staff: User[],
  jobs: Job[],
): JobSuggestion | null {
  const suggestions = getSmartJobSuggestions(jobLocation, staff, jobs);
  return suggestions.length > 0 ? suggestions[0] : null;
}
