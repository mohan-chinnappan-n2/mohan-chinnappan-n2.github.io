## COGROUP

```
$ cat owners.csv
adam,cat
adam,dog
alex,fish
alice,cat
steve,dog

$ cat csv-cogroup-1.pig

owners = LOAD 'owners.csv' 
    USING PigStorage(',')
    AS (owner:chararray,animal:chararray);

grouped = COGROUP owners BY animal;
DUMP grouped


$ pig -x local csv-cogroup-1.pig

(cat,{(alice,cat),(adam,cat)})
(dog,{(steve,dog),(adam,dog)})
(fish,{(alex,fish)})


###-------------

$ cat  pets.csv
nemo,fish
fido,dog
rex,dog
paws,cat
wiskers,cat

$ cat csv-cogroup-2.pig

owners = LOAD 'owners.csv' 
    USING PigStorage(',')
    AS (owner:chararray,animal:chararray);

pets = LOAD 'pets.csv' 
    USING PigStorage(',')
    AS (name:chararray,animal:chararray);

grouped = COGROUP owners BY animal, pets by animal;
DUMP grouped;

$ pig -x csv-cogroup-2.pig

(cat,{(alice,cat),(adam,cat)},{(wiskers,cat),(paws,cat)})
(dog,{(steve,dog),(adam,dog)},{(rex,dog),(fido,dog)})
(fish,{(alex,fish)},{(nemo,fish)})


```

### Links
- [COGROUP in Apache Pig](http://joshualande.com/cogroup-in-pig)