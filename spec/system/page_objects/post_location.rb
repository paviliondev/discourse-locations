# frozen_string_literal: true

module PageObjects
  module Components
    class PostLocation < PageObjects::Components::Base
      def initialize(post)
        @post_selector = ".topic-post[data-post-number='#{post.post_number}']"
      end

      def bounds
        {
          avatar: find("#{@post_selector} .topic-avatar").native.bounding_box,
          summary:
            find("#{@post_selector} .location-summary").native.bounding_box,
          location:
            find("#{@post_selector} .user-location").native.bounding_box,
          flag: find("#{@post_selector} .location-flag").native.bounding_box
        }
      end

      def has_location?(text)
        has_css?("#{@post_selector} .user-location", text:)
      end
    end
  end
end
