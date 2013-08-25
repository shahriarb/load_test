require 'pusher'

Pusher.app_id = '52322'
Pusher.key = 'd22eface52ff2c39fd72'
Pusher.secret = '049bd95ef36a496e86c4'

class ProcessJob #< ActiveRecord::Base

	def enqueue(job)
	end

	def perform
		array = Array.new
		i = 0

		while i < 1000000
			random = rand(10000)
			array.insert(i, random)
			i+=1
		end

		array.sort_by { |x| x.zero? ? Float::MAX : x }
	end

	def before(job)
	end

	def after(job)
	end

	def success(job)
		count = Delayed::Job.count
		count-= 1

		data = {'message' => count}
		Pusher['load_test'].trigger('success', data)
	end

	def error(job, exception)
	end

	def failure(job)
	end
end
