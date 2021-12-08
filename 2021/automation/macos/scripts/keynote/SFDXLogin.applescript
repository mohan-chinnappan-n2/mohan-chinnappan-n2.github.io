-- run sfdx

set sfdx to "/usr/local/bin/sfdx"
set cmd to "force:auth:web:login" 


set sfdx_cmd to sfdx & " " & cmd 

display dialog "Type your sfdx command" default answer sfdx_cmd buttons {"OK", "Cancel"} default button 1

if the button returned of the result is "Cancel" then
	display dialog "Cancelled"
else
	set our_cmd to (text returned of the result)
end if

set sfdx_command to our_cmd
do shell script sfdx_command


