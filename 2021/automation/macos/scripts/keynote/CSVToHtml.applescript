set strOutput to "" as string

-- Choose and read contents of CSV file

set pathInputFile to (choose file with prompt "Select the CSV file" of type "csv")
set strFileContents to read pathInputFile

set parFileContents to (paragraphs of strFileContents)
set numRows to count of parFileContents
log "Number of Rows: " & numRows

-- Parse CSV Row into 'Columns'

repeat with iPar from 2 to number of items in parFileContents -- set to 1 if no header row
	set lstRow to item iPar of parFileContents
	if lstRow = "" then exit repeat -- EXIT Loop if Row is empty, like the last line
	
	set lstFieldsinRow to parseCSV(lstRow as text)
	
	set strYear to item 1 of lstFieldsinRow -- COL 1 of CSV file
	set strTitle to item 2 of lstFieldsinRow -- COL 2 of CSV file
	set strDesc to item 3 of lstFieldsinRow -- COL 3 of CSV file
	
	log lstFieldsinRow
	--log "[" & (iPar - 1) & "]: " & strTag
	
	
	-- Write content of Row to strOutput
	-- Use [\"] for Quotes inside output string
	
	set strOutput to strOutput & "<div class=\"column\">" & return & "<div class=\"title\">" & return & "<h1> " & strYear & "</h1>" & return & "<h2> " & strTitle & "</h2>" & return & "</div>" & return & "<div class=\"description\">" & return & "<p>" & strDesc & "</p>" & return & "</div>" & return & "</div>" & return & return
	
	
	log strOutput
	
	-- Loop to EOF or Exit
end repeat -- with iPar


-- Set Output File
set outputFile to ((path to desktop as text) & "TimeLineOutput_html.txt")

-- Write Body to File
try
	set fileReference to open for access file outputFile with write permission
	write strOutput to fileReference
	close access fileReference
on error
	try
		close access file outputFile
	end try
end try


-- Functions

on parseCSV(pstrRowText)
	set {od, my text item delimiters} to {my text item delimiters, ","}
	set parsedText to text items of pstrRowText
	set my text item delimiters to od
	return parsedText
end parseCSV


