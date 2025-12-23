export interface Course {
    id: number;
    name: string;
    description: string;
    venue: string[];
    extra_info: string;
    duration: string;
    status: boolean;
    registration: number;
  }
 export interface Cohort {
    id: number;
    name: string;
    cohort: string | null;
    is_open: boolean;
    start_date: string;
    end_date: string;
    registrationFee: string;
    courses: Course;
    registration: number;
  }


export interface Participant {
    id: number;
    course: Course;
    cohorts: Cohort;
    cohort: string;
    name: string;
    wallet_address: string;
    email: string;
    status: string;
    motivation: string;
    achievement: string;
    city: string;
    state: string;
    country: string;
    gender: string;
    github: string;
    payment_status: boolean;
    venue: string;
    registration: number;
    number: string;
    created_at: string;
  }
  
  
export interface PaginationInfo {
  current_page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface ApiResponse {
    success: boolean;
    data: {
      results: Participant[];
      pagination: PaginationInfo;
    };
  }


  export interface Image {
    id: number;
    image: string;
  }

export interface Program {
    id: number;
    name: string;
    description: string;
    venue: string[];
    extra_info: string;
    images: Image[]; 
    status: boolean;
  }

// Hub Management Interfaces
export interface HubRegistration {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  location: string;
  reason: string;
  role: string;
  contribution: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HubCheckIn {
  id: number;
  registration: number;
  registration_name?: string;
  registration_email?: string;
  space?: number | null;
  space_name?: string;
  purpose?: string | null;
  notes?: string | null;
  check_in_time?: string;
  check_out_time?: string | null;
  status?: string; // "checked_in" or "checked_out"
  created_at?: string;
  // Legacy fields for backward compatibility
  is_active?: boolean;
  registration_details?: HubRegistration;
  space_details?: HubSpace;
}

export interface HubSpace {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlockedDateRange {
  id: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HubStats {
  // Registration stats
  total_registrations?: number;
  pending_registrations?: number;
  approved_registrations?: number;
  rejected_registrations?: number;
  // Check-in stats
  active_check_ins?: number;
  total_check_ins?: number;
  checked_out?: number;
  today_checkins?: number;
  // Space stats
  total_spaces?: number;
  total_capacity?: number;
  total_occupancy?: number;
  total_available?: number;
  occupancy_percentage?: number;
  // Legacy/fallback
  available_spaces?: number;
}