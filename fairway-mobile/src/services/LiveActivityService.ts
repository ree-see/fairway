import { Platform } from 'react-native';

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
          compact: this.formatScoreToPar(data.scoreToPar),
          expanded: `Hole ${data.currentHole}/${data.totalHoles} | ${this.formatScoreToPar(data.scoreToPar)} | ${this.formatElapsedTime(data.startTime)}`
        }
      });

      // For now, simulate activity ID for testing
      this.activityId = `activity_${Date.now()}`;
      console.log('🎯 Live Activity started with ID:', this.activityId);

      // TODO: Implement native iOS module call
      // this.activityId = await NativeModules.LiveActivityModule.startActivity(data);
      
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
          compact: this.formatScoreToPar(scoreToPar),
          expanded: `Hole ${hole}/${totalHoles} | ${this.formatScoreToPar(scoreToPar)} | ${this.formatElapsedTime(startTime)}`
        }
      };

      console.log('🏌️ LIVE ACTIVITY UPDATE:', updateData);
      console.log('📱 Dynamic Island would show:');
      console.log('   Compact:', updateData.dynamicIslandContent.compact);
      console.log('   Expanded:', updateData.dynamicIslandContent.expanded);
      
      // TODO: Implement native iOS module call
      // await NativeModules.LiveActivityModule.updateActivity(this.activityId, updateData);
      
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
      
      // TODO: Implement native iOS module call
      // await NativeModules.LiveActivityModule.endActivity(this.activityId);
      
      this.activityId = null;
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
    }
  }

  private formatScoreToPar(scoreToPar: number): string {
    if (scoreToPar === 0) return 'E';
    return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
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