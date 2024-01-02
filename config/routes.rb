# frozen_string_literal: true
Locations::Engine.routes.draw do
  get 'search' => 'geocode#search'
  get 'validate' => 'geocode#validate'
  get 'countries' => 'geocode#countries'
  get "users_map" => "users_map#index"
end

Discourse::Application.routes.draw do
  get 'map_feed' => 'list#map_feed'
  mount ::Locations::Engine, at: 'locations'
end
