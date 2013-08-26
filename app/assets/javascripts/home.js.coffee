# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/
$(document).ready ->
	renewTop = (data) ->
		$('#top').text(data.replace(/\n/g, "\n"))

	gon.watch('top', interval: 1000, renewTop)