import ApiService from './ApiService';

export interface VerificationRequest {
  phone_number: string;
  verifier_name?: string;
}

export interface VerificationResponse {
  attestation_id: string;
  verification_token: string;
  expires_at: string;
  message_sid?: string;
}

class VerificationService {
  /**
   * Send verification request via SMS to a phone number
   */
  async sendVerificationRequest(
    roundId: string,
    phoneNumber: string,
    verifierName?: string
  ): Promise<{ success: boolean; data?: VerificationResponse; error?: string }> {
    try {
      const response = await ApiService.post(
        `/rounds/${roundId}/request_verification_link`,
        {
          phone_number: phoneNumber,
          verifier_name: verifierName,
        }
      );

      if (response.success) {
        return {
          success: true,
          data: response.data as VerificationResponse,
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to send verification request',
      };
    } catch (error: any) {
      console.error('Error sending verification request:', error);
      return {
        success: false,
        error: error.message || 'Failed to send verification request',
      };
    }
  }

  /**
   * Get verification status for a round
   */
  async getVerificationStatus(roundId: string) {
    try {
      const response = await ApiService.get(`/rounds/${roundId}`);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            is_verified: response.data.round.is_verified,
            verification_count: response.data.round.verification_count,
            fraud_risk_score: response.data.round.fraud_risk_score,
          },
        };
      }

      return {
        success: false,
        error: 'Failed to get verification status',
      };
    } catch (error: any) {
      console.error('Error getting verification status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get verification status',
      };
    }
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for 10-digit US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // Format as +X (XXX) XXX-XXXX for 11-digit numbers
    if (digits.length === 11) {
      return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // Return as-is if not a standard format
    return phone;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 0) {
      return { valid: false, error: 'Phone number is required' };
    }

    if (digits.length < 10) {
      return { valid: false, error: 'Phone number is too short' };
    }

    if (digits.length > 11) {
      return { valid: false, error: 'Phone number is too long' };
    }

    // Valid 10-digit or 11-digit (with country code)
    return { valid: true };
  }
}

export default new VerificationService();