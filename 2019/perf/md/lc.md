## Lightning Caching Data with Storable Actions

- Caching data at the client side can significantly reduce the number of **server round-trips** and improve the performance of your Lightning components
-  You can access server data via
    -  Server Actions ( Apex method that you invoke remotely from your Lightning Component)
        - support optional client-side caching
    -  Lightning Data Service (LDS)
        - built on top of a sophisticated client caching mechanism
- Caching is a trade-off between performance and data freshness


### Storable Action 
- is a server action whose response is stored in the **client cache** so that subsequent requests for the same server method with the same set of arguments can be accessed from that cache.

 ```js

var action = component.get("c.getItems");
action.setStorable(); // action is marked as storable

/*
 - Lightning framework automatically returns the response from the client cache (if available) 
 - The framework might then call the server method in the background, 
    -  if the response is different, invoke the action callback function a second time.
    - 


*/
action.setCallback(this, function(response) {
	// handle response
};
$A.enqueueAction(action);

```

- Expiration age (900s)
    - maximum age of the cached response
        - The cached response is discarded if it is older than the expiration age (900 seconds).
- Refresh age (30s)
    - maximum age for the cached response to be considered **fresh**
    - If the cached response is older than the refresh age (and younger than the expiration age), it is provided to the client, but the framework also invokes the server method in the background to refresh the cache.
        -  If the new response is different from the cached response, the action callback function is called a second time. 
        - trust and verify model


- Not availiable in Cache
    - ![not avl in cache](https://d259t2jj6zp7qm.cloudfront.net/images/v1490839089-storable-1_ejutvh.png)

- No refresh needed (cached response age <= refresh age)
    - ![no refresh needed](https://d259t2jj6zp7qm.cloudfront.net/images/v1490839089-storable-2_jspynq.png)

- Refresh needed (cached response age > refresh age)
    - ![refresh needed](https://d259t2jj6zp7qm.cloudfront.net/images/v1490839089-storable-3_jeeof9.png)


## Guide
    -  mark as storable for any action that is idempotent (produces the same result when called multiple times) and non-mutating (doesn’t modify data).
    
