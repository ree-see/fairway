module Admin
  class CoursesController < Admin::BaseController
    before_action :set_course, only: [:show, :edit, :update, :destroy]

    def index
      @courses = Course.order(created_at: :desc).includes(:holes)
    end

    def show
      redirect_to edit_admin_course_path(@course)
    end

    def new
      @course = Course.new
    end

    def create
      @course = Course.new(course_params)
      @course.external_source = 'manual'

      if @course.save
        redirect_to edit_holes_admin_course_path(@course),
                    notice: 'Course created successfully! Now customize the holes.'
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @course.update(course_params)
        redirect_to admin_courses_path, notice: 'Course updated successfully!'
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @course.destroy
      redirect_to admin_courses_path, notice: 'Course deleted successfully!'
    end

    private

    def set_course
      @course = Course.find(params[:id])
    end

    def course_params
      params.require(:course).permit(
        :name, :address, :city, :state, :country, :postal_code,
        :latitude, :longitude, :course_rating, :slope_rating,
        :par, :total_yardage, :phone, :website, :description,
        :private_course, :active, :geofence_radius
      )
    end
  end
end
