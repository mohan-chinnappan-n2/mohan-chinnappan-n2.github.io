# 12. JAX



[JAX](https://github.com/google/jax) is a new library from [Google Research](https://research.google/). 
JAX can automatically differentiate native Python and Numpy functions.
- Loops
- Branches
- Recursion 
- Closures


## Python Decorators
- [Refer](https://www.programiz.com/python-programming/decorator)


A decorator takes in a function, adds some functionality and returns it. 
```py
#  a decorator takes in a function, adds some functionality and returns it.

# takes in function to be decorated
def make_pretty(func):
    def inner():
        print("I got decorated") # getting decorated
        func() # back to the given function
    return inner


def ordinary():
    print("I am ordinary")

```

```py
# will print:  I am ordinary

ordinary()

```

```py
decorated = make_pretty(ordinary)
decorated() 
""" will print: 
    I got decorated
    I am ordinary
"""

# decorator function (make_pretty) has added
##  some new functionality to the original function (ordinary)

```


```py
# annoation way
@make_pretty # syntactic sugar
def ordinary():
    print("I am ordinary")

```

```py
iam_special = ordinary()
""" will print: 
    I got decorated
    I am ordinary
"""

```

### Decorating functions with parameters

```py
# Decorating functions with parameters

def smart_divide(func):
    def inner(a, b):
        print("I am going to divide", a, "and", b)
        if b == 0:
            print("Whoops! cannot divide by zero")
            return

        return func(a, b)
    return inner


@smart_divide
def divide(a, b):
    print(a/b)
```


```py

divide(10,2)

""" will print: 
    I am going to divide 10 and 2
    5.0
"""
```


```py

divide(10,0)

""" will print: 
    I am going to divide 10 and 0
    Whoops! cannot divide by zero
"""

```





## XLA
[XLA](https://www.tensorflow.org/xla) is Accelerated Linear Algebra. It is a **domain-specific compiler** for **linear algebra** that can **accelerate TensorFlow models** with potentially **no source code changes**.

## Autograd
Autograd (https://github.com/hips/autograd) can automatically differentiate native **Python and Numpy** code.
