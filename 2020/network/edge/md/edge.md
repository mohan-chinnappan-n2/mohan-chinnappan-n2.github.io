## What is Salesforce Edge Network?
![about Edge](img/aboutEdge.png)
 - Salesforce Edge Network is a network technology that improves the network experience for customers around the globe. Customers get benefits such as faster download times no matter where their org is hosted in Salesforce’s data centers. 
- How does Salesforce Edge Network work?
    - Salesforce Edge Network directs customer requests to the closest Salesforce location **where Salesforce Edge Network** is deployed. 
    - At that location, Salesforce Edge Network provides a range of services, including:

![edge offers](img/edge-offers.png)
1. **TLS termination** : Edge Brings TLS termination closer to the users. 
            - With Salesforce Edge Network, those secure connections can be terminated closer to where users are, 
                - Cutting down on the time required for connection setup. 

2. **Caching of static content**:  Caching is limited to only the content with HTTP headers marked as cacheable by either the core app or by customer integrations. The static ontent is cached at closer to the user.
            - this is typically publicly available content such as JavaScript and CSS files.  

    - Customized for Dynamic Authenticated content
        - Salesforce content is >70+% dynamic & access usually requires authentication e.g. API responses, database queries etc.
        - Customers heavily customize their experience, so our pages see a lot of variety


3. **Intelligent routing** of user requests to the closest data center—Salesforce automatically sends the users to the most **optimal point of presence** based on its network data. Different at different time of the data, WiFi/cellular...
            - Edge will the fastest route for you at that moment in time

4. **TCP optimizations**:  help data move more quickly and efficiently across the network.
            - Congestion control - for example, slow and steady with less pocket drops,less retry, less reconnects...


### Providing these four services **closer to the customer** *reduces* the round-trip time for **certain requests**. 
- Salesforce Edge Network **delivers data quickly** using the Salesforce trusted infrastructure, which protects, uses, and processes data appropriately and in accordance with the law.
