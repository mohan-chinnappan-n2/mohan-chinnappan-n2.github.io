do shell script "ls -l ~/Desktop"
set myPath to do shell script "echo ~/keynote-dev2"
do shell script "mkdir" & space & quoted form of myPath 
-- with administrator privileges

set currtentTime to do shell script "curl https://mohansun-rum.herokuapp.com/time"