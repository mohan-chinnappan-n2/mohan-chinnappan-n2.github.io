## Platform Cache

- Platform Cache layer provides faster performance and better reliability when caching Salesforce session and org data.
- Specify:
    - what to cache 
    - for how long without using custom objects and settings 
    - or overloading a Visualforce view state.

- Improves performance by distributing cache space so that some applications or operations don’t steal capacity from others.

 - Because Apex runs in a multi-tenant environment with **cached data living alongside internally cached data**, caching involves minimal disruption to core Salesforce processes.


### Session cache
 - Stores data for individual user sessions. For example, in an app that finds customers within specified territories, the calculations that run while users browse different locations on a map are reused.
 - Session cache lives alongside a user session.
 - the maximum life of a session is 8 hours.     
    - Session cache expires when its specified time-to-live (ttlsecs value) is reached or when the session expires after 8 hours, whichever comes first.

### Org cache
-  Stores data that any user in an org reuses. For example, the contents of navigation bars that dynamically display menu items based on user profile are reused.
- Unlike session cache, org cache is accessible across sessions, requests, and org users and profiles. Org cache expires when its specified time-to-live (ttlsecs value) is reached.

The best data to cache is:
    - Reused throughout a session
    - Static (not rapidly changing)
    - Otherwise expensive to retrieve

- Enterprise, Unlimited, and Performance editions come with some cache, but adding more cache often provides greater performance. 
- [Requesting Trial for Platform Cache](https://help.salesforce.com/articleView?id=data_platform_cache_trial.htm&type=5)


