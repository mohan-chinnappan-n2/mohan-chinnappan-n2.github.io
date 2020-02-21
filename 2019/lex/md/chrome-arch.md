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


![States](https://developers.google.com/web/updates/images/2018/07/page-lifecycle-api-state-event-flow.png)
## References 
- [Inside look at modern web browser](https://developers.google.com/web/updates/2018/09/inside-browser-part1)
- [(Page Lifecycle API](https://developers.google.com/web/updates/2018/07/page-lifecycle-api#overview_of_page_lifecycle_states_and_events)
- [Service Workers: an Introduction](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Inside a super fast CSS engine: Quantum CSS (aka Stylo)](https://hacks.mozilla.org/2017/08/inside-a-super-fast-css-engine-quantum-css-aka-stylo/)

