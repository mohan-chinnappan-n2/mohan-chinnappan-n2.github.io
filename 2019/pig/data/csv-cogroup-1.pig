owners = LOAD 'owners.csv' 
    USING PigStorage(',')
    AS (owner:chararray,animal:chararray);

grouped = COGROUP owners BY animal;
DUMP grouped;
