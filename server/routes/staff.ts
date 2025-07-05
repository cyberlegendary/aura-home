import { RequestHandler } from "express";

// Mock storage for staff profiles and photos
let staffProfiles: Array<{
  id: string;
  userId: string;
  profileImage?: string;
  bio: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  lastCheckedIn?: string;
}> = [];

let jobPhotos: Array<{
  id: string;
  jobId: string;
  staffId: string;
  category: "before" | "after" | "traffic" | "general";
  url: string;
  filename: string;
  uploadedAt: string;
  notes?: string;
}> = [];

let profileIdCounter = 1;
let photoIdCounter = 1;

export const handleGetStaffProfile: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;

    const profile = staffProfiles.find((p) => p.userId === staffId);

    if (!profile) {
      // Return default profile
      const defaultProfile = {
        id: `profile-${profileIdCounter++}`,
        userId: staffId,
        bio: "",
      };
      staffProfiles.push(defaultProfile);
      res.json(defaultProfile);
    } else {
      res.json(profile);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateStaffProfile: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const updates = req.body;

    const profileIndex = staffProfiles.findIndex((p) => p.userId === staffId);

    if (profileIndex === -1) {
      // Create new profile
      const newProfile = {
        id: `profile-${profileIdCounter++}`,
        userId: staffId,
        bio: updates.bio || "",
        profileImage: updates.profileImage,
        currentLocation: updates.currentLocation,
        lastCheckedIn: updates.lastCheckedIn,
      };
      staffProfiles.push(newProfile);
      res.json(newProfile);
    } else {
      // Update existing profile
      staffProfiles[profileIndex] = {
        ...staffProfiles[profileIndex],
        ...updates,
      };
      res.json(staffProfiles[profileIndex]);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetStaffPhotos: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;

    const photos = jobPhotos.filter((p) => p.staffId === staffId);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUploadJobPhoto: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { jobId, category, filename, notes } = req.body;

    if (!jobId || !category || !filename) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // In real implementation, handle actual file upload
    const newPhoto = {
      id: `photo-${photoIdCounter++}`,
      jobId,
      staffId,
      category: category as "before" | "after" | "traffic" | "general",
      url: `/uploads/photos/${filename}`, // Simulated URL
      filename,
      uploadedAt: new Date().toISOString(),
      notes,
    };

    jobPhotos.push(newPhoto);
    res.status(201).json(newPhoto);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetJobPhotos: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;

    const photos = jobPhotos.filter((p) => p.jobId === jobId);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCheckIn: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Location coordinates required" });
    }

    const location = {
      latitude,
      longitude,
      address: address || `${latitude}, ${longitude}`,
      timestamp: new Date().toISOString(),
    };

    // Update staff profile with location
    const profileIndex = staffProfiles.findIndex((p) => p.userId === staffId);

    if (profileIndex === -1) {
      // Create new profile with location
      const newProfile = {
        id: `profile-${profileIdCounter++}`,
        userId: staffId,
        bio: "",
        currentLocation: location,
        lastCheckedIn: new Date().toISOString(),
      };
      staffProfiles.push(newProfile);
      res.json(newProfile);
    } else {
      // Update existing profile
      staffProfiles[profileIndex] = {
        ...staffProfiles[profileIndex],
        currentLocation: location,
        lastCheckedIn: new Date().toISOString(),
      };
      res.json(staffProfiles[profileIndex]);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
