# BERT
BERT, which stands for Bidirectional Encoder Representations from Transformers, is based on **Transformers**, a deep learning model in which every output element is connected to every input element, and the weightings between them are dynamically calculated based upon their **connection**.


BERT is a technology to generate **contextualized** word embeddings/vectors, which is its biggest advantage but also it's biggest disadvantage as it is **very compute-intensive at inference time**, meaning that if you want to use it in production at scale, it can become costly.


- [Paper: Attention Is All You Need](https://arxiv.org/pdf/1706.03762.pdf)


 **Transformer encoder** reads the entire sequence of words at once. Therefore it is considered bidirectional, though it would be more accurate to say that it’s non-directional. This characteristic allows the model to learn the context of a word based on all of its surroundings (left and right of the word)

 - [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/pdf/1810.04805.pdf)
 - [The Illustrated BERT, ELMo, and co. (How NLP Cracked Transfer Learning)](https://jalammar.github.io/illustrated-bert/)
 - [Hugging face - BERT](https://huggingface.co/docs/transformers/model_doc/bert)

