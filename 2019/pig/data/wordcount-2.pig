A = load './input2.txt';
B = foreach A generate flatten(TOKENIZE((chararray)$0)) as word;
DUMP B

C = group B by word;
DUMP C

D = foreach C generate COUNT(B), group;
DUMP D
