### Embed Dashboard

#### Demo
![db-embed demo](img/ea-db-embed-filter.gif)

### Filter String using Filter Builder
``` 

{
  "datasets": {
    "fruit_yield_acct": [
      {
        "fields": [
          "act"
        ],
        "filter": {
          "operator": "in",
          "values": [
            "$Name"
          ]
        }
      }
    ]
  }
}
```

### Using wave:waveDashboard

#### Component - FilterTest
```xml
<aura:component implements="force:appHostable,flexipage:availableForAllPageTypes,flexipage:availableForRecordHome,force:hasRecordId,forceCommunity:availableForAllPageTypes,force:lightningQuickAction" access="global" >
	            <wave:waveDashboard dashboardId="0FK3h0000001zObGAI"
                                    filter="{
  'datasets': {
    'fruit_yield_acct': [
      {
        'fields': [
          'act'
        ],
        'filter': {
          'operator': 'in',
          'values': [
            'Abbott358 Inc'
          ]
        }
      }
    ]
  }
}"
                                    
/>
</aura:component>

```

### Using component attributes
#### Component markup
```xml
<aura:component implements="force:appHostable,flexipage:availableForAllPageTypes,flexipage:availableForRecordHome,force:hasRecordId,forceCommunity:availableForAllPageTypes,force:lightningQuickAction" access="global" >
  <aura:handler name="init" value="{!this}" action="{!c.doInit}"/>
  <aura:attribute name="myDashboardId" type="String" default="0FK3h0000001zObGAI"/>
  <aura:attribute name="myFilter" type="String" default="{
  'datasets': {
    'fruit_yield_acct': [
      {
        'fields': [
          'act'
        ],
        'filter': {
          'operator': 'in',
          'values': [
            'Abbott372 Inc'
          ]
        }
      }
    ]
  }
}"/>
    <wave:waveDashboard dashboardId="{!v.myDashboardId}"
                        filter="{!v.myFilter}" />
                                    
</aura:component>
```



#### Controller
```js
({
	doInit : function(cmp, event, helper) {
        const dbId = "0FK3h0000001zObGAI"
        const accountName = 'Abbott358 Inc';
        
        let filter ="{ 'datasets': { 'fruit_yield_acct': [ { 'fields': [ 'act' ], 'filter': { 'operator': 'in', 'values': [ '" + 
            accountName + "' ] } } ] } }";
        cmp.set("v.myFilter",  filter);
        cmp.set("v.myDashboardId", dbId);
		
	}
})

```
### Demo of using this component (FilterTest)

![db-embed demo using component](img/ea-db-embed-filter-cmp.gif)


