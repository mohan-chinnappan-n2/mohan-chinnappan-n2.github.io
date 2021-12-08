tell application "JSON Helper"
	
	-- create JSON from an AppleScript record
	
	make JSON from {pets:{"cat", "dog", "fish"}}
	
	-- make an AppleScript record from JSON
	
	read JSON from "{\"pets\": [\"cat\",\"dog\",\"fish\"]}"
	
	-- fetch JSON from a URL
	
	fetch JSON from "https://api.github.com/repos/blishen/TableViewPopup"
	
end tell