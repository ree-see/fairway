import { useState, useEffect, useCallback } from 'react';
import { InteractionManager } from 'react-native';

interface Hole {
  number: number;
  par: number;
  strokes: number;
  putts: number;
  fairwayInRegulation: boolean;
  greenInRegulation: boolean;
}

interface Round {
  id: number;
  holes: Hole[];
}

interface UseHoleStagingProps {
  holes: Hole[];
  currentHoleIndex: number;
  currentRound: Round | null;
  onHolesUpdate: (holes: Hole[]) => void;
}

interface HoleStaging {
  stagedHole: Hole | null;
  saveCurrentHole: () => void;
  loadHoleData: (holeIndex: number) => void;
  updateStagedHole: (updates: Partial<Hole>) => void;
  hasUnsavedChanges: boolean;
}

export const useHoleStaging = ({
  holes,
  currentHoleIndex,
  currentRound,
  onHolesUpdate,
}: UseHoleStagingProps): HoleStaging => {
  const [stagedHole, setStagedHole] = useState<Hole | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedHoleIndex, setLastSavedHoleIndex] = useState<number>(-1);

  // Load hole data when switching holes
  const loadHoleData = useCallback((holeIndex: number) => {
    if (holeIndex >= 0 && holeIndex < holes.length) {
      const hole = holes[holeIndex];
      setStagedHole({ ...hole });
      setHasUnsavedChanges(false);
    }
  }, [holes]);

  // Update staged hole data
  const updateStagedHole = useCallback((updates: Partial<Hole>) => {
    setStagedHole(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      return updated;
    });
  }, []);

  // Save current hole data
  const saveCurrentHole = useCallback(() => {
    if (!stagedHole || !hasUnsavedChanges) return;

    const updatedHoles = [...holes];
    const holeIndex = updatedHoles.findIndex(h => h.number === stagedHole.number);
    
    if (holeIndex !== -1) {
      updatedHoles[holeIndex] = { ...stagedHole };
      
      // Use InteractionManager to ensure smooth navigation
      InteractionManager.runAfterInteractions(() => {
        onHolesUpdate(updatedHoles);
        setHasUnsavedChanges(false);
        setLastSavedHoleIndex(holeIndex);
      });
    }
  }, [stagedHole, hasUnsavedChanges, holes, onHolesUpdate]);

  // Auto-save when navigating away from a hole
  useEffect(() => {
    if (lastSavedHoleIndex !== -1 && lastSavedHoleIndex !== currentHoleIndex && hasUnsavedChanges) {
      saveCurrentHole();
    }
  }, [currentHoleIndex, lastSavedHoleIndex, hasUnsavedChanges, saveCurrentHole]);

  // Load initial hole data
  useEffect(() => {
    loadHoleData(currentHoleIndex);
  }, [currentHoleIndex, loadHoleData]);

  return {
    stagedHole,
    saveCurrentHole,
    loadHoleData,
    updateStagedHole,
    hasUnsavedChanges,
  };
};