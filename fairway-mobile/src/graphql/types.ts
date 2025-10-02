// GraphQL Response Types

export interface Yardages {
  black: number | null;
  blue: number | null;
  white: number | null;
  red: number | null;
  gold: number | null;
}

export interface Hole {
  id: string;
  number: number;
  par: number;
  handicap: number;
  distance: number | null;
  yardages: Yardages;
}

export interface CourseBasic {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  par: number | null;
  private_course: boolean;
  distance_meters?: number | null;
}

export interface CourseDetailed extends CourseBasic {
  address: string | null;
  postal_code: string | null;
  full_address: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  course_rating: number | null;
  slope_rating: number | null;
  total_yardage: number | null;
  holes_count: number;
  geofence_radius: number;
  holes?: Hole[];
}

// Query Response Types

export interface GetCourseData {
  course: CourseDetailed;
}

export interface GetCourseVariables {
  id: string;
}

export interface GetNearbyCoursesData {
  nearby_courses: CourseBasic[];
}

export interface GetNearbyCoursesVariables {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface GetCourseForScorecardData {
  course: {
    id: string;
    name: string;
    par: number | null;
    holes: Hole[];
  };
}

export interface GetCourseMinimalData {
  course: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    par: number | null;
  };
}
