module Sources
  class ActiveRecordAssociation < GraphQL::Dataloader::Source
    def initialize(model_class, foreign_key)
      @model_class = model_class
      @foreign_key = foreign_key
    end

    def fetch(ids)
      records = @model_class.where(@foreign_key => ids).to_a

      # Group records by foreign key
      grouped = records.group_by { |record| record.public_send(@foreign_key) }

      # Return in same order as requested ids
      ids.map { |id| grouped[id] || [] }
    end
  end
end
