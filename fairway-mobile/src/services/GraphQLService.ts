import apolloClient from '../config/apolloClient';
import {
  GET_COURSE,
  GET_NEARBY_COURSES,
  GET_COURSE_FOR_SCORECARD,
  GET_COURSE_MINIMAL,
} from '../graphql/queries/courses';
import {
  GetCourseData,
  GetCourseVariables,
  GetNearbyCoursesData,
  GetNearbyCoursesVariables,
  GetCourseForScorecardData,
  GetCourseMinimalData,
  CourseDetailed,
  CourseBasic,
} from '../graphql/types';
import { ApiResponse } from '../types/api';

class GraphQLService {
  /**
   * Get a single course with all details and holes
   */
  async getCourse(courseId: string): Promise<ApiResponse<{ course: CourseDetailed }>> {
    try {
      const { data, errors } = await apolloClient.query<GetCourseData, GetCourseVariables>({
        query: GET_COURSE,
        variables: { id: courseId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      return {
        success: true,
        data: { course: data.course },
      };
    } catch (error: any) {
      console.error('GraphQL getCourse error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch course',
      };
    }
  }

  /**
   * Get nearby courses based on location
   */
  async getNearbyCourses(
    latitude: number,
    longitude: number,
    radius: number = 25
  ): Promise<ApiResponse<{ courses: CourseBasic[] }>> {
    try {
      const { data, errors } = await apolloClient.query<
        GetNearbyCoursesData,
        GetNearbyCoursesVariables
      >({
        query: GET_NEARBY_COURSES,
        variables: { latitude, longitude, radius },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      return {
        success: true,
        data: { courses: data.nearby_courses },
      };
    } catch (error: any) {
      console.error('GraphQL getNearbyCourses error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch nearby courses',
      };
    }
  }

  /**
   * Get course data optimized for scorecard (only essential fields)
   */
  async getCourseForScorecard(courseId: string): Promise<ApiResponse<{ course: any }>> {
    try {
      const { data, errors } = await apolloClient.query<
        GetCourseForScorecardData,
        GetCourseVariables
      >({
        query: GET_COURSE_FOR_SCORECARD,
        variables: { id: courseId },
        fetchPolicy: 'cache-first', // Can use cache for scorecard
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      return {
        success: true,
        data: { course: data.course },
      };
    } catch (error: any) {
      console.error('GraphQL getCourseForScorecard error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch course for scorecard',
      };
    }
  }

  /**
   * Get minimal course data (for lists, selections, etc.)
   */
  async getCourseMinimal(courseId: string): Promise<ApiResponse<{ course: any }>> {
    try {
      const { data, errors } = await apolloClient.query<
        GetCourseMinimalData,
        GetCourseVariables
      >({
        query: GET_COURSE_MINIMAL,
        variables: { id: courseId },
        fetchPolicy: 'cache-first',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      return {
        success: true,
        data: { course: data.course },
      };
    } catch (error: any) {
      console.error('GraphQL getCourseMinimal error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch course',
      };
    }
  }

  /**
   * Clear Apollo Client cache
   */
  async clearCache(): Promise<void> {
    try {
      await apolloClient.clearStore();
      console.log('Apollo Client cache cleared');
    } catch (error) {
      console.warn('Failed to clear Apollo cache:', error);
    }
  }

  /**
   * Reset Apollo Client cache (clears and refetches all active queries)
   */
  async resetCache(): Promise<void> {
    try {
      await apolloClient.resetStore();
      console.log('Apollo Client cache reset');
    } catch (error) {
      console.warn('Failed to reset Apollo cache:', error);
    }
  }
}

// Export singleton instance
export default new GraphQLService();
