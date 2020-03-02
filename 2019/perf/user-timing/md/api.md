## User Timing API

- [Web Performance - user timing ](https://www.html5rocks.com/en/tutorials/webperformance/usertiming/)
- [User Timing Marks and Measures](https://developers.google.com/web/tools/lighthouse/audits/user-timing)
- [User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API) 
- [User Timing Level 3](https://www.w3.org/TR/user-timing-3/)
- [How to practically use Performance API to measure performance](https://blog.logrocket.com/how-to-practically-use-performance-api-to-measure-performance/)
- [A Primer for Web Performance Timing APIs](https://w3c.github.io/perf-timing-primer/)
- [Test website performance with Puppeteer](https://michaljanaszek.com/blog/test-website-performance-with-puppeteer)
- [Measure Page Load Times Using the User Timing API](https://techblog.constantcontact.com/software-development/measure-page-load-times-using-the-user-timing-api/)
- [Navigation Timing](https://www.w3.org/TR/navigation-timing/)
- [Boomerang](http://akamai.github.io/boomerang/)
    - [Reading data from a beacon](https://developer.akamai.com/tools/boomerang/docs/tutorial-howto-read-data-from-a-beacon.html)

- [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)
- [w3c Beacon](https://w3c.github.io/beacon/)
- [Beacon browser coverage](https://caniuse.com/#search=beacon)
-  [A closer look at the Beacon API](https://golb.hplar.ch/2018/09/beacon-api.html)
    - [Beacon backend](https://github.com/ralscha/blog/blob/master/beacon/src/main/java/ch/rasc/beacon/ExamplesController.java)

### 
<iframe width="560" height="315" src="https://www.youtube.com/embed/yrWLi524YLM" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

###  Beacon Web API (Explained by Example)
<iframe width="560" height="315" src="https://www.youtube.com/embed/-aGM4mfDX48" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
- [sample code]( https://github.com/hnasr/javascript_playground/tree/master/beaconapi)


- [Breaking Down onLoad](http://kaaes.github.io/timing/)
- [matomo - piwik](https://github.com/matomo-org/matomo)
- [sitespeed.io](https://www.sitespeed.io/)


### Beacons

- Beacons are a way to send asynchronous pings to a server for the purposes such as logging and analytics. 

### Beacon API
- The reason why the Beacon API exists was to solve a specific problem analytics software had in the browser. To collect as much data as possible, analytics libraries tried to send the collected data at the last possible moment to the server.

- This moment is the unload handler. Unfortunately, asynchronous requests that are initiated in the unload handler are canceled by the browser. As a workaround, the libraries sent synchronous XMLHTTPRequest requests, but this had the problem that it delayed the navigation to the next page.

```
  navigator.sendBeacon(url [, data]);

```
- The method sendBeacon() returns true if the browser was successfully able to queue the request. false seems to be returned when browser-specific limits were hit. 
- The browser tries to send the request immediately after internally queueing it.
- The Beacon API only tries to send the request once, and it does not care if the URL is wrong, the server is not responding, sends an error back or if the browser is offline. 
- The Chrome prints an error message into the console and then deletes the request from the queue. 
- There is no retry mechanism built-in, nor does the browser queues these requests while offline and then sends them the next time the device is online.




