fruits = LOAD 'fruits.csv' 
    USING PigStorage(',')
    AS (name:chararray,qty:int);

filtered = FILTER fruits BY qty IN( 250, 150) ; 
DUMP filtered;

-- grunt> filtered2 = FILTER fruits  BY qty IN qtys;
-- 2019-09-30 11:32:54,929 [main] ERROR org.apache.pig.tools.grunt.Grunt - ERROR 1200: <line 4, column 32>  mismatched input 'qtys' expecting LEFT_PAREN --
