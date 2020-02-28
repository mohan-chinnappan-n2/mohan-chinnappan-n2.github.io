## Chrome Process Models

- These models affect how the browser allocates pages into renderer processes

![process models](https://developers.google.com/web/updates/images/inside-browser/part1/servicfication.svg)
### 4 Models are supported in Chrome

1. Default - **Process-per-site-instance**
    - Separate OS process for each instance of a web site the user visits
    - Creates a renderer process for each instance of a site the user visits. 
    - This ensures that pages from different sites are rendered independently
    - Separate visits to the same site are also isolated from each other 
    - Failures (e.g., renderer crashes) or heavy resource usage in one instance of a site will not affect the rest of the browser
    - More memory overhead

2. **Process-per-site**
    - One process for all instances of a web site
    - Use  <code>--process-per-site</code> command-line switch when starting the chrome
        - On Mac: <code> /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --process-per-site</code>
        - On Windows: <code> ...\Application\chrome.exe --process-per-site</code>
    - Groups all instances of the same site into the same process. 
    - Creates fewer renderer processes, trading some robustness for lower memory overhead 
    - Fewer concurrent processes than the **process-per-site-instance** and **process-per-tab** models
    - May be a desirable to reduce Chromium's memory footprint.
    - But can result in large renderer processes

3. **Process-per-tab**
    - Simpler model which dedicates one renderer process to each group of script-connected tabs. 
    - Use  <code>--process-per-tab</code> command-line switch when starting the chrome
    - Each tab has one renderer process dedicated to it that does not change over time
    - But may lead to undesirable fate sharing between pages 
        -  User navigates a tab in a browsing instance to a different web site, the new page will share fate with any other pages in the browsing instance

4. **Single process**
    - Use  <code> --single-process</code> command-line switch when starting the chrome
    - Browser and rendering engine are run within a single OS process
    - Not a safe or robust architecture 
    - Any renderer crash will cause the loss of the entire browser process
        - For testing and development purposes ONLY


### How to view the processes 

- Get the  process id (PID) of the tab your are interested in from the Chrome's Task Panel (Window > Task Manager) 

![pid](img/chrome-pid-1.png) 

```
## on macOS

$ ps agx | grep 48375
48375   ??  S    
   0:05.48
 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/80.0.3987.122/Helpers/Google Chrome Helper (Renderer).app/Contents/MacOS/Google Chrome Helper (Renderer)
   --type=renderer 
   --field-trial-handle=1718379636,1337639627041392949,8385461946629423011,131072 
   --lang=en-US 
   --enable-auto-reload 
   --num-raster-threads=4 
   --enable-zero-copy 
   --enable-gpu-memory-buffer-compositor-resources 
   --enable-main-frame-before-activation 
   --renderer-client-id=419 
   --no-v8-untrusted-code-mitigations 
   --shared-files 
   --seatbelt-client=58
```

## Process Models References
- [Process Models](https://www.chromium.org/developers/design-documents/process-models)
- [Isolating Web Programs in Modern Browser Architectures](https://4310b1a9-a-c71d7a1b-s-sites.googlegroups.com/a/charlesreis.com/home/research/publications/eurosys-2009.pdf?attachauth=ANoY7crBEc7DfAxLpuGxLGNZGUXU-8-ctteQwZNSdK2MDNhDwcAkTK0anQSB_D0MY10akchV01sh5AGiLVb0iZ54KrisaaX30u6cGUHeIVi89303VkM3jOKEGIRwyHxM7zCGtEi3p6S9r9qLm_2pYXI83foUTTzhA7TYJP_QFIoM7pGmbUAw2DN7-F4m23pQAQd25UHEiPrMgq04qx-YHrx4PB6cYEnzYDRE3Xds7cwtQLPzubSNO30%3D&attredirects=0) 
- [The Security Architecture of the Chromium Browser](http://seclab.stanford.edu/websec/chromium/chromium-security-architecture.pdf)
