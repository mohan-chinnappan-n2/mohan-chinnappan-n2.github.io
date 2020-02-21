## Chrome Architecture
- Based on [Mariko's](https://twitter.com/kosamari) content 


- Process and What it controls
    - **Browser** 	Controls "chrome" part of the application including *address bar, bookmarks, back and forward buttons*.
        - Handles the invisible, privileged parts of a web browser such as network requests and file access.

    - **Renderer** 	Controls anything inside of the tab where a website is displayed.

    - **Plugin** 	Controls any plugins used by the website, for example, flash.

    - **GPU** 	Handles GPU tasks in isolation from other processes. It is separated into different process because GPUs handles requests from multiple apps and draw them in the same surface. 

![browser processes](https://developers.google.com/web/updates/images/inside-browser/part1/browserui.png)


#### Multi-process architecture


![chrome-multi-process arch](https://developers.google.com/web/updates/images/inside-browser/part1/tabs.svg)

- Uses **multiple renderer** process

- **Advantages**
    - Each tab has its own renderer process
    - If one tab becomes unresponsive, then you can close the unresponsive tab and move on while keeping other tabs alive
    - If all tabs are running on one process, when one tab becomes unresponsive, all the tabs are unresponsive 
    - Separating the browser's work into multiple processes is security and sandboxing
        -  Operating systems provide a way to restrict processes’ privileges, the browser can sandbox certain processes from certain features

- **High memory needs**
    - Processes have their own private memory space, they often contain copies of common infrastructure (like V8 JavaScript engine)
    - This means more memory usage as they can't be shared the way they would be if they were threads inside the same process.
    - In order to save memory, Chrome puts a limit on how many processes it can spin up. 
    - The limit varies depending on how much memory and CPU power your device has, but when Chrome hits the limit, it starts to run *multiple tabs from the same site in one process.*

- **Browser Process optimizations - Servicification** 
    - Run each part of the browser program as a service allowing to easily split into different processes or aggregate into one. 
    - When Chrome is running on powerful hardware
        - it may split each service into different processes giving more stability 
    - When Chrome is running on low power hardware (like iPhone, Android)
        - it consolidates services into one process saving memory footprint. 

    ![browser process](https://developers.google.com/web/updates/images/inside-browser/part1/servicfication.svg)


- **Site Isolation (since Chrome 67)**
    - Runs a separate renderer process for each cross-site iframe
    - With one renderer process per tab model which allowed cross-site iframes to run in a single renderer process with sharing memory space between different sites. 
        - Running a.com and b.com in the same renderer process might seem okay. The Same Origin Policy makes sure one site cannot access data from other sites without consent.
        - We need to separate sites using processes 
        - With site Isolation, each cross-site iframe in a tab gets a separate renderer process. 
    -![Site Isolation](https://developers.google.com/web/updates/images/inside-browser/part1/isolation.png)



### Simple use case of web browsing

![browser process](https://developers.google.com/web/updates/images/inside-browser/part2/browserprocesses.png)
- Everything outside of a tab is handled by the browser process
- Browser process has threads like:
    -  UI thread which draws buttons and input fields of the browser
        - When you type a URL into the address bar, your input is handled by browser process’s UI thread
    -  Network thread which deals with network stack to receive data from the internet
    -  Storage thread that controls access to the files and more 


#### Step 1. - **Handling input**
-  When a user starts to type into the address bar, the first thing UI thread asks is 
    - "Is this a search query or URL?". 
    - In Chrome, the address bar is also a search input field, so the **UI thread** needs to parse and decide whether to send you to a search engine, or to the site you requested. 

#### Step 2. -  **Start Navigation**
- When a user hits enter, the UI thread initiates a network call to get site content. Loading spinner is displayed on the corner of a tab, and the **network thread** goes through appropriate protocols like DNS lookup and establishing TLS Connection for the request.
- Network thread may receive a server redirect header like HTTP 301. In that case, the network thread communicates with UI thread that the server is requesting redirect. Then, another URL request will be initiated. 

#### Step 3. - **Read Response**
![response body](https://developers.google.com/web/updates/images/inside-browser/part2/response.png)

- Once the response body (payload) starts to come in, the network thread looks at the first few bytes of the stream if necessary. 
- The response's **Content-Type** header should say what type of data it is, but since it may be missing or wrong, **MIME Type sniffing** is done here. 
- Code for [MIME Type sniffing](https://cs.chromium.org/chromium/src/net/base/mime_sniffer.cc?sq=package:chromium&dr=CS&l=5)
- If the response is an HTML file, then the next step would be to pass the data to the **renderer process**
    -  If it is a zip file or some other file then that means it is a download request so they need to pass the data to download manager.
 - If the domain and the response data seems to match a known malicious site, then the network thread alerts to display a warning page.
 - Cross Origin Read Blocking (CORB) check happens in order to make sure sensitive cross-site data does not make it to the renderer process.

#### Step 4. -  **Find a renderer process**

- ![Renderer](https://developers.google.com/web/updates/images/inside-browser/part2/findrenderer.png)

- Network thread tells UI thread that the data is ready. UI thread then finds a renderer process to carry on rendering of the web page. 
- When the UI thread is sending a URL request to the network thread at step 2, it already knows which site they are navigating to.
- The UI thread tries to proactively find or start a renderer process in parallel to the network request.
- This way, if all goes as expected, a renderer process is already in standby position when the network thread received data
    - This standby process might not get used if the navigation redirects cross-site, in which case a different process might be needed.

#### Step 5. -  **Commit Navigation**

- Now that the data and the renderer process is ready, an IPC (Inter-Process-Communication) is sent from the browser process to the renderer process to commit the navigation.

![IPC](https://developers.google.com/web/updates/images/inside-browser/part2/commit.png) 

- Browser process passes on the data stream so the renderer process can keep receiving HTML data. 
- Once the browser process hears confirmation that the commit has happened in the renderer process, the navigation is complete and the document loading phase begins.
- Address bar is updated and the security indicator and site settings UI reflects the site information of the new page. 
- Session history for the tab will be updated so back/forward buttons will step through the site that was just navigated to.
- To facilitate tab/session restore when you close a tab or window, the session history is stored on disk

- Once the navigation is committed, the renderer process carries on loading resources and renders the page. 
- Once the renderer process "finishes" rendering, it sends an IPC back to the browser process (this is after all the onload events have fired on all frames in the page and have finished executing). 
- At this point, the UI thread stops the loading spinner on the tab. 


![IPC2](https://developers.google.com/web/updates/images/inside-browser/part2/loaded.png) 

- Client side JavaScript could still load additional resources and render new views after this point.

#### Step 6. - Navigating to different site
- Before allowing the user to navigate to the different site
    - it needs to check with the currently rendered site if they care about <code>beforeunload</code> event. 
- If that site cares about <code>beforeunload</code> can create **Leave this site?** alert when you try to navigate away or close the tab.
- Everything inside of a tab including your JavaScript code is handled by the renderer process
    - Browser process has to check with current renderer process when new navigation request comes in.
![beforeunload](https://developers.google.com/web/updates/images/inside-browser/part2/beforeunload.png)

- When the new navigation is made to a different site than currently rendered one, a separate render process is called in to handle the new navigation while current render process is kept around to handle events like unload

#### Page Life cycle
![States](https://developers.google.com/web/updates/images/2018/07/page-lifecycle-api-state-event-flow.png)


#### How about Service Worker
- Service Worker a way to write network proxy in your application code
- JavaScript code that runs in a renderer process
- Allowing you to control how network requests from your page are handled.
- Allowing web developers to have more control over what to cache locally and when to get new data from the network. 
- If service worker is set to load the page from the cache, there is no need to request the data from the network.
- Service Worker is a script that your browser runs in the background, separate from a web page, opening the door to features that don't need a web page or user interaction 
- Example features :  push notifications and background sync, periodic sync or geofencing...
- It can't access the DOM directly. 
- It can communicate with the pages it controls by responding to messages sent via the postMessage interface, and those pages can manipulate the DOM if needed.
- Make extensive use of promises

- When a service worker is registered, the scope of the service worker is kept as a reference 
- When a navigation happens, network thread checks the domain against registered service worker scopes, if a service worker is registered for that URL, the UI thread finds a renderer process in order to execute the service worker code. 
- Service worker may load data from cache, eliminating the need to request data from the network, or it may request new resources from the network. 

- ![Service Worker](https://developers.google.com/web/updates/images/inside-browser/part2/scope_lookup.png)
- ![Service Worker2](https://developers.google.com/web/updates/images/inside-browser/part2/serviceworker.png)


### Inner workings of Renderer Process
- Handling web contents and  responsible for everything that happens inside of a tab
- Main thread handles most of the code you send to the user
- Parts of your JavaScript is handled by worker threads if you use a web worker or a service worker. 
- Compositor and raster threads are also run inside of a renderer processes to render a page efficiently and smoothly.

![Renderer process](https://developers.google.com/web/updates/images/inside-browser/part3/renderer.png)

#### Construction of a DOM

- When the renderer process receives a commit message for a navigation and starts to receive HTML data, the main thread begins to parse the text string (HTML) and turn it into a Document Object Model (DOM).
- The DOM is a browser's internal representation of the page as well as the data structure and API that web developer can interact with via JavaScript

#### Subresource loading

- Website usually uses external resources like images, CSS, and JavaScript. Those files need to be loaded from network or cache.
- The main thread could request them one by one as they find them while parsing to build a DOM, but in order to speed up, "preload scanner" is run concurrently.
- If there are things like <img> or <link> in the HTML document, preload scanner peeks at tokens generated by HTML parser and sends requests to the network thread in the browser process.
- ![preload](https://developers.google.com/web/updates/images/inside-browser/part3/dom.png)

#### Javascript can block the parsing   

- When the HTML parser finds a **script** tag, it pauses the parsing of the HTML document and has to load, parse, and execute the JavaScript code. 
- JavaScript can change the shape of the document using things like document.write() which changes the entire DOM structure 

![parsing](https://html.spec.whatwg.org/images/parsing-model-overview.svg)  
- HTML parser has to wait for JavaScript to run before it can resume parsing of the HTML document. If
- If your JavaScript does not use document.write(), you can add async or defer attribute to the script tag.
    - The browser then loads and runs the JavaScript code asynchronously and does not block the parsing. 
```
<link rel="preload">
```
 is a way to inform browser that the resource is definitely needed for current navigation and you would like to download as soon as possible

#### Style Calculations

- Having a DOM is not enough to know what the page would look like because we can style page elements in CSS. 
- The main thread parses CSS and determines the computed style for each DOM node. 
- This is information about what kind of style is applied to each element based on CSS selectors. You can see this information in the computed section of DevTools

![Style calc](https://developers.google.com/web/updates/images/inside-browser/part3/computedstyle.png)
- Even if you do not provide any CSS, each DOM node has a computed style. h1 tag is displayed bigger than h2 tag and margins are defined for each element. 
- This is because the browser has a [default style sheet](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/resources/html.css)

#### Layout and Layout Tree
![Layout tree](https://developers.google.com/web/updates/images/inside-browser/part3/layout.png)

 - Now the renderer process knows the structure of a document and styles for each nodes
-  It has to find the geometry of elements to be rendered
- The main thread walks through the DOM and computed styles and creates the layout tree which has information like x y coordinates and bounding box sizes. 
- Layout tree may be similar structure to the DOM tree, but it only contains information related to what's visible on the page.
    - if  <code>display: none</code> is applied, that element is not part of the layout tree  
    - An element with <code>visibility: hidden</code> is in the layout tree
    - A pseudo class with content like <code>p::before{content:"Hi!"}</code> is applied, it is included in the layout tree even though that is not in the DOM.
- Determining the Layout of a page is a challenging task. Even the simplest page layout like a block flow from top to bottom has to consider how big the font is and where to line break them because those affect the size and shape of a paragraph; which then affects where the following paragraph needs to be.

<a href="https://developers.google.com//web/updates/images/inside-browser/part3/layout.mp4">
    <video src="https://developers.google.com//web/updates/images/inside-browser/part3/layout.mp4" autoplay="" loop="" muted="" playsinline="" controls="" alt="line break layout">
    </video>
</a>


#### Paint!

- Now we have 
    -  DOM tree
    -  style
    - layout tree 

- This is still not enough to render a page
- We need  what order you paint them
- z-index might be set for certain elements, in that case painting in order of elements written in the HTML will result in incorrect rendering.
![paint](https://developers.google.com/web/updates/images/inside-browser/part3/zindex.png)

- Now the main thread walks the layout tree to create paint records
- Paint record is a note of painting process like "background first, then text, then rectangle" similar to drawing on <code>canvas</code>
![painter](https://developers.google.com/web/updates/images/inside-browser/part3/paint.png)


- If something changes in the layout tree, then the Paint order needs to be regenerated for affected parts of the document.
<a href="https://developers.google.com/web/updates/images/inside-browser/part3/trees.mp4">
    <video src="https://developers.google.com/web/updates/images/inside-browser/part3/trees.mp4" autoplay="" loop="" muted="" playsinline="" controls="" alt="line break layout">
    </video>
</a>

- **What about the animations?** 
- If you are animating elements, the browser has to run these operations in between every frame
- Most of our displays refresh the screen 60 times a second (60 fps)
- Animation will appear smooth to human eyes when you are moving things across the screen at every frame. However, if the animation misses the frames in between, then the page will appear "janky".

![page jank](https://developers.google.com/web/updates/images/inside-browser/part3/pagejank1.png)

- Even if your rendering operations are keeping up with screen refresh, these calculations are running on the main thread, which means it could be blocked when your application is running JavaScript
![page jank2](https://developers.google.com/web/updates/images/inside-browser/part3/pagejank2.png)
- Solution: You can divide JavaScript operation into small chunks and schedule to run at every frame using requestAnimationFrame()
![page jank2](https://developers.google.com/web/updates/images/inside-browser/part3/raf.png)


#### Compositing
- Now the browser knows
    - the structure of the document
    - the style of each element
    - the geometry of the page
    - the paint order

- Next steps is is draw the page
- Turning this information into pixels on the screen is called rasterizing.
- Naive way to handle (Chrome used this in early release)
    - raster parts inside of the viewport
    - if the user scrolls the page, then move the rastered frame, and fill in the missing parts by rastering more.  

<a href="https://developers.google.com/web/updates/images/inside-browser/part3/naive_rastering.mp4">
    <video src="https://developers.google.com/web/updates/images/inside-browser/part3/naive_rastering.mp4" autoplay="" loop="" muted="" playsinline="" controls="" alt="line break layout">
    </video>
</a>

- Now about compositing
- Technique to separate parts of a page into layers, rasterize them separately, and composite as a page in a separate thread called compositor thread
- If scroll happens, since layers are already rasterized, all it has to do is to composite a new frame.
- Animation can be achieved in the same way by moving layers and composite a new frame.

 <a href="https://developers.google.com/web/updates/images/inside-browser/part3/composit.mp4">
    <video src="https://developers.google.com/web/updates/images/inside-browser/part3/composit.mp4" autoplay="" loop="" muted="" playsinline="" controls="" alt="line break layout">
    </video>
</a>

#### Dividing into the layers (layer tree)

- In order to find out which elements need to be in which layers, the main thread walks through the layout tree to create the layer tree (this part is called "Update Layer Tree" in the DevTools performance panel). 
- If certain parts of a page that should be separate layer (like slide-in side menu) is not getting one, then you can hint to the browser by using will-change attribute in CSS

![layers-devtools](img/layers-dev-tools.png )
![Layer tree](https://developers.google.com/web/updates/images/inside-browser/part3/layer.png)

#### Raster and composite off of the main thread
- Once the layer tree is created and paint orders are determined, the main thread commits that information to the compositor thread. 
- The compositor thread then rasterizes each layer
- A layer could be large like the entire length of a page, so the compositor thread divides them into tiles and sends each tile off to raster threads.
- Raster threads rasterize each tile and store them in GPU memory.

![rasterize](https://developers.google.com/web/updates/images/inside-browser/part3/raster.png)

- The compositor thread can prioritize different raster threads so that things within the viewport (or nearby) can be rastered first.
- A layer also has multiple tilings for different resolutions to handle things like zoom-in action.
- Once tiles are rastered, compositor thread gathers tile information called draw quads to create a compositor frame.
- What is draw quads?
    - Contains information such as the tile's location in memory and where in the page to draw the tile taking in consideration of the page compositing. 
- Whata is Compositor frame?
    - A collection of draw quads that represents a frame of a page.

- A compositor frame is then submitted to the browser process via IPC. At this point, another compositor frame could be added from UI thread for the browser UI change or from other renderer processes for extensions. 
- These compositor frames are sent to the GPU to display it on a screen. If a scroll event comes in, compositor thread creates another compositor frame to be sent to the GPU.

![Compositor Thread](https://developers.google.com/web/updates/images/inside-browser/part3/composit.png)

- The benefit of compositing 
    - that it is done without involving the main thread. Compositor thread does not need to wait on style calculation or JavaScript execution.
    - But, if layout or paint needs to be calculated again then the main thread has to be involved.


### Input events from the browser's point of view

- Input means any gesture from the user. Mouse wheel scroll is an input event and touch or mouse over is also an input event.
- When user gesture like touch on a screen occurs
    - The browser process is the one that receives the gesture at first. 
    - However, the browser process is only aware of where that gesture occurred since content inside of a tab is handled by the renderer process. 
    - So the browser process sends the event type (like touchstart) and its coordinates to the renderer process. 
    - Renderer process handles the event appropriately by finding the event target and running event listeners that are attached

![input handling](https://developers.google.com/web/updates/images/inside-browser/part4/input.png)

#### Compositor receives input events
 <a href="https://developers.google.com/web/updates/images/inside-browser/part3/composit.mp4">
    <video src="https://developers.google.com/web/updates/images/inside-browser/part3/composit.mp4" autoplay="" loop="" muted="" playsinline="" controls="" alt="line break layout">
    </video>
</a>

- The compositor thread finds out if the event needs to be handled

## References 
- [Inside look at modern web browser](https://developers.google.com/web/updates/2018/09/inside-browser-part1)
- [(Page Lifecycle API](https://developers.google.com/web/updates/2018/07/page-lifecycle-api#overview_of_page_lifecycle_states_and_events)
- [Service Workers: an Introduction](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Inside a super fast CSS engine: Quantum CSS (aka Stylo)](https://hacks.mozilla.org/2017/08/inside-a-super-fast-css-engine-quantum-css-aka-stylo/)
- [Why Performance Matters](https://developers.google.com/web/fundamentals/performance/why-performance-matters)
- [An introduction to error handling and strange cases in the parser](https://html.spec.whatwg.org/multipage/parsing.html#an-introduction-to-error-handling-and-strange-cases-in-the-parser)
- [Overview of the parsing model](https://html.spec.whatwg.org/multipage/parsing.html#overview-of-the-parsing-model)
- [(Resource Prioritization – Getting the Browser to Help You](https://developers.google.com/web/fundamentals/performance/resource-prioritization)
- [Eliminate content repaints with the new Layers panel in Chrome](https://blog.logrocket.com/eliminate-content-repaints-with-the-new-layers-panel-in-chrome-e2c306d4d752/?gi=cd6271834cea)
## Videos on JS Engines

<iframe width="900" height="400" src="https://www.youtube.com/embed/5nmpokoRaZI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


<iframe width="900" height="400" src="https://www.youtube.com/embed/Y5Xa4H2wtVA" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

