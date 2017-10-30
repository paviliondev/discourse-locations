class Locations::Map
  def self.sorted_list_filters
    @sorted_list_filters ||= []
  end

  def self.list_filters
    sorted_list_filters.map { |h| { block: h[:block] } }
  end

  def self.add_list_filter(priority = 0, &block)
    sorted_list_filters << { priority: priority, block: block }
    @sorted_list_filters.sort_by! { |h| -h[:priority] }
  end
end
