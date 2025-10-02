# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ID], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    # Course queries
    field :course, Types::CourseType, null: true, description: "Find a course by ID" do
      argument :id, ID, required: true, description: "Course ID"
    end

    def course(id:)
      Course.active.find(id)
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "Course with ID #{id} not found"
    end

    field :nearby_courses, [Types::CourseType], null: false, camelize: false, description: "Find courses near a location" do
      argument :latitude, Float, required: true
      argument :longitude, Float, required: true
      argument :radius, Integer, required: false, description: "Search radius in kilometers (default: 25)"
    end

    def nearby_courses(latitude:, longitude:, radius: 25)
      courses = Course.active
                      .near(latitude, longitude, radius)
                      .includes(:holes)
                      .limit(20)

      # Calculate and attach distance to each course
      courses.map do |course|
        distance = course.distance_from(latitude, longitude)
        # Add distance_meters as a virtual attribute
        course.define_singleton_method(:distance_meters) { distance&.round }
        course
      end.sort_by { |c| c.distance_meters || Float::INFINITY }
    end
  end
end
