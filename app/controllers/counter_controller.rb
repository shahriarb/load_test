class CounterController < ApplicationController
	def counter
		data = IO.readlines("/lib/tasks/log.txt")
		data.each do |line|
		 	@cpu = line
		end
	end
end
