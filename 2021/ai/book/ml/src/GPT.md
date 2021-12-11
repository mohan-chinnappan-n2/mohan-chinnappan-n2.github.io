# GPT

Generative Pre-trained Transformer (GPT)

## GPT-2

GPT-2 is a large transformer-based language model with 1.5 billion parameters, trained on a dataset  of **8 million web pages**. 
GPT-2 is trained with a simple objective: 
- predict the **next word**, given all of the previous words within some text. 
- The diversity of the dataset causes this simple goal to contain naturally occurring demonstrations of many tasks across diverse domains. 
- GPT-2 is a direct scale-up of GPT, with more than **10X the parameters** and trained on more than 10X the amount of data.


" We (OpenAI) created a new dataset which emphasizes diversity of content, by scraping content from the Internet. In order to preserve document quality, we used only pages which have been **curated/filtered by humans—specifically**, we used outbound links from Reddit which received at least 3 karma. This can be thought of as a heuristic indicator for whether other users found the link interesting (whether educational or funny), leading to higher data quality than other similar datasets, such as CommonCrawl."






[GPT-2 code](https://github.com/openai/gpt-2)
[Notebook](https://colab.research.google.com/github/ilopezfr/gpt-2/blob/master/gpt-2-playground_.ipynb)


### Zero-shot learning 
Zero-shot learning (ZSL) is a problem setup in machine learning, where **at test time**, a learner observes samples from classes that **were not observed during training**, and needs to predict the class they belong to.


## [GPT-3](https://github.com/openai/gpt-3)
Generative Pre-trained Transformer 3 is an **autoregressive language model** that uses deep learning to produce human-like text. 

It is the third-generation language prediction model in the *GPT-n* series created by OpenAI.


GPT-3 is a very **large language model** (the largest till date) with about [**175B parameters**](https://github.com/openai/gpt-3/blob/master/175b_samples.jsonl). It is trained on about [**45TB of text data**](https://github.com/openai/gpt-3/blob/master/dataset_statistics/languages_by_character_count.csv) from different datasets.

- [Language Models are Few-Shot Learners](https://arxiv.org/pdf/2005.14165.pdf)
- [GPT-3 - paper with code](https://paperswithcode.com/method/gpt-3)
- [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
- [Better Language Models and Their Implication](https://openai.com/blog/better-language-models/)



