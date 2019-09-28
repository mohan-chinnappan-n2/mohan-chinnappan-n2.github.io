A = load './input2.txt';
B = foreach A generate flatten(TOKENIZE((chararray)$0)) as word;
store B into './results_B';

C = group B by word;
store C into './results_C';


D = foreach C generate COUNT(B), group;
store D into './results_D';
