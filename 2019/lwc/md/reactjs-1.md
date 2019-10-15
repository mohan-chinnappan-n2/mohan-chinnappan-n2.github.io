## React JS

### Beauty of ReactDOM

- ReactDOM updates the real DOM with only ```pre``` element
- While native JS method updates the entire DOM every second!
-  React is changing only the content of the ```pre``` element and not the whole DOM tree. 
- This is React’s smart diffing algorithm in action
- This possible because of React’s virtual DOM representation that it keeps around in memory. 
-  React will take to the browser only the needed "partial" updates.
- Having React do all the computations about whether we should or should not update the DOM enables us to focus on thinking about our data (state) and the way to describe a UI for it

- ![demo](img/react-js-basic-1.gif)

- ![React JS arch](img/reactjs-1.svg?v=2)


``` 
// https://jscomplete.com/playground/s341875

/*
  Write JavaScript/React code here and press Ctrl+Enter to execute.

  Try: mountNode.innerHTML = 'Hello World!';
   Or: ReactDOM.render(<h2>Hello React!</h2>, mountNode);
*/

const Button = ({ label }) => (
  <button type="submit">{label}</button>
);
// To render a Button element in the browser
ReactDOM.render(<Button label="edit" />, mountNode);

```

```
// https://jscomplete.com/playground/s341900


const RandomValue = () => (
  <div>
    { Math.floor(Math.random() * 100) }
  </div>
);

ReactDOM.render(<RandomValue />, mountNode)

```


```
// https://jscomplete.com/playground/s341925
const ErrorDisplay = ({ message }) => (
  <div style={ { color:'red', backgroundColor:'yellow' } }>
    {message}
  </div>
);
//  React translates these style objects into inline CSS style attributes. 

ReactDOM.render(
  <ErrorDisplay
    message="These aren't the droids you're looking for"
  />,
  mountNode
);
```

```

// https://jscomplete.com/playground/s341942
class ConditionalStyle extends React.Component {
	render() {
  	return (
    	<div style={{ color: Math.random() < 0.5 ? 'green': 'red' }}>
    	  How do you like this?
    	</div>
    );
  }	
}

ReactDOM.render(
	<ConditionalStyle />,
  mountNode,
);
```

```

// https://jscomplete.com/playground/s341957

const ClickableImage = ({ href, src }) => {
 return (
   <a href={href}>
     <img src={src} />
     <hr/>
   </a> 
 );
};
const data = [
  { href: "http://google.com", src: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" },
  { href: "http://bing.com", src: "bing.png" },
  { href: "http://yahoo.com", src: "yahoo.png" }
];

const SearchEngines = ({ engines }) => {
  return (
    <ul>
    <li>
      {engines.map(engine => <ClickableImage {...engine} />)}
    </li>
    </ul>
  );
};

ReactDOM.render(
 <SearchEngines engines={data} />,
 document.getElementById("mountNode")
);

```

### State hooks

```
/*
Note also how we used the const keyword to define count although it’s a value that gets changed! Our code will not change that value. React will when it uses a fresh call of the Button function to render the UI of its new state. In that fresh call, the useState function call will give us a new fresh count value.
*/

https://jscomplete.com/playground/s341974
const Button = () => {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
};

ReactDOM.render(<Button />, mountNode);

```


```
https://jscomplete.com/playground/s341994
/*
It’s like when we click that button, the Button component reaches out to the CountManager component and says,
 "Hey Parent, go ahead and invoke that increment counter behavior now".
 In reality, the CountManager component is the one in control here and 
 the Button component is just following generic rules

- concept of responsibility isolation.
- Each component here has certain responsibilities and they get to focus on that.
*/

const Button = ( {clickAction} ) => {
  return (
    <button onClick={ clickAction }>
      +1
    </button>
  );
};

const Display = ({ content }) => (
  <pre>{content}</pre>
);


const CountManager = () => {
  const [count, setCount] = useState(0);
  
  const incrementCounter = () => {
    setCount(count + 1);
  }

  return (
    <>
      <Button clickAction={incrementCounter} />
      <Display content={count} />
    </>
  );
};

ReactDOM.render(<CountManager />, mountNode);
```

```
// https://jscomplete.com/playground/s342004

const Button = ( {clickAction, clickValue} ) => {
  return (
    <button onClick= { () => clickAction(clickValue) }>
      {clickValue}
    </button>
  );
};

const Display = ({ content }) => (
  <pre>{content}</pre>
);


const CountManager = () => {
  const [count, setCount] = useState(0);
  
  const incrementCounter = (incrementValue) => {
    setCount(count + incrementValue);
  }

  return (
    <>
      <Button clickAction={incrementCounter} clickValue={1} />
      <Button clickAction={incrementCounter} clickValue={5} />
      <Button clickAction={incrementCounter} clickValue={10} />
      <Display content={count} />
    </>
  );
};

ReactDOM.render(<CountManager />, mountNode);

```


### TextArea chars counter
```
// https://jscomplete.com/playground/s342020

// React is now aware of the input element state. 
// It controls it. This pattern is known as the controlled component pattern in React.

const CharacterCounter = () => {
  const [inputValue, setInputValue] = useState('');
  
  const handleChange = (event) => {
    const element = event.target;
    setInputValue(element.value);
  };
  
  return (
    <div>
      <textarea cols={80} rows={10} value={inputValue} onChange={handleChange} />
      <div>Count: {inputValue.length}</div>
    </div>
  );
};

ReactDOM.render(<CharacterCounter />, mountNode);
```

```
/*
  Write JavaScript/React code here and press Ctrl+Enter to execute.

  Try: mountNode.innerHTML = 'Hello World!';
   Or: ReactDOM.render(<h2>Hello React!</h2>, mountNode);
*/
function Counter() {
  const [value, setValue] = useState(0);

  return (
    <>
      <div>Counter: {value}</div>
      <button onClick={() => setValue(value + 1)}>Increment</button>
      <button onClick={() => setValue(value - 1)}>Decrement</button>
    </>
  )
}
 ReactDOM.render(<Counter/>, mountNode);
 ```


 #### Server side rendering

 <iframe width="800" height="500" src="https://www.youtube.com/embed/82tZAPMHfT4" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


### References

- [React Commonly Faced Problems](https://jscomplete.com/learn/react-beyond-basics/react-cfp)
- [React & Webpack ](typescriptlang.org/docs/handbook/react-&-webpack.html)


