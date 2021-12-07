-- curl https://mohansun-rum.herokuapp.com/time -o ~/Desktop/time.json
-- getting time in json using our RUM server

set path_to_desktop to path to desktop

set posix_path to POSIX path of path_to_desktop as text

--Download file to desktop
--display dialog posix_path


display dialog "Type your request (example: time)" default answer "" buttons {"OK", "Cancel"} default button 1



if the button returned of the result is "Cancel" then
	display dialog "Cancelled"
else
	
	set our_code to (text returned of the result)
end if

--do shell script "curl 'https://mohansun-rum.herokuapp.com/time' -o ~/Desktop.time.json"

set weblink to "'https://mohansun-rum.herokuapp.com/" & our_code & "'"


set curl_command to "curl " & weblink & " -o " & posix_path & our_code & ".json"

do shell script curl_command

