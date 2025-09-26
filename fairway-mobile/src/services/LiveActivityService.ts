import { Platform } from 'react-native';
import LiveActivity from 'react-native-live-activity';

interface RoundActivityData {
  courseId: number;
  courseName: string;
  startTime: string;
  currentHole: number;
  totalHoles: number;
  scoreToPar: number;
  currentScore: number;
}

class LiveActivityService {
  private activityId: string | null = null;
  private isSupported = Platform.OS === 'ios' && Platform.Version >= '16.1';

  async startRoundActivity(data: RoundActivityData): Promise<void> {
    if (!this.isSupported) {
      console.log('Live Activities not supported on this device');
      return;
    }

    try {
      // For now, we'll log the activity data
      // In production, this would integrate with iOS ActivityKit
      console.log('Starting Live Activity for round:', {
        courseName: data.courseName,
        startTime: data.startTime,
        dynamicIslandContent: {
          compact: this.formatScoreToPar(data.scoreToPar, data.currentHole),
          expanded: `Hole ${data.currentHole}/${data.totalHoles} | ${this.formatScoreToPar(data.scoreToPar, data.currentHole)} | ${this.formatElapsedTime(data.startTime)}`
        }
      });

      // Start actual Live Activity
      try {
        const activityData = {
          courseName: data.courseName,
          currentHole: data.currentHole,
          totalHoles: data.totalHoles,
          scoreToPar: data.scoreToPar,
          startTime: data.startTime,
        };

        this.activityId = await LiveActivity.startActivity('GolfRound', activityData);
        console.log('🎯 Live Activity started with ID:', this.activityId);
      } catch (activityError) {
        console.warn('Failed to start native Live Activity:', activityError);
        // Fallback to simulation for testing
        this.activityId = `activity_${Date.now()}`;
        console.log('🎯 Using simulated Live Activity ID:', this.activityId);
      }
      
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
    }
  }

  async updateScore(hole: number, totalHoles: number, scoreToPar: number, startTime: string): Promise<void> {
    console.log('LiveActivityService.updateScore called:', { 
      isSupported: this.isSupported, 
      hasActivityId: !!this.activityId,
      hole,
      totalHoles,
      scoreToPar 
    });

    if (!this.isSupported) {
      console.log('Live Activities not supported on this device');
      return;
    }

    if (!this.activityId) {
      console.log('No activity ID found, cannot update');
      return;
    }

    try {
      const updateData = {
        currentHole: hole,
        totalHoles,
        scoreToPar,
        dynamicIslandContent: {
          compact: this.formatScoreToPar(scoreToPar, hole),
          expanded: `Hole ${hole}/${totalHoles} | ${this.formatScoreToPar(scoreToPar, hole)} | ${this.formatElapsedTime(startTime)}`
        }
      };

      console.log('🏌️ LIVE ACTIVITY UPDATE:', updateData);
      console.log('📱 Dynamic Island would show:');
      console.log('   Compact:', updateData.dynamicIslandContent.compact);
      console.log('   Expanded:', updateData.dynamicIslandContent.expanded);
      
      // Update actual Live Activity
      try {
        const activityUpdateData = {
          currentHole: hole,
          totalHoles,
          scoreToPar,
          startTime,
        };

        await LiveActivity.updateActivity(this.activityId, activityUpdateData);
        console.log('✅ Live Activity updated successfully');
      } catch (activityError) {
        console.warn('Failed to update native Live Activity:', activityError);
      }
      
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }

  async endActivity(): Promise<void> {
    if (!this.isSupported || !this.activityId) {
      return;
    }

    try {
      console.log('Ending Live Activity');
      
      // End actual Live Activity
      try {
        await LiveActivity.endActivity(this.activityId);
        console.log('✅ Live Activity ended successfully');
      } catch (activityError) {
        console.warn('Failed to end native Live Activity:', activityError);
      }
      
      this.activityId = null;
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
    }
  }

  private formatScoreToPar(scoreToPar: number, completedHoles: number): string {
    if (completedHoles === 0) return 'E';
    
    if (scoreToPar === 0) {
      return completedHoles === 18 ? 'E' : `E thru ${completedHoles}`;
    }
    
    const scoreText = scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
    return completedHoles === 18 ? scoreText : `${scoreText} thru ${completedHoles}`;
  }

  private formatElapsedTime(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}m`;
  }

  isLiveActivitySupported(): boolean {
    return this.isSupported;
  }
}

export default new LiveActivityService();