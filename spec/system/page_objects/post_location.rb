# frozen_string_literal: true

module PageObjects
  module Components
    class PostLocation < PageObjects::Components::Base
      def initialize(post)
        @post_selector = ".topic-post[data-post-number='#{post.post_number}']"
      end

      def bounds
        {
          avatar: element_bounds(".topic-avatar"),
          summary: element_bounds(".location-summary"),
          location: element_bounds(".user-location"),
          flag: element_bounds(".location-flag")
        }
      end

      def has_location?(text)
        has_css?("#{@post_selector} .user-location", text:)
      end

      private

      def element_bounds(selector)
        find("#{@post_selector} #{selector}").rect.transform_keys(&:to_sym)
      end
    end
  end
end
