## Platform Events

![PE](https://mohan-chinnappan-n.github.io/sfdc/img/pe/pe-1.png)

- Event bus provides a communication channel
- Allows loose coupling between components
    - you can new publishers and subscribers 
- Durability via sliding window and replay-id
    - component can go down and comes back on, it can resubscribe to any event in the sliding window, so it can never miss an event
- Standards based
    - polyglot (your component can be in any programming language) - all integrated using the event bus
    - communication via open standards 
        - HTTP
        - Subscribe using [Bayeux protocol](https://docs.cometd.org/current/reference/#_concepts_bayeux_protocol) (for transporting asynchronous messages, primarily over HTTP)


### Platform Event Objects

- Write-only Object
- You can publish
- Receive notifications when the events come in
- You cannot query them by SOQL
- You cannot view on the UI

### Publish

- Using
   - Apex
   - REST and SOAP
   - Process Builder

### Consume

- Externally using durable Streaming API
- On Platform using 
    - Apex Triggers
    - Process Builder


### Sliding window

![pe sliding window](img/pe-slidingwindow.png )    

- Publisher adds events into the bus in time order at the tip of the window
- Guaranteed to get the events in the time order 
- Consumers can read from anywhere in the sliding window (durability)
    - remember the last event consumer saw before the crash
    - consumer can restart from the last event

### Types for Event Objects

- Standard Events
    - Event about login failre (SH)
    - Event about a security event
- Change Events
    - Change Data Capture (CDC)
    - Example: Synch data to Heroku Postgres with CDC
    - Keep the data sync across your Enterprise sub-systems
- Custom Platform Events
    - Just like Custom objects
    - ```__e``` suffix in API name  
    - ```ReplayId``` is used for Streaming API
    - You can add custom fields
    - You can attach triggers
    - Use profile and permission sets to control you can publish and subscribe

![pe-1](img/pe-1.png)
![pe-2](img/pe-2.png)
![pe-3](img/pe-3.png)



### Event Publish
- Published from External using API
- Process Builder
- Apex: EventBus.publish(...) - writing into the event bus
    - returns SaveResult
- All or nothing is not supported
- Non transactional
    - even if your Apex transaction got rolled back, event still get published

### Event processing
- Internally
    - Only ```after insert``` trigger is supported
    - in order execution - one batch at a time
    - upto 2000 batches 
    - can run as Automated Process User
- Externally
    - Streaming API
    - Bayeux Protocol using CometD lib
        - channel name: ```/event/event_developer_name/```
        - CometD end point: ``` /cometd/46.0```

### Demo
<iframe width="800" height="500" src="https://www.youtube.com/embed/L6OWyCfQD6U?start=632" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>



