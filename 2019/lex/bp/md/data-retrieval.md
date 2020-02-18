## Data Retrieval


- Fetch data from the server as a last resort

- Find the ways to share the data between components

- If you have already have data at client side, filter/sort at the client side  using javascript instead of making server calls

- If you need to get the data from the server, limit rows and columns of server call result set

- Explore ways to cache the data you got from the server actions


### Data Caching

![Data Caching Summary](img//data-caching-summary.png)

- If the cached data is stale, the framework retrieves the latest data from the server.

#### Marking a Server Action as Storable

```java

/*

For API version of 44.0 or higher, you can mark the Apex method as storable (cacheable) and 
get rid of any setStorable() calls in JavaScript code.

- The Apex annotation approach is better because it centralizes your caching notation for a method in the Apex class.

*/

@AuraEnabled(cacheable=true)
public static Account getAccount(Id accountId) {
    // your code here to fetch the account for given accountId
}

``` 

![Lifecycle of Storable Actions](https://developer.salesforce.com/docs/resources/img/en-us/224.0?doc_id=dev_guides%2Faura%2Fimages%2Fstorable_action_lifecycle.png&folder=lightning)

- Key point (different from javascript Promise) 
    - If the refreshed response is different from the cached response, the callback in the client-side controller is executed for a second time.


#### Lightning Data Service (LDS)

- You can use LDS to load, create, edit, or delete a record in your component **without requiring Apex code**.
- LDS handles sharing rules and field-level security
- Built on highly efficient local storage that’s shared across all components that use it  
    - Components accessing the same record see significant performance improvements, because a record is loaded only once, no matter how many components are using it. 
    - When one component updates a record, the other components using it are notified, and in most cases, refresh automatically 

![lda-1](img/lds-1.png)

- Display a Record Using lightning:recordForm 
- Use this simpler lightning:recordForm  (instead of force:recordData) component for accessing, modifying, or creating a record if you don't need a custom layout or custom rendering of record data.
```xml

<!-- Event and Task objects are not supported.  -->
<aura:component>
    <lightning:recordForm
        recordId="0016g00000B6BSHAA3"
        objectApiName="Account"
        layoutType="Compact"
        mode="readonly"        
        columns="2"/> />
</aura:component>


```

- Output

```
Account Name
Mrs. Rachel Adams (Sample)
Total Financial Accounts
$1,203,911.21
AUM
$895,000.00
Category
Platinum
Next Interaction
1/26/2021
Last Interaction
3/5/2020

```

### Custom Cache (for very static static)

``` js
// DataCache.js module
window.DataCache = (function () {
   var cache = {};
   return {
      setData : function (name, data) { cache[name] = data ;}
      getData : function (name ) { return cache[name] ;}
   };
}());


```

```

<!-- component -->
<ltng:require scripts="{!$Resource.DataCache}" afterScriptsLoaded = "{!c.afterScriptsLoaded}" />


```



```
// controller
afterScriptsLoded: function (comp, event, helper)  {
      var fruits = window.DataCache.getData("fruits");
      if (fruits) // in the cache, hit {
          comp.set("v.fruits", fruits);
      } else { // cache miss
        helper.loadFruits(comp);

     }

}



```

``` 
// helper
loadFruits: function (comp) {
    var serverAction = component.get("c.getFruits");
    // Create a callback that is executed after
    // the server-side action returns
    action.setCallback(this, function(response) {
       // put the value returned from the server to cache
        window.DataCache.setData("fruit", response.getReturnValue());
    });
    // $A.enqueueAction adds the server-side action to the queue.
    $A.enqueueAction(action)



}

```

![Data Caching Summary](img//data-caching-summary.png)
