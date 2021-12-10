# Closures and Decorators

## Python Closures

Let us explain **closure** by an example:

- [Refer](https://www.programiz.com/python-programming/closure)

```py

# This is the outer enclosing function
def print_msg(msg):

    def printer():
        # This is the nested function
        print(msg)

    return printer  # returns the nested function


# Now let's try calling this function.
another = print_msg("Hello")
another()
# Output: Hello
```


This technique by which **some data** in our case "Hello" gets attached to the code - *another()* is called **closure** in Python.

Three characteristics of a Python closure are: 

1. it is a nested function, in our example: *printer()* 
2. it has access to a free variable in outer scope, in our example: *msg*. 
3. it is returned from the **enclosing** function, in our example: *print_msg()*


```


``
# Python Decorators make an extensive use of closures 

```



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

