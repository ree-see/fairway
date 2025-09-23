// Core user types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  handicapIndex?: number;
  verifiedHandicap?: number;
  createdAt: string;
  updatedAt: string;
}

// Course and location types
export interface Course {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  slope: number;
  holes: Hole[];
}

export interface Hole {
  number: number;
  par: number;
  yardage: number;
  handicap: number;
}

// Round and scoring types
export interface Round {
  id: string;
  userId: string;
  courseId: string;
  startedAt: string;
  completedAt?: string;
  scores: HoleScore[];
  totalScore?: number;
  isVerified: boolean;
  attestedBy?: string[];
  gpsTrack?: GPSPoint[];
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

// Location and GPS types
export interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

export interface LocationPermission {
  granted: boolean;
  denied: boolean;
  blocked: boolean;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Scorecard: { courseId: string };
  CourseSelect: undefined;
  Profile: undefined;
};

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}