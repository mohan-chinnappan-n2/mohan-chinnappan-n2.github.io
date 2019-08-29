## JMeter

![jmeter gui](img/jmeter-1.png)

-  designed to load test functional behavior and measure performance
-  originally designed for testing Web Applications 
-  can be used to test performance both on static and dynamic resource
-  can be used to simulate a heavy load on a 
     - server
     - group of servers
     - network or object to test its strength 
- Current version: 5.1.1

- use GUI mode for  Test creation and Test debugging
- Use CLI for load testing
    -   ```jmeter -n -t [jmx file] -l [results file] -e -o [Path to web report folder]```

- Proxy server sits between the user and web application server
    -  allows JMeter to watch and record user activity when the user is using the web application

### Recording
- setup the http proxy server (Test Script Recorder)
        - for HTTP and HTTPS requests
        - Do not use JMeter as the proxy for any other request types - FTP, etc. - as JMeter cannot handle them.

- record the test activity
- run  the test plan
- save the test plan
- thread group (users)
        - Test Plan > Add > Threads(Users) > Thread Group
- add http request
        - Test Plan >  Thread Group > Sampler > Http Request

![jmeter demo](img/jmeter-1.gif)
