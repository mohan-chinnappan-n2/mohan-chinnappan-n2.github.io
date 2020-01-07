
## Platform Cache Sizes 

### Recap
- Platform Cache is a memory layer that stores Salesforce **org and session** data for later access
- It can help to run  applications faster because they store reusable data in memory. 
- Applications don’t need to duplicate **calculations and requests** to the database on subsequent transactions.

- Available to customers with Enterprise Edition orgs and above
    - Enterprise Edition (10 MB by default)
    - Unlimited Edition (30 MB by default)
    - Performance Edition (30 MB by default)
    - If you need more trial cache space, contact Salesforce.

- To determine how much extra cache would be beneficial for your applications, you can request trial cache and try it out.

## On Developer Org

- By default it has 0 MB cache capacity. You can request a trial cache of 10 MB.

## Use Cases

- Data reused throughout a session, or reused across all users and requests
- Static Data
    - Tab headers that all users see
    - Currency exchange rate (changes daily)
    - A static navigation bar that appears on every page of your app
    - User’s shopping cart that you want to persist during a session

- Data which is expensive to compute or retrieve
    - Total sales over the past week
    - Top sales ranking

- When you currently store app data by overloading a Visualforce view state
    - **Maximum view state size limit (135KB) exceeded**
    - Candidates for Platform Cache
## Do not use
- Real-time stock quotes
- Data is accessed by asynchronous Apex

## 2 Types

1. Org Cache
    - stores org-wide data that anyone in the org can use
    - accessible across sessions, requests, and org users and profiles
    - Example: daily snapshots of currency exchange rates can be cached for use in an app.

 2. Session Cache
    - stores data for an individual user and is tied to that user’s session. 
    - maximum life of a session is **8 hours**
    - Example:  your app calculates the distance from a user’s location to all customers the user wishes to visit on the same day. The location and the calculated distances can be stored in the session cache. If the user wants to get this information again, the distances don’t need to be recalculated.

## Performance Gain

- Making API Calls to External Services Is Slower (1) Than Getting Data from the Cache (2).

![Perf gain API](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/platform_cache/platform_cache_get_started/images/18d562726fc7bf8c8239350f32b1269c_perf_graph_api_annotated_chipmunk.png)

- Getting Data Through SOQL Queries (1) Is Slower Than Getting Data from the Org and Session Cache (2).

![Perf gain SOQL](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/platform_cache/platform_cache_get_started/images/c6de85b626927761a83d973979904f60_perf_graph_soql_annotated_chipmunk.png)


## Cache Partitions
- let you allocate cache space to **balance usage and performance** across apps.
- ensures that the cache space isn’t overwritten by other apps or by less critical data.
- each partition capacity is broken down between org cache and session cache. 

- The following image shows charts of cache capacity and partition allocation. In this example, we haven’t used the cache yet.  0% cache usage (1) and two partitions have been created with equal allocations 2 MB and 4 MB (2).

## Default Partition

- You can define any partition as the default partition, but you can have only one default partition.
- For default partition, you don’t have to fully qualify the key name with the namespace and partition name when adding a key-value pair.

``` java
// instead of calling 
  Cache.Org.put('namespace.partition.key', 0); 
// you can just call 
  Cache.Org.put('key', 0);

```


![pc-2](img/pc/pc-2.png)

### No allocation - Cache miss
![pc-put-get-0](img/pc/pc-put-get-0.png)

![pc-part](img/pc/pc-part-100.png)
### Allocated - Cache hit
![pc-put-get-1](img/pc/pc-put-get-1.png)

 
### Best Practice

![pc-bp](img/pc/pc-put-get-bp-1.png)

### Session Cache Example
![pc-session-cache](img/pc/pc-get-put-session-1.png)

### Use in Visualforce Pages
![pc-vf](img/pc/pc-vf-1.png)

```java

 
// Best Practice
// Org Cache
Cache.OrgPartition orgPart = Cache.Org.getPartition('local.CurrencyCache');

// Retrieve cache value from the partition. Note the casting
String cachedRate = (String)orgPart.get('DollarToEuroRate');

// Check the cache value that the get() call returned.
if (cachedRate != null) {
    // Display this exchange rate 
    System.debug(Cache.org.get('DollarToEuroRate'));
} 
else {
    // We have a cache miss, so fetch the value from the source.
    // Call an API to get the exchange rate.
    System.debug('Calling API to get the Exchange Rate');

}

// Session Cache
// Get partition
Cache.SessionPartition sessionPart = Cache.Session.getPartition('local.CurrencyCache');
// Add cache value to the partition
sessionPart.put('FavoriteCurrency', 'INR');
// Retrieve cache value from the partition. Note the casting
String cachedFavCurrency = (String)sessionPart.get('FavoriteCurrency');

if (cachedFavCurrency != null) {
    // Display this exchange rate 
    System.debug('FavoriteCurrency: ' + Cache.Session.get('FavoriteCurrency'));

} 
else {
    // We have a cache miss, so fetch the value from the source.
    // Call an API to get the exchange rate.
    System.debug('Calling API to get the Exchange Rate');

}
```


### Sample

```java
public class BusScheduleCache {

  private Cache.OrgPartition part;
  
  BusScheduleCache() {
    part = Cache.Org.getPartition('local.BusSchedule');
  }
  
  public void putSchedule(String busLine, Time[] schedule) {
   part.put( busLine, schedule );
  
  }
  
  public Time[] getSchedule(String busLine) {
      
      Time[] cachedSchedule = (Time[])part.get(busLine);
      // Check the cache value that the get() call returned.
      if (cachedSchedule != null) {
            // Display this cachedschedule
            System.debug(cachedSchedule);
            return cachedSchedule;
      }
      else {

        Time[] schedule = new Time[]{};

        schedule.add(Time.newInstance(8,0,0,0));
        schedule.add(Time.newInstance(17,0,0,0));
        
        return schedule;
      } 
  }


}
```

## Videos and Slides

<div style="margin-top:10px">
<iframe id="vidyard_iframe_obt3ugc4swQmUULAnBG4HA" class="vidyard_iframe" src="//play.vidyard.com/obt3ugc4swQmUULAnBG4HA?v=3.1&amp;type=inline&amp;hide_html5_playlist=1&amp;video_id=&amp;referring_url=https%253A%252F%252Fwww.google.com%252F&amp;" title="Platform Cache" aria-label="Video" scrolling="no" allowtransparency="true" allowfullscreen="" allow="autoplay" 
width="900" height="600" frameborder="0"></iframe>

</div>

<hr/>

<iframe src="//www.slideshare.net/slideshow/embed_code/key/BUM01eDFDqGKQY" width="900" height="600" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC; border-width:1px; margin-bottom:5px; max-width: 100%;" allowfullscreen> </iframe> <div style="margin-bottom:5px"> <strong> <a href="//www.slideshare.net/developerforce/platform-cache" title="Platform Cache" target="_blank">Platform Cache</a> </strong> from <strong><a href="https://www.slideshare.net/developerforce" target="_blank">Salesforce Developers</a></strong> </div>


