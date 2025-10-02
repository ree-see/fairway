module Admin
  class BaseController < ActionController::Base
    before_action :verify_localhost_access
    layout 'admin'

    private

    def verify_localhost_access
      return if request.remote_ip == '127.0.0.1' ||
                request.remote_ip == '::1' ||
                request.remote_ip == 'localhost' ||
                Rails.env.development?

      render plain: 'Access denied. Admin interface only accessible from localhost.', status: :forbidden
    end
  end
end
