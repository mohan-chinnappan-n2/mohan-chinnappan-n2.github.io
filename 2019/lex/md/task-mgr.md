## Chrome Task Manager

- Use Chrome's Task Manager to find out how much resources consumed by the extensions (like WalkMe)

- How to do this:
     - ![Task Mgr](img/task-mgr-1.png) 
     - ![Task Mgr Window](img/task-mgr-2.png)


### Chrome Architecture


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
    - If all tabs are running on one process, when one tab becomes unresponsive, all the tabs are unresponsive T
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

## References 
- [Inside look at modern web browser](https://developers.google.com/web/updates/2018/09/inside-browser-part1)
- [Inside a super fast CSS engine: Quantum CSS (aka Stylo)](https://hacks.mozilla.org/2017/08/inside-a-super-fast-css-engine-quantum-css-aka-stylo/)

