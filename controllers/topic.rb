class Locations::TopicController < ::ApplicationController
  def set_location
    location = { lat: params[:lat], lng: params[:lng] }
    topic_id = params[:topic_id]
    topic = Topic.find(topic_id)
    topic.custom_fields['location'] = location
    render json: success_json.merge(location: location)
  end

  def remove_location
    topic_id = params[:topic_id]
    TopicCustomField.remove(topic_id: topic_id, name: 'location')
    render json: success_json
  end
end
