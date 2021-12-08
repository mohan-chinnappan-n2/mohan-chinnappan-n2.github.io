-- CSV To List

-- tell (current date) to set theMonday to it - ((its weekday) - 2) * days

on csvToList(csvText, implementation)
	-- The 'implementation' parameter is a record with optional properties specifying the field separator character and/or trimming state. The defaults are: {separator:",", trimming:false}.
	set {separator:separator, trimming:trimming} to (implementation & {separator:",", trimming:false})
	
	script o -- For fast list access.
		property textBlocks : missing value -- For the double-quote-delimited text item(s) of the CSV text.
		property possibleFields : missing value -- For the separator-delimited text items of a non-quoted block.
		property subpossibilities : missing value -- For the paragraphs of any non-quoted field candidate actually covering multiple records. (Single-column CSVs only.)
		property fieldsOfCurrentRecord : {} -- For the fields of the CSV record currently being processed.
		property finalResult : {} -- For the final list-of-lists result.
	end script
	
	set astid to AppleScript's text item delimiters
	
	considering case
		set AppleScript's text item delimiters to quote
		set o's textBlocks to csvText's text items
		-- o's textBlocks is a list of the CSV text's text items after delimitation with the double-quote character.
		-- Assuming the convention described at top of this script, the number of blocks is always odd.
		-- Even-numbered blocks, if any, are the unquoted contents of quoted fields (or parts thereof) and don't need parsing.
		-- Odd-numbered blocks are everything else. Empty strings in odd-numbered slots (except at the beginning and end) are due to escaped double-quotes in quoted fields.
		
		set blockCount to (count o's textBlocks)
		set escapedQuoteFound to false
		-- Parse the odd-numbered blocks only.
		repeat with i from 1 to blockCount by 2
			set thisBlock to item i of o's textBlocks
			if (((count thisBlock) > 0) or (i is blockCount)) then
				-- Either this block is not "" or it's the last item in the list, so it's not due to an escaped double-quote. Add the quoted field just skipped (if any) to the field list for the current record.
				if (escapedQuoteFound) then
					-- The quoted field contained escaped double-quote(s) (now unescaped) and is spread over three or more blocks. Join the blocks, add the result to the current field list, and cancel the escapedQuoteFound flag.
					set AppleScript's text item delimiters to ""
					set end of o's fieldsOfCurrentRecord to (items quotedFieldStart thru (i - 1) of o's textBlocks) as text
					set escapedQuoteFound to false
				else if (i > 1) then -- (if this isn't the first block)
					-- The preceding even-numbered block is an entire quoted field. Add it to the current field list as is.
					set end of o's fieldsOfCurrentRecord to item (i - 1) of o's textBlocks
				end if
				
				-- Now parse the current block's separator-delimited text items, which are either complete non-quoted fields, stubs from the removal of quoted fields, or still-joined fields from adjacent records.
				set AppleScript's text item delimiters to separator
				set o's possibleFields to thisBlock's text items
				set possibleFieldCount to (count o's possibleFields)
				repeat with j from 1 to possibleFieldCount
					set thisPossibleField to item j of o's possibleFields
					set c to (count thisPossibleField each paragraph)
					if (c < 2) then
						-- This possible field doesn't contain a line break. If it's not the stub of a preceding or following quoted field, add it (trimmed if trimming) to the current field list.
						-- It's not a stub if it's an inner candidate from the block, the last candidate from the last block, the first candidate from the first block, or it contains non-white characters.
						if (((j > 1) and ((j < possibleFieldCount) or (i is blockCount))) or ((j is 1) and (i is 1)) or (notBlank(thisPossibleField))) then set end of o's fieldsOfCurrentRecord to trim(thisPossibleField, trimming)
					else if (c is 2) then -- Special-cased for efficiency.
						-- This possible field contains a line break, so it's really two possible fields from consecutive records. Split it.
						set subpossibility1 to paragraph 1 of thisPossibleField
						set subpossibility2 to paragraph 2 of thisPossibleField
						-- If the first subpossibility's not just the stub of a preceding quoted field, add it to the field list for the current record.
						if ((j > 1) or (i is 1) or (notBlank(subpossibility1))) then set end of o's fieldsOfCurrentRecord to trim(subpossibility1, trimming)
						-- Add the now-complete field list to the final result list and start one for a new record.
						set end of o's finalResult to o's fieldsOfCurrentRecord
						set o's fieldsOfCurrentRecord to {}
						-- If the second subpossibility's not the stub of a following quoted field, add it to the new list.
						if ((j < possibleFieldCount) or (notBlank(subpossibility2))) then set end of o's fieldsOfCurrentRecord to trim(subpossibility2, trimming)
					else
						-- This possible field contains more than one line break, so it's three or more possible fields from consecutive single-field records. Split it.
						set o's subpossibilities to thisPossibleField's paragraphs
						-- With each subpossibility except the last, complete the field list for the current record and initialise another. Omit the first subpossibility if it's just the stub of a preceding quoted field.
						repeat with k from 1 to c - 1
							set thisSubpossibility to item k of o's subpossibilities
							if ((k > 1) or (j > 1) or (i is 1) or (notBlank(thisSubpossibility))) then set end of o's fieldsOfCurrentRecord to trim(thisSubpossibility, trimming)
							set end of o's finalResult to o's fieldsOfCurrentRecord
							set o's fieldsOfCurrentRecord to {}
						end repeat
						-- With the last subpossibility, just add it to the new field list (if it's not the stub of a following quoted field).
						set thisSubpossibility to end of o's subpossibilities
						if ((j < possibleFieldCount) or (notBlank(thisSubpossibility))) then set end of o's fieldsOfCurrentRecord to trim(thisSubpossibility, trimming)
					end if
				end repeat
				
				-- Otherwise, the current block's an empty text item due to either an escaped double-quote in a quoted field or the opening quote of a quoted field at the very beginning of the CSV text.
			else if (escapedQuoteFound) then
				-- It's another escaped double-quote in a quoted field already flagged as containing one. Just replace the empty text with a literal double-quote.
				set item i of o's textBlocks to quote
			else if (i > 1) then -- (if this isn't the first block)
				-- It's the first escaped double-quote in a quoted field. Replace the empty text with a literal double-quote, note the index of the preceding even-numbered block (the first part of the field), and flag the find.
				set item i of o's textBlocks to quote
				set quotedFieldStart to i - 1
				set escapedQuoteFound to true
			end if
		end repeat
	end considering
	
	set AppleScript's text item delimiters to astid
	
	-- Add the remaining field list to the output if it's not empty or if the output list itself has remained empty.
	if ((o's fieldsOfCurrentRecord is not {}) or (o's finalResult is {})) then set end of o's finalResult to o's fieldsOfCurrentRecord
	
	return o's finalResult
end csvToList

-- Test whether or not a string contains any non-white characters.
on notBlank(txt)
	ignoring white space
		return (txt > "")
	end ignoring
end notBlank

-- Trim any leading or trailing spaces from a string.
on trim(txt, trimming)
	if (trimming) then
		set c to (count txt)
		repeat while ((txt begins with space) and (c > 1))
			set txt to text 2 thru -1 of txt
			set c to c - 1
		end repeat
		repeat while ((txt ends with space) and (c > 1))
			set txt to text 1 thru -2 of txt
			set c to c - 1
		end repeat
		if (txt is space) then set txt to ""
	end if
	
	return txt
end trim

-- Demos:
set csvText to "Apple , Courtland,\"\"\"Best for Cooking\"\", \"\"Heavy Demand\"\"\"" & linefeed & ",\"\"," & linefeed & " , , " & linefeed & "Peach, Eastern, Eating, Low " & linefeed & ",," & linefeed
csvToList(csvText, {})
csvToList(csvText, {trimming:true})
 