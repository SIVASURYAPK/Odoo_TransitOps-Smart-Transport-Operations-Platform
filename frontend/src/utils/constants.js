// Central place for enums shared between backend Pydantic schemas and the UI.
// Keep these in sync with backend/app/models/*.py status enums.

export const ROLES = {
  FLEET_MANAGER: 'FleetManager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'SafetyOfficer',
  FINANCIAL_ANALYST: 'FinancialAnalyst',
}

export const ROLE_LABELS = {
  [ROLES.FLEET_MANAGER]: 'Fleet Manager',
  [ROLES.DRIVER]: 'Driver',
  [ROLES.SAFETY_OFFICER]: 'Safety Officer',
  [ROLES.FINANCIAL_ANALYST]: 'Financial Analyst',
}

export const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'OnTrip',
  IN_SHOP: 'InShop',
  RETIRED: 'Retired',
}

export const DRIVER_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'OnTrip',
  OFF_DUTY: 'OffDuty',
  SUSPENDED: 'Suspended',
}

export const TRIP_STATUS = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const MAINTENANCE_STATUS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
}

export const EXPENSE_CATEGORY = {
  TOLL: 'Toll',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
}

// Maps a status string to Tailwind color tokens defined in tailwind.config.js.
export const STATUS_STYLES = {
  Available: { dot: 'bg-status-available', text: 'text-status-available', bg: 'bg-green-50', ring: 'ring-green-200' },
  OnTrip: { dot: 'bg-status-ontrip', text: 'text-status-ontrip', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  InShop: { dot: 'bg-status-shop', text: 'text-status-shop', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  Retired: { dot: 'bg-status-retired', text: 'text-status-retired', bg: 'bg-red-50', ring: 'ring-red-200' },
  OffDuty: { dot: 'bg-status-offduty', text: 'text-status-offduty', bg: 'bg-slate-100', ring: 'ring-slate-200' },
  Suspended: { dot: 'bg-status-retired', text: 'text-status-retired', bg: 'bg-red-50', ring: 'ring-red-200' },
  Draft: { dot: 'bg-status-draft', text: 'text-status-draft', bg: 'bg-violet-50', ring: 'ring-violet-200' },
  Dispatched: { dot: 'bg-status-ontrip', text: 'text-status-ontrip', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  Completed: { dot: 'bg-status-completed', text: 'text-status-completed', bg: 'bg-green-50', ring: 'ring-green-200' },
  Cancelled: { dot: 'bg-status-cancelled', text: 'text-status-cancelled', bg: 'bg-red-50', ring: 'ring-red-200' },
  Open: { dot: 'bg-status-open', text: 'text-status-open', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  Closed: { dot: 'bg-status-closed', text: 'text-status-closed', bg: 'bg-green-50', ring: 'ring-green-200' },
}

export const VEHICLE_TYPES = ['Truck', 'Van', 'Pickup', 'Trailer', 'Bus']

export const REGIONS = ['North', 'South', 'East', 'West', 'Central']
