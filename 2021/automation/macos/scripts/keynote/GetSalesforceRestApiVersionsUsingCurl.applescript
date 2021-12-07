-- curl https://mohansun-rum.herokuapp.com/time -o ~/Desktop/time.json
-- getting time in json using our RUM server

set path_to_desktop to path to desktop
set resource_url to "https://mohansun-rum.herokuapp.com/time"
set sf_url to "https://mohansun-ea-02-dev-ed.my.salesforce.com/services/data"

-- display dialog "Going to use this url: " & resource_url

set posix_path to POSIX path of path_to_desktop as text

--Download file to desktop
--display dialog posix_path


display dialog "Type your resource URL" default answer sf_url buttons {"OK", "Cancel"} default button 1



if the button returned of the result is "Cancel" then
	display dialog "Cancelled"
else
	
	set our_url to (text returned of the result)
end if

--do shell script "curl 'https://mohansun-rum.herokuapp.com/time' -o ~/Desktop.time.json"

set weblink to "'" & our_url & "'"

display dialog our_url

set file_name to "output"

set output_filename to posix_path & file_name & ".json"


set curl_command to "curl " & weblink & " -o " & output_filename

do shell script curl_command

set cat_command to "cat " & output_filename

do shell script cat_command

