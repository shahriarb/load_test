class CounterController < ApplicationController
	def counter
		script = "$RAILS_STACK_PATH/lib/tasks/cpu.sh"
		system("sh #{script}")
	end
end
