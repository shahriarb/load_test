class HomeController < ApplicationController
	def top
		gon.watch.top = `top -l1`
	end
end
