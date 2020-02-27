## Speed in Lightning Experience


Technical Requirements
### Recommended
- For the fastest and most stable experience, we recommend:

    - An Octane score of 30,000
    - Network latency of 150 ms or lower
    - Download speed of 3 Mbps or higher
    - At least 8 GB of RAM, with 3 GB available for Salesforce browser tabs

### Minimum
- Minimum requirements are:

    - An Octane score of 20,000
    - Network latency of 200 ms or lower
    - Download speed of 1 Mbps
    - At least 5 GB of RAM, with 2 GB available for Salesforce browser tabs



- On Desktop MacOS 10.13.6 Chrome 77
![Octane Score](img/octane-score.png)

- On Desktop MacOS 10.13.6 Chrome 80 - Chart
![Octane Graph](img/octane-graph-1.svg)

- On iPhone 8 plus  - Chart
![Octane Chart iPhone](img/iphone-8plus-oscore-1.png)


- On VM Windows 10.0.16299.1451  Chrome 77 
![VM Octane Chrome 57 Score](img/onVMChrome-octane.png)

- On VM Windows 10.0.16299.1451  Edge 16 (which is Chrome 58 based)
![VM Octane Edge 16 Chrome 58 Score](img/onVM-octance-score.png)


### References

- [Speed Test](https://mohansun-60-dev-ed.my.salesforce.com/speedtest.jsp)
- [Improve performance and speed in Lightning Experience](https://help.salesforce.com/articleView?id=000316034&language=en_US&type=1&mode=1) 
- [Lightning Components Performance Best Practices](https://developer.salesforce.com/blogs/developer-relations/2017/04/lightning-components-performance-best-practices.html)
- [Lightning Console Technical Requirements](https://help.salesforce.com/articleView?id=console2_technical_requirements.htm&type=5)

- [Octane FAQ](https://developers.google.com/octane/faq)
- [Troubleshoot Salesforce issues in Google Chrome](https://help.salesforce.com/articleView?id=000312846&language=en_US&type=1&mode=1)


## Octane

 - Octane measures the time a test takes to complete and then assigns a score that is inversely proportional to the run time (historically, Firefox 2 produced a score of 100 on an old benchmark rig the V8 team used).
-  bigger is better.
- Octane is a benchmark developed by Google that measures JavaScript performance. A higher Octane score correlates to faster page load times. Octane factors in your computer hardware and browser choice.

- Using newer-generation hardware with faster CPUs generates higher Octane scores.
- Using the latest version of Salesforce-supported browsers generates higher Octane scores.
- IE11 results in low Octane scores and much slower page load speeds.


- [Run Octane Test](http://chromium.github.io/octane/)
- [Run Octane Test - New UI](https://mohan-chinnappan-n2.github.io/2019/lex/octane/octane2.html)


    - Chrome
    ![Google Chrome Octane Score](img/google-octane-score.png)
    - Firefox
    ![Firefox Octane Score](img/firefox-octane-score.png)
