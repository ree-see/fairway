// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

// User Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  preferred_tees?: string;
  handicap_index?: number;
  verified_handicap?: number;
  rounds_played: number;
  verified_rounds: number;
  email_verified: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

// Authentication Types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Course Types
export interface Course {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  full_address: string;
  latitude: string;
  longitude: string;
  phone?: string;
  website?: string;
  description?: string;
  private_course: boolean;
  course_rating?: string;
  slope_rating?: number;
  par: number;
  total_yardage?: number;
  holes_count: number;
  geofence_radius: number;
  distance_meters?: number;
}

export interface Hole {
  id: string;
  number: number;
  par: number;
  handicap: number;
  distance: number;
  yardages: {
    black?: number;
    blue?: number;
    white?: number;
    red?: number;
    gold?: number;
  };
  coordinates: {
    tee?: { lat: number; lng: number };
    green?: { lat: number; lng: number };
  };
  description?: string;
  shape?: string;
  difficulty_rating?: string;
}

export interface DetailedCourse extends Course {
  holes: Hole[];
  recent_rounds_count: number;
  average_score?: number;
}

// Round Types  
export interface Round {
  id: string;
  user_id: string;
  course_id: string;
  course_name?: string; // Added course_name from Rails API
  started_at: string;
  completed_at?: string;
  submitted_at?: string;
  tee_color: string;
  course_rating?: string;
  slope_rating?: number;
  total_strokes?: number;
  total_putts?: number;
  score_differential?: string;
  is_verified: boolean;
  is_provisional: boolean;
  verification_count: number;
  location_verified: boolean;
  start_latitude?: string;
  start_longitude?: string;
  fairways_hit: number;
  greens_in_regulation: number;
  total_penalties: number;
  created_at: string;
  updated_at: string;
}

export interface HoleScore {
  id: string;
  round_id: string;
  hole_id: string;
  hole_number: number;
  strokes: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
  penalties: number;
  drive_distance?: number;
  approach_distance?: number;
}

export interface HoleScoreInput {
  hole_number: number;
  strokes: number;
  putts?: number | null;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
  penalties?: number;
  drive_distance?: number | null;
  approach_distance?: number | null;
}

// Statistics Types
export interface RoundStatistics {
  total_rounds: number;
  verified_rounds: number;
  average_score?: number;
  lowest_score?: number;
  handicap_index?: number;
  verified_handicap?: number;
  recent_trend?: 'improving' | 'declining' | 'stable' | null;
  
  // Performance statistics
  average_putts?: number;
  fairway_percentage?: number;
  gir_percentage?: number;
  scrambling_percentage?: number;
  
  // Round averages
  total_putts?: number;
  fairways_hit?: number;
  greens_in_regulation?: number;
  
  // Strokes gained
  strokes_gained_driving?: number;
  strokes_gained_approach?: number;
  strokes_gained_short_game?: number;
  strokes_gained_putting?: number;
}

export interface RecentRound {
  id: string;
  course_id: string;
  course_name: string;
  total_strokes?: number;
  started_at: string;
  completed_at?: string;
  is_verified: boolean;
  is_provisional: boolean;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface NearbyCoursesRequest extends Location {
  radius?: number;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}