-- run sfdx

set user to "mohan.chinnappan.n_ea2@gmail.com"
set cmd to "mohanc:data:query " 
set sfdx to "/usr/local/bin/sfdx"
set input to "/tmp/accts.soql"
set format to "json"

set login_cmd to sfdx & " force:auth:web:login "
-- display dialog login_cmd


-- sfdx mohanc:data:query -q /tmp/accts.soql -u  -f json

set path_to_desktop to path to desktop
set sfdx_cmd to sfdx & " " & cmd & " -u " & user & " -q " & input & " -f " &  format

display dialog "Type your sfdx command" default answer sfdx_cmd buttons {"OK", "Cancel"} default button 1

if the button returned of the result is "Cancel" then
	display dialog "Cancelled"
else
	set our_cmd to (text returned of the result)
end if

set sfdx_command to our_cmd
set results to do shell script sfdx_command

display dialog results

tell application "JSON Helper"
   read JSON from  results
   set account to contents of the result's 1st item

 end tell




