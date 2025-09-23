import { User, Course, Round, HoleScore } from '../src/types';

describe('Type Definitions', () => {
  describe('User', () => {
    it('should have required properties', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.firstName).toBeDefined();
      expect(user.lastName).toBeDefined();
    });

    it('should allow optional handicap properties', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        handicapIndex: 15.2,
        verifiedHandicap: 14.8,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      expect(user.handicapIndex).toBe(15.2);
      expect(user.verifiedHandicap).toBe(14.8);
    });
  });

  describe('Course', () => {
    it('should have required course properties', () => {
      const course: Course = {
        id: 'course-123',
        name: 'Pebble Beach',
        address: '1700 17-Mile Drive, Pebble Beach, CA',
        latitude: 36.5681,
        longitude: -121.9494,
        rating: 74.5,
        slope: 145,
        holes: []
      };

      expect(course.name).toBe('Pebble Beach');
      expect(course.rating).toBe(74.5);
      expect(course.slope).toBe(145);
      expect(course.holes).toEqual([]);
    });
  });

  describe('HoleScore', () => {
    it('should track basic scoring data', () => {
      const holeScore: HoleScore = {
        holeNumber: 1,
        strokes: 4,
        putts: 2,
        fairwayHit: true,
        greenInRegulation: false
      };

      expect(holeScore.holeNumber).toBe(1);
      expect(holeScore.strokes).toBe(4);
      expect(holeScore.putts).toBe(2);
      expect(holeScore.fairwayHit).toBe(true);
      expect(holeScore.greenInRegulation).toBe(false);
    });
  });
});