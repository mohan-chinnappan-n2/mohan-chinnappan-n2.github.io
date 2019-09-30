## FILTER

### Example 1
```
$ cat owners.csv
adam,cat
adam,dog
alex,fish
alice,cat
steve,dog


$ cat filter-1.pig
owners = LOAD 'owners.csv' 
    USING PigStorage(',')
    AS (owner:chararray,animal:chararray);

filtered = FILTER owners BY animal == 'cat';
DUMP filtered;

$ pig -x local filter-1.pig

## ---- filtered ---- 
(adam,cat)
(alice,cat)






```
### Example 2
```
$ cat friuts.csv
name,qty
Mango,150
Jackfruit,200
Banana,250


$ cat filter-2.pig
fruits = LOAD 'fruits.csv' 
    USING PigStorage(',')
    AS (name:chararray,qty:int);

filtered = FILTER fruits BY qty == 250;
DUMP filtered;

$ pig -x local filter-2.pig




## ---- filtered ---- 
(Banana,250)



$ cat filter-3.pig
fruits = LOAD 'fruits.csv' 
    USING PigStorage(',')
    AS (name:chararray,qty:int);

filtered = FILTER fruits BY qty IN (250, 150);
DUMP filtered;

$ pig -x local filter-3.pig




## ---- filtered ---- 
(Mango,150)
(Banana,250)



```


### Refer
- [IN function](https://community.cloudera.com/t5/Community-Articles/Apache-Pig-IN-operator-placeholder-until-PIG-4931-is-closed/ta-p/246993)
- [Cheat sheet](https://www.qubole.com/resources/pig-function-cheat-sheet/)