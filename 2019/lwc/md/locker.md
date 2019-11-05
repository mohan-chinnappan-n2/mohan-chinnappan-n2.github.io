## Locker service

- Lightning Locker enhances security by restricting components' access to APIs and
Lightning Component framework internals. 

- Browser global objects like window, document are proxied 
- DOM is sandboxed in each component
- You can access only the elements of your components to secure the security model so that you can't get secured data of someone else.

```
<div> 
  <input name='pwd' type='password'>
</div>

<script>
document.querySelector('[type=password')
</script>

```

- This example shows how it blocks the setting of rel="import" on link elements, since the setting can bypass sandboxes.
When you click Evaluate, a table on the right side shows the value of your 
output, based on whether Locker is turned on or off.

```
var link = document.createElement('link');
link.rel = 'import';
var rel = link.rel;
rel;

// another example
var input = document.createElement('input');
input.type = 'password';

input.type;


```

- Demo

![Locker Console](img/lex-locker-1.gif)


<iframe width="800" height="500" src="https://www.youtube.com/embed/X5pT2RPQi3E" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


### Resources
- [Locker Console](https://developer.salesforce.com/docs/component-library/tools/locker-service-console)
- [Salesforce Lightning Locker Service](https://salesforceway.com/podcast/locker-service/)
- [LoveLockerService](https://github.com/mattgoldspink/love-locker-service)
- [Lightning Container Component](https://developer.salesforce.com/docs/component-library/bundle/lightning:container/documentation)


<iframe width="800" height="500" src="https://www.youtube.com/embed/P_tbp4d3Fbc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


