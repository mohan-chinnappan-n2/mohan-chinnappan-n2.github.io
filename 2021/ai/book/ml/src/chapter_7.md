# 7. Transformers

A [transformer](https://en.wikipedia.org/wiki/Transformer_(machine_learning_model)) is a deep learning model that adopts the mechanism of **self-attention**, **differentially weighting the significance** of each part of the input data.


Like recurrent neural networks (RNNs), transformers are designed to **handle sequential input data**, such as natural language, for tasks such as **translation and text summarization**. 
However, unlike RNNs, transformers do not necessarily process the data in order. Instead the attention mechanism provides **context for any position** in the input sequence. 

For example, if the input data is a natural language sentence, the transformer **does not need to process the beginning of the sentence before the end**. Rather, it identifies the **context** that confers **meaning** to each word in the sentence. 
This feature allows for more parallelization than RNNs and therefore reduces training times.


Before transformers, most state-of-the-art NLP systems relied on gated RNNs, such as LSTM and gated recurrent units (GRUs), with **added attention** mechanisms. 

Transformers are built **on these attention** technologies without using an RNN structure, highlighting the fact that **attention mechanisms alone can match the performance** of RNNs with attention.


Gated RNNs process tokens sequentially, maintaining **a state vector** that contains a representation of the data seen after every token.


To process the *n*th token, the model combines the state representing the sentence up to token *n-1* with the information of the new token to create a **new state**, representing the sentence up to token *n*. 

**Theoretically**, the information from one token can propagate arbitrarily far down the sequence, if at every point the state continues to encode contextual information about the token. 

**In practice** this mechanism is flawed: the **vanishing gradient problem** leaves the model's state at the end of a long sentence **without precise, extractable information about preceding tokens**.

This problem was addressed by **attention mechanisms**. Attention mechanisms let a model draw from the state at any preceding point along the sequence. 

The attention layer can access **all previous states and weigh them according to a learned measure of relevancy**, providing relevant information about far-away tokens.

A clear example of the value of attention is in **language translation**, where **context is essential** to assign the meaning of a word in a sentence. 
In an English-to-French translation system, the first word of the French output most probably depends heavily on the **first few words of the English input**. 
However, in a classic LSTM model, in order to produce the first word of the French output, the model is **given only the state vector of the last English word**. 
Theoretically, this vector can encode information about the whole English sentence, giving the model all necessary knowledge. 
In practice, this information is often **poorly preserved by the LSTM**. 
An *attention mechanism can be added to address this problem*: 
    - the decoder is given *access to the state vectors of every English input word, not just the last*, and can learn attention weights that dictate how much to attend to each English input state vector.

Transformers use an attention mechanism **without an RNN**
- processing all tokens at the same time 
-  calculating attention weights between them in **successive layers**.






### [Vanishing Gradient problem](https://en.wikipedia.org/wiki/Vanishing_gradient_problem)
In machine learning, the vanishing gradient problem is encountered when training artificial neural networks with *gradient-based learning methods and backpropagation*.
    - In such methods, each of the neural network's **weights** receives an update proportional to the **partial derivative** of the error function with respect to the current weight in each iteration of training.
    - The problem is that in some cases, the **gradient will be vanishingly small**, effectively **preventing the weight from changing its value**
    - In the worst case, this may completely **stop** the neural network from further training










