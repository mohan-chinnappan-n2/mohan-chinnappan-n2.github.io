# Word2Vec
[Word2vec](https://en.wikipedia.org/wiki/Word2vec) is a technique for natural language processing (NLP).
Word2vec is used to produce word embeddings.

Uses a neural network model to learn **word associations** from a **large corpus of text**.

Once trained, such a model can detect *synonymous words*  or suggest additional words for a partial sentence.

 Word2vec represents each *distinct word* with a particular list of numbers called a *vector*.

 The vectors are chosen carefully such that a simple mathematical function (the *cosine similarity* between the vectors) indicates the level of *semantic similarity* between the words represented by those vectors.


 Takes in large corpus of text as input and produces a vector space, typically of *several hundred dimensions*, with each unique word in the corpus being assigned a corresponding vector in the space.
 -  Word vectors are positioned in the vector space such that words that share *common contexts* in the corpus are located *close to one another* in the space.

### Papers
- [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/pdf/1301.3781.pdf)
- [Distributed Representations of Words and Phrases and their Compositionality](https://proceedings.neurips.cc/paper/2013/file/9aa42b31882ec039965f3c4923ce901b-Paper.pdf)


### Continuous Bag-of-Words Model
-  Predicts the middle word based on surrounding context words. 
    - The context consists of a few words before and after the current (middle) word. This architecture is called a bag-of-words model as the order of words in the context is not important.

### Continuous Skip-gram Model 
- Predicts words within a certain range before and after the current word in the same sentence. 

Consider the following sentence of 8 words:
```
The wide road shimmered in the hot sun.
```

The context words for each of the 8 words of this sentence are defined by a *window size*.
The window size determines the *span of words on either side of a target_word* (one underlined) that can be considered context word. Take a look at this table of skip-grams for target words based on different window sizes.

![window size](https://tensorflow.org/tutorials/text/images/word2vec_skipgram.png)

#### Training Objective
-  Maximize the probability of predicting **context words** (w) given the target word (\\(w_t\\)).
- For a sequence of words \\(w_1,w_2, ... w_T\\), the objective can be written as the average log probability. where \\(c\\) is the size of the training context. 


 


![prob](https://tensorflow.org/tutorials/text/images/word2vec_skipgram_objective.png)

### Notebooks
- [word2vec](https://colab.research.google.com/drive/1oSx0wd2lC4B15KWDinOjqptZtytqRkhk?usp=sharing)
- [Understanding word vectors](https://gist.github.com/aparrish/2f562e3737544cf29aaf1af30362f469#file-understanding-word-vectors-ipynb)

- [Word2Vec - TensorFlow](https://colab.research.google.com/github/tensorflow/docs/blob/master/site/en/tutorials/text/word2vec.ipynb)

### Videos
<iframe width="720" height="480" src="https://www.youtube.com/embed/LSS_bos_TPI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


<iframe width="720" height="480" src="https://www.youtube.com/embed/L3D0JEA1Jdc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<iframe width="720" height="480" src="https://www.youtube.com/embed/mI23bDF0VRI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


 ##  Word embedding 
 Word embedding is a term used for the representation of words for text analysis, typically in the form of a *real-valued vector* that encodes the *meaning of the word* such that:
    -  the words that are *closer in the vector space* are expected to be *similar* in meaning
