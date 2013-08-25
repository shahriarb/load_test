# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
LoadTest::Application.initialize!

require 'pusher'

Pusher.url = "http://d22eface52ff2c39fd72:049bd95ef36a496e86c4@api.pusherapp.com/apps/52322"
Pusher.logger = Rails.logger