class CounterController < ApplicationController
	def counter
		#data = IO.readlines("/lib/tasks/log.txt")
		#data.each do |line|
		# 	@cpu = line
		#end
	end

	def top
		@variable = rand(100)
		gon.watch.top = `top -l1`
	end
end
