export interface Course {
  id: number;
  name: string;
  description: string;
  venue: any;
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
  venue: string;
  payment_status: boolean;
  registration: number;
  number: string;
}

export interface ApiResponse {
  success: boolean;
  data: {
    count: number;
    next: null | string;
    previous: null | string;
    results: Participant[];
  };
}

export interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  onSubmit: (data: Partial<Participant>) => Promise<void>;
  courses: Course[];
  cohorts: Cohort[];
  isLoading: boolean;
}

export interface CreateParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Participant>) => Promise<void>;
  courses: Course[];
  cohorts: Cohort[];
  isLoading: boolean;
}
