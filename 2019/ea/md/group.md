## Group

- Groups the data in a data stream by one or more fields.

```
result = group data_stream_1 by field1, [field2];
```
- Use ```group by all``` when you don’t want to group data.
```
q = load "trees";
q = group q by all;
q = foreach q generate  count() as 'count';
```

![query with query all](img/saql/query-w-group-all.png)

- Same query without ``` group by all```
```
q = load "trees";
q = foreach q generate  count() as 'count';
```

![query with query all](img/saql/query-wo-group-all.png)


#### Trees example for ```sum(qty)```

```
q = load "trees";
q = group q by 'type';
q = foreach q generate type, sum(qty) as sum_qty;
```

![group trees by type](img/saql/groups-tree-1.png)
