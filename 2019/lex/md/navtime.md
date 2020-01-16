## Using Navigation Timing API

``` javascript

// Ref: https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API

// Subtract the time at which navigation began (navigationStart) from the time at which the load event handler returns (loadEventEnd). 
// This gives us the perceived page load time.

let perfData = window.performance.timing; 
let pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
console.log(`Page Load Time: ${pageLoadTime}`);


// Request Response Time
// Time elapsed between the beginning of a request and the completion of getting the response 

let connectTime = perfData.responseEnd - perfData.requestStart;
console.log(`Request Reponse Time: ${connectTime}`);

// Page Render Time
// Amount of time it took to render the page:
let renderTime = perfData.domComplete - perfData.domLoading;
console.log(`Page Render Time: ${renderTime}`);



```

### Example of using Navigation Timing API
![nav timing](img/navperfapi.png)
