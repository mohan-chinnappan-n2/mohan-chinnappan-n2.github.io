owners = LOAD 'owners.csv' 
    USING PigStorage(',')
    AS (owner:chararray,animal:chararray);

pets = LOAD 'pets.csv' 
    USING PigStorage(',')
    AS (name:chararray,animal:chararray);

grouped = COGROUP owners BY animal, pets by animal;
DUMP grouped;
