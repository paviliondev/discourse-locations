# frozen_string_literal: true
Locations::Engine.routes.draw do
  get 'search' => 'geocode#search'
  get 'validate' => 'geocode#validate'
  get 'countries' => 'geocode#countries'
  get "users_map" => "users_map#index"
  get 'map_feed' => 'list#map_feed'
end

Discourse::Application.routes.append do
  mount ::Locations::Engine, at: 'locations'
end
