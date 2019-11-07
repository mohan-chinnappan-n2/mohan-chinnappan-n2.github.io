## LWC Design
### Salesforce platform requirements

- Multi-author, Multi-version
- Backward compatibility 
- Accessible
- Personalization support
- Localization
- Secure
- Performant with support for legacy browsers


### Developers requirements

- More standards based
- Common component model (interoperable)
- Easy to learn and productive
- Standard tool chain
- Not being stuck inside a walled garden (portability)
- Using latest technology



## Web Components 
- Interoperability
- Encapsulation
- Future proof
- Backward compatibility

![lwc-arch-1](img/lwc-arch-1.png)




### Guidelines
- Build on top of web standards
- Leverage native APIs - provide performance
- Make developers productive on day-1 with current skills
- Use static analysis to scale (size and complexity) the system

![lwc-arch-2](img/lwc-arch-2.png)
![lwc-arch-3](img/lwc-arch-3.png)
```
  <script>

  // very primitive, low-level, 
  // lot of boiler-plate code

  // we need a simple and verifiable 
  // want to use this API but like to have abstraction on top of these APIs

  class Hello extends HTMLElement {
    constructor() {
      super();
      // Attach a shadow root to the element.
      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.innerHTML = `<p>hello from web components</p>`;
    }
  }
  customElements.define('hello-wc', Hello);
  </script>
  <hello-wc></hello-wc>

```

#### Refer:
[hello-wc](md/hw.html)


## LWC's additions (Syntactical Sugar on top of Web Components )

- Higher abstraction
- Accessibility
- Performance (polyfills - provide modern functionality on older browsers that do not natively support it)
- Support for legacy browsers


### hw.html (markup - standard based)
- simple bindings

```
<template>
 <lightning-card>

     <lightning-input 
         label="Enter a greeting:" 
         value={greeting} 
         onchange={handleGreetingChange}>
     </lightning-input>
     <hr>

    <h1><b>Greetings</b></h1>

     <p>{greeting}</p>

 </lightning-card>
</template>

```

### hw.js

- Extends LightningElement instead HTMLElement
    - provide Syntactical Sugar on top of Web Components  
```
import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {

    @track greeting = "Hello World from LWC!"

    handleGreetingChange = (event) => {
       this.greeting = event.target.value;
    }

}
```

#### Refer:
- [Hello World in playground](https://developer.salesforce.com/docs/component-library/tools/playground/JVqKgVNok)   


### Challenges faced

![old browsers support](img/lwc-old-browsers.png)

- Polyfills
    - provide modern functionality on older browsers that do not natively support it
    - async/wait
    - spread operators
    - default params for the functions
    - needed robust and performant polyfills


- IE 11 (43% of traffic is coming from this browser)
    - Transpile ES7 features to ES5
    - ![Babel transpile](img/babel-1.gif)

- Proxy support 
    - The Proxy object is used to define custom behavior for fundamental operations (e.g. property lookup, assignment, enumeration, function invocation, etc). [Refer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
    - provides powerful metaprogramming in Javascript.
    - example: get trap that always returns “42”
        - ![proxy1](img/proxy-1.png)
        - [Example](md/proxy.html)
    - shadow DOM
        - provide CSS encapsulation at compile time 
            - global styles do not get leaked into component's shadow DOM
                - component should not able to reference the CSS classes in global 
        - CSS variables needs to polyfilled in IE 11 at compile time
        - Event targeting, focus, tabs support

    



    - simpler reactivity model based on proxies
        - transparent layer allow to observe any changes
    - instead of telling want got changed    (react setState(...))
    - user decorators like @track make a property reactive
    - ![lwc es7](img/lwc-es7.png)
    - ![lwc transpiled](img/lwc-tranpiled-1.png)
    - [At playground](https://developer.salesforce.com/docs/component-library/tools/playground/2na88W211/3/edit)
    - ![Demo](img/lwc-counter-2.gif)

     

- Shadow DOM encapsulation
    - Testing
    - Styling and themes

![shadow dom-1](img/shadow-dom-1.png)
![shadow dom-2](img/shadow-dom-2.png)
![shadow dom-3](img/shadow-dom-3.png)
![shadow dom-4](img/shadow-dom-4.png)

  - Object oriented model for CSS (variables)
  - Customize CSS for shadow DOM
  - ![css oom](img/css-oom-1.png)

  ```
 /* css variable example */
  element {
    --main-bg-color: brown;
  }

  /* using it */
  element {
      background-color: var(--main-bg-color);
  }



```


## UI Scale
- Single page with 100s of components
![lwc components](img/lwc-ui-1.png)
![lwc labels](img/lwc-ui-2.png)
![lwc data](img/lwc-ui-3.png)
![lwc grap](img/lwc-ui-4.png)

- graph can help in progressive loading by using splitting the graph
- just ship enough to boot up the application and present first screen
- meanwhile bring in subsequent pages when the user is consuming the earlier screen info

![lwc progressive loading](img/lwc-pl-1.png)
![lwc progressive loading](img/lwc-pl-2.png)
![lwc progressive loading](img/lwc-pl-3.png)

![lwc scale](img/lwc-scale-1.png)








### LWC local development
- [Announcing LWC Local Development Beta](https://developer.salesforce.com/blogs/2019/10/announcing-lwc-local-development-beta.html?utm_source=twitter&utm_medium=organic&utm_campaign=social&utm_content=lwc_local_dev_blog_post)

### Specs

- [part](https://www.w3.org/TR/css-shadow-parts-1/)
- [state](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/custom-states-and-state-pseudo-class.md)


## Videos

- Webinar Salesforce - Building an Enterprise Class UI Architecture with Web Components
<iframe width="560" height="315" src="https://www.youtube.com/embed/k0WZd0BofMg" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


- JavaScript Proxy
<iframe width="560" height="315" src="https://www.youtube.com/embed/gZ4MCb2nlfQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

-   JavaScript Metaprogramming - ES6 Proxy Use and Abuse | JSConf Budapest 2017
<iframe width="560" height="315" src="https://www.youtube.com/embed/_5X2aB_mNp4" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


<embed src="img/lwc.pdf#toolbar=1&navpanes=1&scrollbar=" type="application/pdf" width="100%" height="600px" />

- [Typescript lwc boiler plate](https://github.com/diervo/lwc-typescript-boilerplate)
- [PWA podcast player written with LWC ](https://github.com/pmdartus/rcast)
- [Wait Wait... Don't Tell Me!](https://rcast-lwc.herokuapp.com/podcasts/121493804)



### Output of Counter app

#### Markup
```

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Counter Application</title>
    <link rel="stylesheet" href="salesforce-lightning-design-system.css">
    
    <script src="engine.js"></script>
</head>
<body>
    <main></main>
    <script>process = {};process.env = {};process.env.NODE_ENV={};process.env.NODE_ENV = 'development';</script>
    <script src="app.js"></script>
</body>
</html>


```

#### App code (app.js)
- [counter app.js](code/mohanc/simple-counter/app.js)
- [Run it](code/mohanc/simple-counter/index.html)












 




