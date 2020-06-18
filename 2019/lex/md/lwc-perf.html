## Lightning Web Components (LWC) Performance Best Practices

- LWCs run on the client-side
    - in a single page, where they are created and destroyed as needed, alongside other components that work on the same data 

- Aura components migrated to LWC showed anywhere between a 20-60% decrease in Experience Page Time (EPT).


### Data retrieval

- Use the Lightning Data Service or cache data when ever possible (see Data caching).
- Before making a call to the server, make sure there’s no other option to obtain the data
- Consider passing data between components using attributes, events, or methods rather than retrieving the same data in different components.
- If multiple components on a given page retrieve the same data, consider creating a service component that has no UI elements and can query data once so that it can pass data on to other components.
- Only SELECT the fields you need
    - Set a LIMIT on the query, don’t return huge numbers of rows at once.
    - Implement pagination when queries may have large results sets.
    - Lazy load occasionally accessed data. Don’t preload data that the user may never need. 
        - Put least accessed components in a secondary tab that the user may not click.
        - Don’t make a call to the server to filter or sort data you already have at the client-side. JavaScript Arrays have built in functions to do things like sort, filter and find values.

- Leverage the Lightning Data Service and UI API to not only retrieve records, but also retrieve list views, metadata and picklist values.

- When using the [getRecord](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/reference_wire_adapters_record) wire service (part of the UI API) in LWC, avoid calling the full layout when you only need a few fields.
```js
@wire(getRecord, { recordId: '$recordId', fields: ‘Contact.Name’ }
```


