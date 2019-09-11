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


#### Trees example

```
q = load "trees";
q = group q by 'type';
q = foreach q generate type, sum(qty) as sum_qty;
```

![group trees by type](img/saql/groups-tree-1.png)
