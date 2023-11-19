# frozen_string_literal: true

module ::Locations
  class TopicLocation < ActiveRecord::Base
    self.table_name = 'locations_topic'

    validates :topic_id, presence: true, uniqueness: true
    validates :coords, presence: true
  end
end
