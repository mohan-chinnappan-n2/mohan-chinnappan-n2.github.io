##  Pig Latin


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

### Links
[A Beginner's Guide to Pig Latin on Mac OS X 10.8](https://www.liangeugene.com/blog/a-beginners-guide-to-pig-latin-on-mac-os-x-10-8)
[Pig Word Count Tutorial](http://salsahpc.indiana.edu/ScienceCloud/pig_word_count_tutorial.htm)
