## Component Instantiation

![comp-instant-1](img/comp-inst-1.png)

### Options for Lazy Instantiation 
- Quick / Global Actions
- Utility Bar
- App Builder Tabs


### tabset and tab
```
 <lightning:tabset>
        <lightning:tab label="Key Data"> Account Key Fields here </lightning:tab>
        <lightning:tab label="Financial Accounts" > Financial Accounts Data  </lightning:tab>
        <lightning:tab label="Hobbies"> Hobbies of the client  </lightning:tab>
</lightning:tabset>


```

### aura if tag

```

<!--

Only one branch is created and rendered. 
Switching condition unrenders and destroys the current branch and generates the other 

-->
 <aura:if isTrue="{!v.item == 'fruits'}">
   <c:furitsExplorer /> 
 </aura>


```

### Advanced - createComponent

- Dynamically creating components on demand
- For performance and other reasons, client-side creation of the components is preferred.
- Needs the component definition
```

$A.createComponent(String type, Object attributes, function callback)
type: type of the comp to create (e.g: lightning:button )
attributes: A map of attributes for the component, including the local Id (aura:id)
callback(cmp, status, errorMessage) : The callback to invoke after the component is created


$A.createComponent( "lightning:button", 
            { "aura:id": "btn200", "label": "Login", "onclick": cmp.getReference("c.handleClick") },
            function(newButton, status, errorMessage) {
                //Add the new button to the body array
                if (status === "SUCCESS") {
                    var body = cmp.get("v.body");
                    body.push(newButton);
                    cmp.set("v.body", body);
                }
                else if (status === "INCOMPLETE") {
                    console.log("No response from server or client is offline.")
                    // Show offline error
                }
                else if (status === "ERROR") {
                    console.log("Error: " + errorMessage);
                    // Show error message
                }
            }
 ); 


```

### Lazy load related data

- Do not pre-load the data in advance for the second tab thinking that user may click the second tab!


### Conditional Rendering 

- Show/Hide elements via CSS (slds-hide or null)
```xml

   <aura-attribute name="wizStep" default="1"  type="Integer" />
   <div class="{!v.wizStep == 1 ? null : 'slds-hide' }">
      <p>Introduce yourself to the Client</p>
   </div> 

   <div class="{!v.wizStep == 2 ? null : 'slds-hide' }">
      <p>Get Client Name and Goals</p> 
   </div> 

```

- Eventhough these element are hidden, DOM elements are created, event-handlers are in place


- Create Elements conditionally using <code><aura:if></code>
 ```xml

   <aura-attribute name="wizStep" default="1"  type="Integer" />
 
   <aura:if isTrue="{!v.wizStep == 1 }">
       <p>Introduce yourself to the Client</p>
   </aura:if>

   <aura:if isTrue="{!v.wizStep == 2 }">
       <p>Get Client Name and Goals</p>
   </aura:if>

- Elements in a step are not created. DOM elements are not created, event-handlers are not in place for other steps.



```
![show/hide](img/show-hide-1.png)
    
