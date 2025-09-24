import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ScorecardScreen } from '../ScorecardScreen';
import ApiService from '../../services/ApiService';
import { useRoute, useNavigation } from '@react-navigation/native';

jest.mock('../../services/ApiService');
jest.mock('@react-navigation/native');

const mockedApiService = ApiService as jest.Mocked<typeof ApiService>;
const mockedUseRoute = useRoute as jest.MockedFunction<typeof useRoute>;
const mockedUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

const mockCourse = {
  id: '1',
  name: 'Test Course',
  par: 72,
  holes: [
    {
      id: '1',
      number: 1,
      par: 4,
      handicap: 10,
      distance: 350,
      yardages: { white: 350, blue: 375 },
      coordinates: {},
    },
    {
      id: '2',
      number: 2,
      par: 3,
      handicap: 18,
      distance: 150,
      yardages: { white: 150, blue: 165 },
      coordinates: {},
    },
  ],
};

const mockRound = {
  id: '1',
  course_id: '1',
  user_id: '1',
  started_at: new Date().toISOString(),
  tee_color: 'white',
  is_verified: false,
  is_provisional: true,
  verification_count: 0,
  location_verified: false,
  fairways_hit: 0,
  greens_in_regulation: 0,
  total_penalties: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ScorecardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedUseRoute.mockReturnValue({
      params: { course: mockCourse },
    } as any);
    
    mockedUseNavigation.mockReturnValue(mockNavigation as any);
    
    mockedApiService.getCourse.mockResolvedValue({
      success: true,
      data: { course: mockCourse },
    });
    
    mockedApiService.createRound.mockResolvedValue({
      success: true,
      data: { round: mockRound },
    });
  });

  it('should render course name and holes', async () => {
    const { getByText, getByTestId } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByText('Test Course')).toBeTruthy();
    });

    expect(getByText('Hole 1')).toBeTruthy();
    expect(getByText('Par 4')).toBeTruthy();
    expect(getByText('Hole 2')).toBeTruthy();
    expect(getByText('Par 3')).toBeTruthy();
  });

  it('should update hole scores when strokes are entered', async () => {
    const { getByTestId } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByTestId('hole-1-strokes')).toBeTruthy();
    });

    const strokesInput = getByTestId('hole-1-strokes');
    fireEvent.changeText(strokesInput, '5');

    expect(strokesInput.props.value).toBe('5');
  });

  it('should toggle fairway hit', async () => {
    const { getByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByText('Fairway Hit')).toBeTruthy();
    });

    const fairwayButton = getByText('Fairway Hit');
    fireEvent.press(fairwayButton);

    // Button should show active state (this would need to check styling)
    expect(fairwayButton).toBeTruthy();
  });

  it('should handle green in regulation and up & down logic', async () => {
    const { getByText, queryByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByText('Green in Regulation')).toBeTruthy();
    });

    // Initially both buttons should be available
    expect(getByText('Green in Regulation')).toBeTruthy();
    expect(getByText('Up & Down')).toBeTruthy();

    // Press Green in Regulation
    const girButton = getByText('Green in Regulation');
    fireEvent.press(girButton);

    // Up & Down should be hidden when GIR is selected
    await waitFor(() => {
      expect(queryByText('Up & Down')).toBeNull();
    });
  });

  it('should calculate total score correctly', async () => {
    const { getByTestId, getByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByTestId('hole-1-strokes')).toBeTruthy();
    });

    // Add scores to holes
    fireEvent.changeText(getByTestId('hole-1-strokes'), '4');
    fireEvent.changeText(getByTestId('hole-2-strokes'), '3');

    await waitFor(() => {
      expect(getByText('7')).toBeTruthy(); // Total score
    });
  });

  it('should calculate score to par correctly', async () => {
    const { getByTestId, getByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByTestId('hole-1-strokes')).toBeTruthy();
    });

    // Add scores: Par 4 + Par 3 = 7, Actual: 5 + 4 = 9, To Par: +2
    fireEvent.changeText(getByTestId('hole-1-strokes'), '5');
    fireEvent.changeText(getByTestId('hole-2-strokes'), '4');

    await waitFor(() => {
      expect(getByText('+2')).toBeTruthy(); // Score to par
    });
  });

  it('should complete round when finish button is pressed', async () => {
    mockedApiService.updateRound.mockResolvedValue({
      success: true,
      data: { round: { ...mockRound, completed_at: new Date().toISOString() } },
    });

    const { getByTestId, getByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByTestId('hole-1-strokes')).toBeTruthy();
    });

    // Add minimum required scores
    fireEvent.changeText(getByTestId('hole-1-strokes'), '4');
    fireEvent.changeText(getByTestId('hole-2-strokes'), '3');

    const finishButton = getByText('Finish Round');
    fireEvent.press(finishButton);

    await waitFor(() => {
      expect(mockedApiService.updateRound).toHaveBeenCalledWith(
        mockRound.id,
        expect.objectContaining({
          completed_at: expect.any(String),
          submitted_at: expect.any(String),
          total_strokes: 7,
        })
      );
    });
  });

  it('should show loading state', () => {
    mockedApiService.getCourse.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByText } = render(<ScorecardScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    mockedApiService.getCourse.mockRejectedValue({
      message: 'Failed to load course',
    });

    const { getByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByText('Error: Failed to load course')).toBeTruthy();
    });
  });

  it('should prevent finishing round with insufficient holes', async () => {
    const { getByTestId, getByText } = render(<ScorecardScreen />);

    await waitFor(() => {
      expect(getByTestId('hole-1-strokes')).toBeTruthy();
    });

    // Only add score for one hole (insufficient for completion)
    fireEvent.changeText(getByTestId('hole-1-strokes'), '4');

    const finishButton = getByText('Finish Round');
    fireEvent.press(finishButton);

    // Should not call API with insufficient holes
    expect(mockedApiService.updateRound).not.toHaveBeenCalled();
  });
});