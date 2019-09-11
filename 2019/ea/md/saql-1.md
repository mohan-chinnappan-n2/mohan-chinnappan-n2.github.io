
## SAQL REST request response

### UI
![UI saql](img/saql/saql-1.png)


### POST demo
![demo saql post](img/saql/ea-saql-1.gif)

### Finding dataset version info REST get
![demo saql dataset version get](img/saql/saql-0.png)



### URI
```
https://mohansun-60-dev-ed.my.salesforce.com/services/data/v46.0/wave/query

```

### Request
``` 

{

"query":"q = load \"0Fb3m0000000PoRCAU/0Fc3m000002cCBHCA2\";
 q = foreach q generate 'name' as 'name', 'qty' as 'qty', 'self_pollination' as 'self_pollination', 'type' as 'type', 'zone_end' as 'zone_end', 'zone_start' as 'zone_start';
 ",

"metadata":{ "queryId":19,
             "uiSessionId":"d98e5080-3d40-451e-b8a7-c303d943730e",
             "uiTabId":"lens-new1"
           }
}

```


### Response

```
{"action":"query","responseId":"4RCSzZxUB1hnzQX2-pj1O-","results":{"metadata":[{"lineage":{"type":"foreach","projections":[{"field":{"id":"q.name","type":"string"},"inputs":[{"id":"q.name"}]},{"field":{"id":"q.qty","type":"numeric"},"inputs":[{"id":"q.qty"}]},{"field":{"id":"q.self_pollination","type":"string"},"inputs":[{"id":"q.self_pollination"}]},{"field":{"id":"q.type","type":"string"},"inputs":[{"id":"q.type"}]},{"field":{"id":"q.zone_end","type":"numeric"},"inputs":[{"id":"q.zone_end"}]},{"field":{"id":"q.zone_start2","type":"numeric"},"inputs":[{"id":"q.zone_start"}]}]}}],"records":[{"name":"Mango Pawpaw","qty":234,"self_pollination":"n","type":"Fruit","zone_end":8,"zone_start2":4},{"name":"Apricot","qty":800,"self_pollination":"y","type":"Fruit","zone_end":8,"zone_start2":4},{"name":"Dwarf Cavendish Banana","qty":100,"self_pollination":"y","type":"Fruit","zone_end":10,"zone_start2":9},{"name":"Cherry","qty":20,"self_pollination":"y","type":"Fruit","zone_end":9,"zone_start2":5},{"name":"Beach Plum","qty":3,"self_pollination":"y","type":"Fruit","zone_end":8,"zone_start2":4},{"name":"Almond","qty":12,"self_pollination":"y","type":"Nut","zone_end":9,"zone_start2":5},{"name":"Chestnut","qty":23,"self_pollination":"n","type":"Nut","zone_end":9,"zone_start2":4},{"name":"Pecan","qty":12,"self_pollination":"n","type":"Nut","zone_end":9,"zone_start2":5},{"name":"Walnut","qty":34,"self_pollination":"n","type":"Nut","zone_end":9,"zone_start2":4},{"name":"Hazelnut","qty":22,"self_pollination":"n","type":"Nut","zone_end":8,"zone_start2":5},{"name":"Blackberry","qty":12,"self_pollination":"y","type":"Berry","zone_end":8,"zone_start2":4},{"name":"Cranberry","qty":34,"self_pollination":"y","type":"Berry","zone_end":7,"zone_start2":2},{"name":"Issai Hardy Kiwi","qty":11,"self_pollination":"y","type":"Berry","zone_end":9,"zone_start2":5}]},"query":"q = load \"0Fb3m0000000PoRCAU/0Fc3m000002cCBHCA2\";\nq = foreach q generate 'name' as 'name', 'qty' as 'qty', 'self_pollination' as 'self_pollination', 'type' as 'type', 'zone_end' as 'zone_end', 'zone_start' as 'zone_start2';\n ","responseTime":5}

```
