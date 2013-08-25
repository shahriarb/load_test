class LoadController < ApplicationController
	def index
		Delayed::Job.enqueue ProcessJob.new
	end
end
