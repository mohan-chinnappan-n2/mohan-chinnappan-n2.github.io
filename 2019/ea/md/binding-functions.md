## Binding Functions

### asEquality

```

q = filter q by 'Id' not in {{column(step2.result, [\"Id\"]).asString()}};

-- this will result in

q = filter q by 'Id' NOT IN ['id1', 'id2', 'id3'];

``` 

### Reference
- [asEquality() Function ](https://developer.salesforce.com/docs/atlas.en-us.bi_dev_guide_bindings.meta/bi_dev_guide_bindings/bi_dashboard_bindings_functions_wave_designer_asEquality.htm)
