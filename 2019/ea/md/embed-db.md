### Embed Dashboard

#### Demo
![db-embed demo](img/ea-db-embed-filter.gif)

### Filter String using Filter Builder
``` 

{
  "datasets": {
    "fruit_yield_acct": [
      {
        "fields": [
          "act"
        ],
        "filter": {
          "operator": "in",
          "values": [
            "$Name"
          ]
        }
      }
    ]
  }
}
```

