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
### Demo of using this component (FilterTest)

![db-embed demo using component](img/ea-db-embed-filter-cmp.gif)


