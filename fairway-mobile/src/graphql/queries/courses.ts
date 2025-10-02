import { gql } from '@apollo/client';

// Fragment for course basic info
export const COURSE_BASIC_FRAGMENT = gql`
  fragment CourseBasic on Course {
    id
    name
    city
    state
    country
    latitude
    longitude
    par
    private_course
    distance_meters
  }
`;

// Fragment for course detailed info
export const COURSE_DETAILED_FRAGMENT = gql`
  fragment CourseDetailed on Course {
    id
    name
    address
    city
    state
    country
    postal_code
    full_address
    latitude
    longitude
    phone
    website
    description
    private_course
    course_rating
    slope_rating
    par
    total_yardage
    holes_count
    geofence_radius
  }
`;

// Fragment for hole info
export const HOLE_FRAGMENT = gql`
  fragment HoleInfo on Hole {
    id
    number
    par
    handicap
    distance
    yardages {
      black
      blue
      white
      red
      gold
    }
  }
`;

// Query to get a single course with all details
export const GET_COURSE = gql`
  ${COURSE_DETAILED_FRAGMENT}
  ${HOLE_FRAGMENT}

  query GetCourse($id: ID!) {
    course(id: $id) {
      ...CourseDetailed
      holes {
        ...HoleInfo
      }
    }
  }
`;

// Query to get nearby courses
export const GET_NEARBY_COURSES = gql`
  ${COURSE_BASIC_FRAGMENT}

  query GetNearbyCourses($latitude: Float!, $longitude: Float!, $radius: Int) {
    nearby_courses(latitude: $latitude, longitude: $longitude, radius: $radius) {
      ...CourseBasic
    }
  }
`;

// Query to get course for scorecard (lighter query, only essential fields)
export const GET_COURSE_FOR_SCORECARD = gql`
  ${HOLE_FRAGMENT}

  query GetCourseForScorecard($id: ID!) {
    course(id: $id) {
      id
      name
      par
      holes {
        ...HoleInfo
      }
    }
  }
`;

// Query to get course for selection (minimal data)
export const GET_COURSE_MINIMAL = gql`
  query GetCourseMinimal($id: ID!) {
    course(id: $id) {
      id
      name
      city
      state
      par
    }
  }
`;
