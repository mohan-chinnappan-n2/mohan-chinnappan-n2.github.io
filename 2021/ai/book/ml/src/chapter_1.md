# Chapter 1 : Quick Introduction

- In traditional programming we start with **data** and **hard-coded rules** to apply on the data to get **answers**. This style of programming can't bring answers for problems predicting a type of cat in the cat picture.

Assume you need to write a program find out the given fruit is apple or orange. Traditional way will be something like this:

```py
def detect_colors(image):
# lots of code

def detect_edges(image):
# lots of code

def analyze_shapes(image):
# lots of code

def guess_texture(image):
# lots of code

def define_fruit():
# lots of code

def handle_probability():
# lots of code
```

It would be great if write a algorithm (say Classifier) which can figure out rules for us, so we do not have to write those rules by hand.

- Input: Data (say fruit image)

- Output: Predicted fruit

 
<iframe width="720" height="480" src="https://www.youtube.com/embed/cKxRvEZd3Mw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


As shown in the demo below, user provides a image of the cat, the application predicts type of the cat in that image with a confidence (probability) with help of Machine Learning.

![Image Recognition - 1 ](img/1/img-rec-1.mov.webm.gif)

To build this kind of solution using traditional programming, we may have to write too many rules or sometimes this problem is not easily solvable by our traditional programming. Here comes our hero **Machine Learning** to our rescue us!


## What is special about Machine Learning ?

How long it will take to write the code for **Solving Rubik’s Cube with a single Robot Hand** using our traditional programming? 

<iframe width="720" height="480" src="https://www.youtube.com/embed/kVmp0uGtShk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


## Steps in the ML

**Goal:  Create an accurate Model that answers our questions most of time**

### Step-1 - Gathering Data
-   To train a Model we need to
    - Collect data to train on



### Step-2 - Data Preparation

- Load the data and visualize it
- Check for data errors and data imbalances
- Split the data into 2 parts
    - 1. Training Data (80%)
    - 2. Testing Data (20%)


### Step-3 - Choosing a Model

In our case, we can use a linear model.


### Step-4 - Training the Model


 Model 
 - \\(y = mx + b\\)

- \\(x\\) is the input
- \\(y\\) is the output (prediction)

The values we are to going to adjust the training are:
- \\(m\\) (weight) and \\(b\\) (bias)

- Start the training by initializing  \\(m\\) (weight) and \\(b\\) (bias) with some random values
- At the beginning, the Model will perform very poorly
    - We compare the model's output \\(y\\) with what it should have produced (target value of y)
    - We will adjust values of \\(m\\) (weight) and \\(b\\) (bias) so that we get more accurate predictions on the next time around
    - This error correction repeats...
        - Each iteration updates \\(m\\) (weight) and \\(b\\) (bias) - called *one training step*
    - We will stop the training once we got the good accuracy (low error)


### Step-5 - Evaluating the Model
- We can check the fitness of our Model using Evaluation
- We test our Model against the **Testing Data** we created in Step-2
    - We are testing the model against data the Model has not seen yet (simulating the real-world situation)
    
### Step-6 - Parameter Tuning 
Parameters (AKA hyper-parameters) we can tune:
- How many times we run through the training dataset?
- Learning Rate
    - How far we did the error correction based on the information from the previous training step

These parameters determine:
- Accuracy of our Model
- How long it takes to train the Model

How we initialized the Model affects the Model training time
    - Random values or
    - Zero values

### Step-7 - Predication/Inference

We can use our Model to predict the values for the given input.
Power here is we can predict the values for the given input with our Model
    - not by human judgement and manual rules


<iframe width="780" height="420" src="https://www.youtube.com/embed/nKW8Ndu7Mjw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


<iframe width="780" height="420" src="https://www.youtube.com/embed/h0e2HAPTGF4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


- [Simple House Price Predictor using ML through TensorFlow in Python](https://towardsdatascience.com/simple-house-price-predictor-using-ml-through-tensorflow-in-python-cbd2b637904b)



