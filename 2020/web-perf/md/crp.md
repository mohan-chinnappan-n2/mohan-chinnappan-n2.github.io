## Critical Rendering Path (CRP)

- Sequence of steps the browser goes through to convert the HTML, CSS, and JavaScript into pixels on the screen.
- Optimizing the critical render path improves render performance.
- Understanding and optimizing the CRP is important to ensure reflows and repaints can happen at 60 frames per second, to ensure performant user interactions and avoid jank.


<img src='img/crp-1.png' width="200"/>
- Sequences involves
    - DOM
        - Created as HTML is parsed
            - HTML may request Javascript, which may in turn alter DOM
            - The HTML includes or makes requests for styles, which in turn builds the CSS object model. 
    - CSS object model (CSSOM)
        - The browser engine combines DOM and CSSOM to create the Render Tree. 
    - Render Tree
    - Layout 
        - determines the size and location of everything on the page  
        - Once layout is determined, pixels are painted to the screen.
    - Paint
- HTML Request to Server
- Server returns
    - response headers
    - data
- Browser 
    - parses HTML to DOM tree
    - initiates requests every time it finds links to external resources:
        - stylesheets
        - scripts
        - embedded image references 
        - Some requests may be blocking
            -  parsing of the rest of the HTML is halted until the **imported asset** is handled. 
        - continues to parse the HTML making requests and building the DOM, until it gets to the end
    - constructs the CSS object model (CSSOM)
    - When DOM and CSSOM complete, the browser builds the render tree, computing the styles for all the visible content
    - After the render tree is complete
        - layout occurs, defining the location and size of all the render tree elements. 
        - page is rendered, or 'painted' on the screen.

####  Optimizing 
- Improve page load speed by **prioritizing which resources get loaded**, 
- controlling the order in which they are loaded, 
- reducing the file sizes of those resources.

#### Tips
1. minimizing the number of critical resources by deferring their download, marking them as async, or eliminating them altogether, 
2. optimizing the number of requests required along with the file size of each request, 
3. optimizing the order in which critical resources are loaded by prioritizing the downloading critical assets, shorten the critical path length.

### Docs
- [Testing Mobile: Emulators, Simulators And Remote Debugging](https://www.smashingmagazine.com/2014/09/testing-mobile-emulators-simulators-remote-debugging/)
- [MDN: Critical rendering path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
