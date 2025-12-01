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