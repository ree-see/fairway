class VerificationsController < ActionController::Base
  before_action :set_attestation, only: [:show, :confirm]
  layout 'verification'

  # GET /verify/:token
  def show
    if @attestation.attested_at.present?
      @already_verified = true
      @verification_status = @attestation.is_approved ? 'approved' : 'rejected'
    elsif @attestation.token_expired?
      render :expired, status: :gone
      return
    end

    # Track link click
    @attestation.increment!(:link_click_count)
    @attestation.update!(link_clicked_at: Time.current) if @attestation.link_clicked_at.nil?
  end

  # POST /verify/:token/confirm
  def confirm
    if @attestation.attested_at.present?
      render json: {
        success: false,
        error: 'This round has already been verified'
      }, status: :unprocessable_entity
      return
    end

    if @attestation.token_expired?
      render json: {
        success: false,
        error: 'Verification link has expired'
      }, status: :gone
      return
    end

    verified = params[:verified] == 'true' || params[:verified] == true
    verifier_name = params[:verifier_name].presence || @attestation.verifier_name

    result = VerificationLinkService.verify_from_link(
      @attestation.verification_token,
      verified: verified,
      verifier_name: verifier_name
    )

    if result[:success]
      render json: {
        success: true,
        message: verified ? 'Round verified successfully!' : 'Verification declined',
        verified: verified
      }
    else
      render json: {
        success: false,
        error: result[:error]
      }, status: :unprocessable_entity
    end
  end

  # GET /verify/:token/expired
  def expired
    # Rendered by show action when token is expired
  end

  private

  def set_attestation
    result = VerificationLinkService.get_attestation_by_token(params[:token])

    unless result[:success]
      render :invalid, status: :not_found
      return
    end

    @attestation = result[:attestation]
    @round = @attestation.round
    @player = @round.user
    @course = @round.course
  end
end