class PopulateLocationsTables < ActiveRecord::Migration[7.0]
  def up
    Rake::Task['locations:refresh_user_location_table'].invoke
    Rake::Task['locations:refresh_topic_location_table'].invoke
  end

  def down
    ::Locations::UserLocation.delete_all
    ::Locations::TopicLocation.delete_all
  end
end
