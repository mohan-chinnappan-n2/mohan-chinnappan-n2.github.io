# Peg Parser for Python

## LL(1) parser
- A grammar can be said to be LL(1) if it can be parsed by an LL(1) parser, which in turn is defined as
    -  a top-down parser that parses the input from **L**eft to Right, performing leftmost derivation of the sentence, 
    - with just **1** token of **lookahead**

- produce a **parse table** 
    - which encodes the possible transitions between all possible **states** of the parser
    - These tables are normally constructed from the **first sets** and the follow sets of the grammar
        -  **first set** is the collection of all **terminals** that can occur first in a full derivation of that rule.
```
rule: A | B
```
- if only A can start with the terminal a and only B can start with the terminal b and the parser sees the token b when parsing this rule, it knows that it needs to follow the non-terminal B.



## Resources
-  (Peg Parser for Python)https://www.python.org/dev/peps/pep-0617/
- [Writing a PEG Parser For Fun and Profit](https://www.youtube.com/watch?v=7MuQQQWVzU4)
- ["Parsing Expression Grammars (PEG)" by Tim Raymond – Gopherpalooza 2019](https://www.youtube.com/watch?v=a37rQdV7LE4)
- [Writing compiler in GO](https://compilerbook.com/sample.pdf)
- [Writing Interpreter in GO](https://interpreterbook.com/sample.pdf)
- [How to write a compiler in Go: a quick guide](https://www.freecodecamp.org/news/write-a-compiler-in-go-quick-guide-30d2f33ac6e0/)
