## How to limit number of tabs from opening in Console (workspaceAPI)

### Component markup
```xml

<!--
 Implement a background utility item that listens for lightning:tabCreated events when the app loads, 
  and invokes lightning:workspaceAPI methods to prevent more than 12 tabs from opening.
-->

<aura:component implements="lightning:backgroundUtilityItem">
    <aura:handler event="lightning:tabCreated" action="{! c.onTabCreated }" />
    <lightning:workspaceAPI aura:id="workspace" />
</aura:component>



```

### Client side controller code

```js


({
    onTabCreated: function(cmp) {
        var workspace = cmp.find("workspace");
        workspace.getAllTabInfo().then(function (tabInfo) {
            if (tabInfo.length > 12) {
                workspace.closeTab({
                    tabId: tabInfo[0].tabId
                });
            }
        });
    }
})

```

### Links for tab limit example

- [Background Utility Item](https://developer.salesforce.com/docs/component-library/bundle/lightning:backgroundUtilityItem/documentation)
