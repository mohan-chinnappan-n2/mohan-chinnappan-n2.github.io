## Grain Step

- Use the grain step type for a values table. 
- Values tables have no groupings, just a list of dataset fields to display as columns in the table.
- The query can be in compact form only
    -  can contain the following properties:
        -  filter conditions to apply to the data.
        -  values list of dataset fields to show as table columns
        -  limit


### Example

- If we want to have a filter like this:

```   

 "filters": [
                        [
                            "type", [ "Nut", "Fruit" ], "in"
                        ]
                    ]

```

- Binding should be like this 

```   
 "filters": [
      [

        "type", "{{selection(Typer_1)}}" , "in"

      ]

    ]
```

### Grain step Multi-select Demo

![grain multi-select demo](img/dbrd/ea-grain-values-table-1.gif)


#### Note the following properties are not allowed in grain step:
- broadcastFacet  
- receiveFacet 

### Recommendation is move to Aggregateflex to  make use of binding 2.0

- If we want to have a filter like this:

```   

 "filters": [
                        [
                            "type", [ "Nut", "Fruit" ], "in"
                        ]
                    ]

```

- Binding should be like this 

```   
 "filters": [
      [

        "type",  "{{column(Typer_1.selection,['value']).asObject() }}", "in"

      ]

    ]
```

### Demo  Aggregateflex step values table
![aggregateflex values table](img/dbrd/ea-aggregateflex-values-table-3.gif)


### References

- [Grain Step Type Properties](https://developer.salesforce.com/docs/atlas.en-us.bi_dev_guide_json.meta/bi_dev_guide_json/bi_dbjson_steps_types_grain.htm) 