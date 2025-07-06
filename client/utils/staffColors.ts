// Staff color utility for calendar assignments
export const STAFF_COLORS = {
  // Johannesburg Staff
  "staff-1": {
    // Lebo
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-900",
    accent: "bg-blue-500",
  },
  "staff-2": {
    // Freedom
    bg: "bg-green-100",
    border: "border-green-300",
    text: "text-green-900",
    accent: "bg-green-500",
  },
  "staff-3": {
    // Keenan
    bg: "bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-900",
    accent: "bg-purple-500",
  },
  "staff-4": {
    // Zaundre
    bg: "bg-orange-100",
    border: "border-orange-300",
    text: "text-orange-900",
    accent: "bg-orange-500",
  },
  // Default for any additional staff
  default: {
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-900",
    accent: "bg-gray-500",
  },
};

export function getStaffColor(staffId: string) {
  return (
    STAFF_COLORS[staffId as keyof typeof STAFF_COLORS] || STAFF_COLORS.default
  );
}

export function getStaffColorClasses(staffId: string) {
  const colors = getStaffColor(staffId);
  return {
    card: `${colors.bg} ${colors.border} ${colors.text}`,
    badge: colors.accent,
    hover: `hover:${colors.bg.replace("-100", "-200")}`,
  };
}

// Staff legend for calendar display
export function getStaffLegend(staff: any[]) {
  return staff.map((member) => ({
    id: member.id,
    name: member.name,
    color: getStaffColor(member.id),
  }));
}
