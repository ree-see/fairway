import { useState, useCallback, useRef } from 'react';
import { InteractionManager, Dimensions } from 'react-native';
import { 
  PanGestureHandler, 
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State
} from 'react-native-gesture-handler';
import { 
  runOnJS, 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate 
} from 'react-native-reanimated';

interface UseSwipeNavigationProps {
  totalHoles: number;
  currentHoleIndex: number;
  onHoleChange: (holeIndex: number) => void;
  onSaveCurrentHole?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

export const useSwipeNavigation = ({
  totalHoles,
  currentHoleIndex,
  onHoleChange,
  onSaveCurrentHole,
}: UseSwipeNavigationProps) => {
  const translateX = useSharedValue(0);
  const isNavigating = useRef(false);

  const canNavigatePrevious = currentHoleIndex > 0;
  const canNavigateNext = currentHoleIndex < totalHoles - 1;

  const navigateToHole = useCallback((holeIndex: number) => {
    if (isNavigating.current || holeIndex < 0 || holeIndex >= totalHoles) {
      return;
    }

    isNavigating.current = true;
    
    // Save current hole data before navigating
    if (onSaveCurrentHole) {
      onSaveCurrentHole();
    }

    // Use InteractionManager for smooth navigation
    InteractionManager.runAfterInteractions(() => {
      onHoleChange(holeIndex);
      isNavigating.current = false;
    });
  }, [totalHoles, onHoleChange, onSaveCurrentHole]);

  const navigatePrevious = useCallback(() => {
    if (canNavigatePrevious) {
      navigateToHole(currentHoleIndex - 1);
    }
  }, [canNavigatePrevious, currentHoleIndex, navigateToHole]);

  const navigateNext = useCallback(() => {
    if (canNavigateNext) {
      navigateToHole(currentHoleIndex + 1);
    }
  }, [canNavigateNext, currentHoleIndex, navigateToHole]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Gesture started
    },
    onActive: (event) => {
      // Only allow horizontal swipes
      if (Math.abs(event.velocityY) > Math.abs(event.velocityX)) {
        return;
      }
      
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      const { translationX, velocityX } = event;
      
      // Determine swipe direction and distance
      const isSwipeLeft = translationX < -SWIPE_THRESHOLD || velocityX < -1000;
      const isSwipeRight = translationX > SWIPE_THRESHOLD || velocityX > 1000;
      
      if (isSwipeLeft && canNavigateNext) {
        // Swipe left - go to next hole
        runOnJS(navigateNext)();
      } else if (isSwipeRight && canNavigatePrevious) {
        // Swipe right - go to previous hole
        runOnJS(navigatePrevious)();
      }
      
      // Animate back to center
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    // Limit translation to prevent over-scrolling
    const clampedTranslateX = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-SCREEN_WIDTH * 0.3, 0, SCREEN_WIDTH * 0.3]
    );

    return {
      transform: [{ translateX: clampedTranslateX }],
    };
  });

  const getSwipeIndicatorStyle = useCallback((direction: 'left' | 'right') => {
    return useAnimatedStyle(() => {
      const isLeft = direction === 'left';
      const shouldShow = isLeft ? 
        (translateX.value < -50 && canNavigateNext) : 
        (translateX.value > 50 && canNavigatePrevious);
      
      const opacity = shouldShow ? 
        interpolate(
          Math.abs(translateX.value),
          [50, SWIPE_THRESHOLD],
          [0.3, 0.8]
        ) : 0;

      return {
        opacity: withSpring(opacity),
      };
    });
  }, [canNavigateNext, canNavigatePrevious]);

  return {
    gestureHandler,
    animatedStyle,
    navigatePrevious,
    navigateNext,
    canNavigatePrevious,
    canNavigateNext,
    getSwipeIndicatorStyle,
    PanGestureHandler,
  };
};