import { Job, User } from "@shared/types";

// Starting locations for different cities
export const START_LOCATIONS = {
  Johannesburg: {
    address: "5 Thora Cres, Wynberg, Sandton, 2090",
    coordinates: { lat: -26.1075, lng: 28.0567 },
    startTime: "05:00",
  },
  "Cape Town": {
    address: "10 Edison Way, Century City, Cape Town, 7441",
    coordinates: { lat: -33.8918, lng: 18.4847 },
    startTime: "05:00",
  },
};

// Job duration estimates by category (in minutes)
export const JOB_DURATIONS = {
  "Geyser Assessment": 60,
  "Leak Detection": 60,
  "Geyser Replacement": 180,
  "Drain Blockage": 120,
  "Camera Inspection": 90,
  "Toilet/Shower": 120,
  Other: 120,
};

/**
 * Calculate estimated travel time between two addresses
 * In a real application, this would use Google Maps API or similar
 */
export function calculateTravelTime(
  fromAddress: string,
  toAddress: string,
  fromCoords?: { lat: number; lng: number },
  toCoords?: { lat: number; lng: number },
): number {
  // Mock calculation - in reality, use Google Maps Distance Matrix API
  if (fromCoords && toCoords) {
    const distance = haversineDistance(fromCoords, toCoords);
    // Estimate 30km/h average speed in urban areas
    return Math.round((distance / 30) * 60); // minutes
  }

  // Fallback: random time between 15-45 minutes
  return Math.random() * 30 + 15;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number },
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coords2.lat - coords1.lat);
  const dLng = toRadians(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.lat)) *
      Math.cos(toRadians(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get starting location for a staff member based on their location
 */
export function getStartingLocation(staff: User) {
  const city = staff.location?.city;
  if (city && city in START_LOCATIONS) {
    return START_LOCATIONS[city as keyof typeof START_LOCATIONS];
  }
  return null;
}

/**
 * Get estimated duration for a job based on its category
 */
export function getJobDuration(job: Job): number {
  const category = job.category as keyof typeof JOB_DURATIONS;
  return JOB_DURATIONS[category] || JOB_DURATIONS.Other;
}

/**
 * Calculate optimal route for multiple jobs
 */
export function calculateOptimalRoute(
  jobs: Job[],
  startLocation: { lat: number; lng: number },
): Job[] {
  if (jobs.length <= 1) return jobs;

  // Simple nearest neighbor algorithm
  const sortedJobs: Job[] = [];
  const remainingJobs = [...jobs];
  let currentLocation = startLocation;

  while (remainingJobs.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remainingJobs.forEach((job, index) => {
      // Mock coordinates for job location
      const jobCoords = getJobCoordinates(job);
      if (jobCoords) {
        const distance = haversineDistance(currentLocation, jobCoords);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }
    });

    const nearestJob = remainingJobs.splice(nearestIndex, 1)[0];
    sortedJobs.push(nearestJob);

    const nearestJobCoords = getJobCoordinates(nearestJob);
    if (nearestJobCoords) {
      currentLocation = nearestJobCoords;
    }
  }

  return sortedJobs;
}

/**
 * Get coordinates for a job location (mock implementation)
 */
function getJobCoordinates(job: Job): { lat: number; lng: number } | null {
  // In a real application, this would geocode the riskAddress
  // For now, return mock coordinates based on area
  if (job.riskAddress) {
    const address = job.riskAddress.toLowerCase();

    // Johannesburg area
    if (
      address.includes("johannesburg") ||
      address.includes("sandton") ||
      address.includes("midrand")
    ) {
      return {
        lat: -26.2041 + (Math.random() - 0.5) * 0.1,
        lng: 28.0473 + (Math.random() - 0.5) * 0.1,
      };
    }

    // Cape Town area
    if (
      address.includes("cape town") ||
      address.includes("bellville") ||
      address.includes("wynberg")
    ) {
      return {
        lat: -33.9249 + (Math.random() - 0.5) * 0.1,
        lng: 18.4241 + (Math.random() - 0.5) * 0.1,
      };
    }
  }

  // Default to Johannesburg if unknown
  return {
    lat: -26.2041 + (Math.random() - 0.5) * 0.1,
    lng: 28.0473 + (Math.random() - 0.5) * 0.1,
  };
}

/**
 * Format travel time into readable string
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Check if a staff member is available at a given time
 */
export function isStaffAvailable(
  staff: User,
  dateTime: Date,
  jobs: Job[],
): boolean {
  const staffJobs = jobs.filter(
    (job) =>
      job.assignedTo === staff.id &&
      job.scheduledDate &&
      new Date(job.scheduledDate).toDateString() === dateTime.toDateString(),
  );

  // Check for time conflicts
  for (const job of staffJobs) {
    if (job.startTime && job.endTime) {
      const jobStart = new Date(`${dateTime.toDateString()} ${job.startTime}`);
      const jobEnd = new Date(`${dateTime.toDateString()} ${job.endTime}`);

      if (dateTime >= jobStart && dateTime <= jobEnd) {
        return false;
      }
    }
  }

  return true;
}
