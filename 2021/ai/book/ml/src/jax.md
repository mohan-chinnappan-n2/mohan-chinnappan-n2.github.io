# 12. JAX



[JAX](https://github.com/google/jax) is a new library from [Google Research](https://research.google/). 
JAX can automatically differentiate native Python and Numpy functions.
- Loops
- Branches
- Recursion 
- [Closures](closure.html)
- Can take Derivative of Derivatives
    - Supports **reverse mode differentiation**, also known as [Back Propagation] using Grad function
     - Supports **forward mode differentiation**

 

## XLA
[XLA](https://www.tensorflow.org/xla) is **Accelerated Linear Algebra**. It is a **domain-specific compiler** for **linear algebra** that can **accelerate TensorFlow models** with potentially **no source code changes**.



## Autograd
Autograd (https://github.com/hips/autograd) can automatically differentiate native **Python and Numpy** code.
