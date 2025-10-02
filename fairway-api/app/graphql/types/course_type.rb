module Types
  class CourseType < Types::BaseObject
    description "A golf course"

    field :id, ID, null: false
    field :name, String, null: false
    field :address, String, null: true
    field :city, String, null: true
    field :state, String, null: true
    field :country, String, null: false
    field :postal_code, String, null: true, camelize: false
    field :full_address, String, null: false, camelize: false

    field :latitude, Float, null: false
    field :longitude, Float, null: false

    field :phone, String, null: true
    field :website, String, null: true
    field :description, String, null: true

    field :private_course, Boolean, null: false, camelize: false
    field :course_rating, Float, null: true, camelize: false
    field :slope_rating, Integer, null: true, camelize: false
    field :par, Integer, null: true
    field :total_yardage, Integer, null: true, camelize: false
    field :holes_count, Integer, null: false, camelize: false
    field :geofence_radius, Integer, null: false, camelize: false

    # Associations
    field :holes, [Types::HoleType], null: false, description: "Holes on this course"

    # Computed fields
    field :distance_meters, Integer, null: true, camelize: false, description: "Distance from search point (if applicable)"

    def holes
      # Use dataloader for batch loading to prevent N+1
      dataloader.with(Sources::ActiveRecordAssociation, ::Hole, :course_id).load(object.id)
    end

    def holes_count
      object.holes.size
    end

    def distance_meters
      # This will be set by the resolver if doing a distance-based search
      object.try(:distance_meters)
    end
  end
end
