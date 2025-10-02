module Admin
  class HolesController < Admin::BaseController
    before_action :set_course

    def edit
      @holes = @course.holes.order(:number)
    end

    def update
      success = true
      errors = []

      # Wrap in transaction and temporarily set handicaps to nil to avoid uniqueness conflicts
      ActiveRecord::Base.transaction do
        # First pass: set all handicaps to nil
        holes_params.each_key do |hole_id|
          hole = @course.holes.find(hole_id)
          hole.update_column(:handicap, nil)
        end

        # Second pass: update with new values
        holes_params.each do |hole_id, hole_attributes|
          hole = @course.holes.find(hole_id)
          unless hole.update(hole_attributes)
            success = false
            errors << "Hole #{hole.number}: #{hole.errors.full_messages.join(', ')}"
            raise ActiveRecord::Rollback
          end
        end
      end

      if success
        redirect_to admin_courses_path, notice: 'All holes updated successfully!'
      else
        @holes = @course.holes.order(:number)
        flash.now[:alert] = errors.join('; ')
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def set_course
      @course = Course.find(params[:id])
    end

    def holes_params
      params.require(:holes).permit!
    end
  end
end
