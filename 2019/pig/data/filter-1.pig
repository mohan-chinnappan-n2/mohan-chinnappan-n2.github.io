owners = LOAD 'owners.csv' 
    USING PigStorage(',')
    AS (owner:chararray,animal:chararray);

filtered = FILTER owners BY animal == 'cat';
DUMP filtered;