## Data Binding

- Bound Expressions
    - 2-way data binding
```
{!account.Name}


<aura:iteration items="{!v.account}" var="account">
  <lightning:input value="{!account.Name}" />
</aura:iteration>

```

- Framework implement 2 event listeners (change handler)  behind the scenes:

```
   // pseudo code
   //  if in the data (account) value changes, input field value has to be changed
   account.addEventListener("change", function (event) { 
         inputElement.value = account.Name;
   } 

   // if the user changes the value in the input element, in the data (account) new value has to updated 
   inputElement.addEventListener("change", function (event) { 
         account.Name = event.target.value;
   } 



```


- Unbound Expressions - one-time data binding
    - value is set only one
    - for read-only attributes
```
{#account.Name}


<aura:iteration items="{!v.account}" var="account">
  <lightning:input value="{#account.Name}" />
</aura:iteration>


```

- <code><aura:method></code> way
- Parent component calling child method in API method
- Use it, if you just like to call the menthod in the child component 
```
<!-- parent -->
<aura:method name="add" action="{!c.add}">
   <aura:attribute name="first" type="Decimal" />
   <aura:attribute name="second" type="Decimal" />
</aura:method>
<!-- child -->
component.find("add").add (10,20);
```

