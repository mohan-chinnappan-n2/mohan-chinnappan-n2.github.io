-- sfdx mohanc:ea:dataset:export -e 0Px3h000000bnh9CAA -u mohan.chinnappan.n_ea2@gmail.com

-- run sfdx

set user to "mohan.chinnappan.n_ea2@gmail.com"
set cmd to "mohanc:ea:dataset:export" 
set sfdx to "/usr/local/bin/sfdx"
set export_id to "0Px3h000000bnh9CAA"
set exported_file to "/tmp/" & export_id & ".csv"

-- set login_cmd to sfdx & " force:auth:web:login "
-- display dialog login_cmd

set sfdx_cmd to sfdx & " " & cmd & " -u " & user & " -e " & export_id & " > " & exported_file 

display dialog "Type your sfdx command" default answer sfdx_cmd buttons {"OK", "Cancel"} default button 1

if the button returned of the result is "Cancel" then
	display dialog "Cancelled"
else
	set our_cmd to (text returned of the result)
end if

set sfdx_command to our_cmd
set results to do shell script sfdx_command

-- display dialog results

set cat_cmd  to "cat " & exported_file 

-- display dialog exported_file
set csvfile to POSIX file exported_file
tell application "Numbers"
   open csvfile
end tell





