## Lighting Performance Tips

- 1. Optimize images (< 30 kb)
- 2. [Boxcar’ing](https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/controllers_server_background_actions.htm)
    - use a background action if it takes more than five seconds for the response to return from the server. 
        - action.setBackground();
- 3. Set read only actions as cacheable
        - @AuraEnabled(cacheable=true)
- 4. Using the urlEvent for navigation preserves the app state, but if <a> tag is used, the app state is lost,  
    ```
 var urlEvent = $A.get(“e.force:navigateToURL”);
 urlEvent.setParams({
   “url”: ‘/pageName' 
 });
 urlEvent.fire()
```
- 5.  Design attributes, render static data via configuration
        - [Refer](https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/components_config_for_app_builder_design_files.htm)
- 6.  Optimize XHR / Aura actions

