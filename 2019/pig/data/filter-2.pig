fruits = LOAD 'fruits.csv' 
    USING PigStorage(',')
    AS (name:chararray,qty:int);

filtered = FILTER fruits BY qty == 250;
DUMP filtered;