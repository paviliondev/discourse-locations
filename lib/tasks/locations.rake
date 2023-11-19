# frozen_string_literal: true
desc "Update location table for each user"
task "locations:refresh_user_location_table", %i[missing_only delay] => :environment do |_, args|
  ENV["RAILS_DB"] ? refresh_user_location_table(args) : refresh_user_location_table_all_sites(args)
end

def refresh_user_location_table_all_sites(args)
  RailsMultisite::ConnectionManagement.each_connection { |db| refresh_user_location_table(args) }
end

def refresh_user_location_table(args)
  puts "-" * 50
  puts "Refreshing data for user locations for '#{RailsMultisite::ConnectionManagement.current_db}'"
  puts "-" * 50

  missing_only = args[:missing_only]&.to_i
  delay = args[:delay]&.to_i

  puts "for missing only" if !missing_only.to_i.zero?
  puts "with a delay of #{delay} second(s) between API calls" if !delay.to_i.zero?
  puts "-" * 50

  if delay && delay < 1
    puts "ERROR: delay parameter should be an integer and greater than 0"
    exit 1
  end

  begin
    total = User.count
    refreshed = 0
    batch = 1000

    (0..(total - 1).abs).step(batch) do |i|
      User
        .order(id: :desc)
        .offset(i)
        .limit(batch)
        .each do |user|
          if !missing_only.to_i.zero? && ::Locations::UserLocation.find_by(user_id: user.id).nil? || missing_only.to_i.zero?
            Locations::UserLocationProcess.upsert(user.id)
            sleep(delay) if delay
          end
          print_status(refreshed += 1, total)
        end
    end
  end

  puts "", "#{refreshed} users done!", "-" * 50
end

desc "Update locations table for each topic"
task "locations:refresh_topic_location_table", %i[missing_only delay] => :environment do |_, args|
  ENV["RAILS_DB"] ? refresh_topic_location_table(args) : refresh_topic_location_table_all_sites(args)
end

def refresh_topic_location_table_all_sites(args)
  RailsMultisite::ConnectionManagement.each_connection { |db| refresh_topic_location_table(args) }
end

def refresh_topic_location_table(args)
  puts "-" * 50
  puts "Refreshing data for topic locations for '#{RailsMultisite::ConnectionManagement.current_db}'"
  puts "-" * 50

  missing_only = args[:missing_only]&.to_i
  delay = args[:delay]&.to_i

  puts "for missing only" if !missing_only.to_i.zero?
  puts "with a delay of #{delay} second(s) between API calls" if !delay.to_i.zero?
  puts "-" * 50

  if delay && delay < 1
    puts "ERROR: delay parameter should be an integer and greater than 0"
    exit 1
  end

  begin
    total = Topic.count
    refreshed = 0
    batch = 1000

    (0..(total - 1).abs).step(batch) do |i|
      Topic
        .order(id: :desc)
        .offset(i)
        .limit(batch)
        .each do |topic|
          if !missing_only.to_i.zero? && ::Locations::TopicLocation.find_by(topic_id: topic.id).nil? || missing_only.to_i.zero?
            Locations::TopicLocationProcess.upsert(topic.id)
            sleep(delay) if delay
          end
          print_status(refreshed += 1, total)
        end
    end
  end

  puts "", "#{refreshed} topics done!", "-" * 50
end
