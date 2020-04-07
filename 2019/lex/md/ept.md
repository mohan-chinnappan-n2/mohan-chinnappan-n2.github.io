## Experienced Page Time (EPT)
- Measures how long it takes for a page to load into a state that a user can meaningfully interact with.
- The EPT is measured as the time from the page start to when no more activity occurs for at least two frames (~33 ms). The two extra frames help to avoid false positives due to asynchronous calls. These calls include any XHR activity, any storage activity, or any user interaction or client-side work of any kind in the main JavaScript thread

- With Winter ‘19, we have exposed Experienced Page Time (EPT) to everyone on the Salesforce Platform. This EPT metric, better understood as Page Load time, can be explored through the Lightning Usage App which highlights the performance at both a browser and page level.

- Add eptVisible parameter as:  https://<example>.lightning.force.com/one/one.app?eptVisible=1

![ept1](img/ept1.png)
![ept0](img/ept0.png)


### What factors affects EPT

- Component implementation details, errors, and caching can all negatively impact EPT. 
- External factors such as the following can impact EPT:
    - network quality 
    - browser performance 
    - user interactions with the page while it’s loading

### Browser Performance Info
![Lex usage app](https://d259t2jj6zp7qm.cloudfront.net/images/c_scale%2Cf_png%2Cw_600-216_lightning_usage_browser_performance_txgatq.png)

### Example
- Selecting the Lightning Usage App
![lua-00](img/lua-00.png)
- Running Lightning Usage App
![lua-01](img/lua-01.png)
![lua-1](img/lua-1.png)
![lua-2](img/lua-2.png)







- This [blog post](https://developer.salesforce.com/blogs/2018/10/understanding-experienced-page-time.html)  helps to understand how we define and calculate EPT.

 



