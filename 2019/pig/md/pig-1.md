##  Pig Latin

- Language which can be used to analyze the data in Hadoop using Apache Pig
- Interpreter layer transforms Pig Latin statements into MapReduce jobs
- Hadoop process these jobs further
- Has SQL like semantics
- extensible by writing user-defined functions (UDF) using java



### Relation Operators

- Loading and Storing
    - LOAD It loads the data from a file system into a relation.
    - STORE It stores a relation to the file system (local/HDFS).
- Filtering
    - FILTER  removes of unwanted rows from a relation.
    - DISTINCT  removes duplicate rows from a relation.
    - FOREACH, GENERATE	 transforms the data based on the columns of data
    - STREAM  transforms a relation using an external program
- Grouping and Joining
    - JOIN  joins two or more relations.
    - COGROUP  grouping of the data into two or more relations.
    - GROUP groups the data in a single relation.
    - CROSS creates the cross product of two or more relations
- Sorting
    - ORDER arranges a relation in an order based on one or more fields
    - LIMIT gets a particular number of tuples from a relation.
- Combining and Splitting
    - UNION combines two or more relations into one relation.
    - SPLIT splits a single relation into more relations.
- Diagnostic Operators
    - DUMP prints the content of a relationship through the console
    - DESCRIBE describes the schema of a relation.
    - EXPLAIN explains logical, physical execution plans to evaluate a relation.
    - ILLUSTRATE  displays all the execution steps as the series of statements.


- [ref](https://data-flair.training/blogs/apache-pig-built-in-functions/)











### Install

```
brew install pig

# To run pig locally:
pig -x local

$ cat input2.txt 
this is the time for all good men to go for the aid of the country
all truly great things are simple 

$ cat wordcount.pig
A = load './input2.txt';
B = foreach A generate flatten(TOKENIZE((chararray)$0)) as word;
store B into './results_B';

C = group B by word;
store C into './results_C';


D = foreach C generate COUNT(B), group;
store D into './results_D';

$ cat results_B/part-m-00000 
this
is
the
time
for
all
good
men
to
go
for
the
aid
of
the
country
all
truly
great
things
are
simple


$ cat results_C/part-r-00000 
go	{(go)}
is	{(is)}
of	{(of)}
to	{(to)}
aid	{(aid)}
all	{(all),(all)}
are	{(are)}
for	{(for),(for)}
men	{(men)}
the	{(the),(the),(the)}
good	{(good)}
this	{(this)}
time	{(time)}
great	{(great)}
truly	{(truly)}
simple	{(simple)}
things	{(things)}
country	{(country)}

$ cat results_D/part-r-00000 
1	go
1	is
1	of
1	to
1	aid
2	all
1	are
2	for
1	men
3	the
1	good
1	this
1	time
1	great
1	truly
1	simple
1	things
1	country
```

### Using DUMP
```
A = load './input2.txt';
B = foreach A generate flatten(TOKENIZE((chararray)$0)) as word;
DUMP B

C = group B by word;
DUMP C

D = foreach C generate COUNT(B), group;
DUMP D


```

### DUMP Results
```
#---- B
(this)
(is)
(the)
(time)
(for)
(all)
(good)
(men)
(to)
(go)
(for)
(the)
(aid)
(of)
(the)
(country)
(all)
(truly)
(great)
(things)
(are)
(simple)


#---- C
(go,{(go)})
(is,{(is)})
(of,{(of)})
(to,{(to)})
(aid,{(aid)})
(all,{(all),(all)})
(are,{(are)})
(for,{(for),(for)})
(men,{(men)})
(the,{(the),(the),(the)})
(good,{(good)})
(this,{(this)})
(time,{(time)})
(great,{(great)})
(truly,{(truly)})
(simple,{(simple)})
(things,{(things)})
(country,{(country)}


#---- D
(1,go)
(1,is)
(1,of)
(1,to)
(1,aid)
(2,all)
(1,are)
(2,for)
(1,men)
(3,the)
(1,good)
(1,this)
(1,time)
(1,great)
(1,truly)
(1,simple)
(1,things)
(1,country

```



