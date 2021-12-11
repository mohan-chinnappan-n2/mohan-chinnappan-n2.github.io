# TensorFlow.js

TensorFlow.js (TFJS) is a library for machine learning in JavaScript.
Using TFJS you can develop ML models in JavaScript, and use ML directly in the browser or in Node.js.


## Browser
```js

<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js"></script>

```

## Node.js

```bash

# install TensorFlow.js. using npm or yarn
yarn add @tensorflow/tfjs

# Install TensorFlow.js with native C++ bindings.
yarn add @tensorflow/tfjs-node

# if your system has a NVIDIA® GPU with CUDA support, use the GPU package even for higher performance.
yarn add @tensorflow/tfjs-node-gpu


```


```js

const tf = require('@tensorflow/tfjs');

// Optional Load the binding:
// Use '@tensorflow/tfjs-node-gpu' if running with GPU.
require('@tensorflow/tfjs-node');

// Train a simple model:
const model = tf.sequential();
model.add(tf.layers.dense({units: 100, activation: 'relu', inputShape: [10]}));
model.add(tf.layers.dense({units: 1, activation: 'linear'}));
model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});

const xs = tf.randomNormal([100, 10]);
const ys = tf.randomNormal([100, 1]);

model.fit(xs, ys, {
  epochs: 100,
  callbacks: {
    onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
  }
});
  
```

