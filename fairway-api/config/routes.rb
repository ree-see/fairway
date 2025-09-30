Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
  get "health" => "application#health_check"

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      scope :auth do
        post 'login', to: 'auth#login'
        post 'register', to: 'auth#register'
        post 'logout', to: 'auth#logout'
        post 'refresh', to: 'auth#refresh_token'
        get 'profile', to: 'auth#profile'
        patch 'profile', to: 'auth#update_profile'
        post 'change_password', to: 'auth#change_password'
        post 'verify_email', to: 'auth#verify_email'
        post 'resend_verification', to: 'auth#resend_verification'
        get 'stats', to: 'auth#stats'
      end

      # Course routes
      resources :courses, only: [:index, :show] do
        collection do
          get :search
          get :nearby
          post :verify_location
        end
        
        member do
          get :holes
        end
      end

      # Round routes
      resources :rounds, only: [:index, :show, :create, :update] do
        collection do
          get :statistics
        end

        member do
          patch :complete
          post :request_attestation
          post :request_verification_link
          get :hole_scores
          post 'hole_scores', to: 'rounds#add_hole_score'
        end
      end

      # Attestation routes
      resources :attestations, only: [:index, :show, :update] do
        member do
          post :approve
          post :reject
        end
      end
    end
  end

  # Public verification routes (no authentication required)
  get 'verify/:token', to: 'verifications#show', as: :verify
  post 'verify/:token/confirm', to: 'verifications#confirm', as: :confirm_verification

  # Root route
  root "application#health_check"
end
