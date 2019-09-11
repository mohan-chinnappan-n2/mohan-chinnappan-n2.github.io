## Cogroup

- Combines data from two or more data streams into a single data stream. 
- Data streams must have at least one common field.
- Unlike in relational database join, in a cogroup the datasets are **grouped** first, and then the groups are joined. 
- Ways
    - inner cogroup (default)
        - combines data from two or more data streams into a resulting data stream.
        - resulting data stream only contains values that exist in both data streams. 
        - unmatched records are dropped.
        ```
        result = cogroup data_stream_1 by field1, 
                         data_stream_2 by field2;
        ```


  



    - left outer cogroup (left)
        -  combines data from the right data stream with the left data stream.
        -  resulting data stream only contains values that exist in the left data stream.
        -  if the **left** data stream has a value that the right data stream does not, the missing value is null in the resulting data stream for those columns of the right data stream
    ```
         result = cogroup data_stream_1 by field1 left,
                          data_stream_2 by field2;
    ```

    - right outer cogroup (full)
        - combines data from the left and right data streams.
        -  resulting data stream contains all values.
        -  if the **right** data stream has a value that the left data stream does not, the missing value is null in the resulting data stream.
    ```
         result = cogroup data_stream_1 by field1 right,
                          data_stream_2 by field2;
    ```

    - full outer cogroup
        - combines data from the left and right data streams.
        - resulting data stream contains all values.
        - if one data stream has a value that the other data stream does not, the missing value is null in the resulting data stream.

       ```
         result = cogroup data_stream_1 by field1 full,
                          data_stream_2 by field2;
    ```

### trees

```
trees = load "trees";
q = foreach trees generate name as 'tree_name', sum(qty) as 'sum_qty';
```

![trees](img/saql/cogroup-trees-1.png)

### pruning

```
pruning = load "pruning";
q = foreach pruning generate name as 'tree_name', sum(pruningtime) as 'sum_pruning_time'

```
![pruning](img/saql/cogroup-pruning-1.png)



```
trees = load "trees";
pruning = load "pruning";
q = cogroup trees by 'name', pruning by 'name';
q = foreach q generate trees.'name' as 'name', sum(trees.'qty') as 'sum_qty', sum(pruning.'pruningtime') as 'pruningtimeSpent';

```

![cogrouped-trees-pruning](img/saql/cogrouped-trees-pruning-1.png)


#### Demo
![cogrouped-trees-pruning demo](img/saql/cogrouped-trees-pruning-demo-1.gif)


#### Reference

- [cogroup](https://developer.salesforce.com/docs/atlas.en-us.bi_dev_guide_saql.meta/bi_dev_guide_saql/bi_saql_statement_cogroup.htm?search_text=cogroup)



