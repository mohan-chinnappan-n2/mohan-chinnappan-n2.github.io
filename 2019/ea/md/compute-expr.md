## Compute Expression example

### Data file (fruit-yield.csv)
```
fruit,date,qty
apple,01/01/2020,30
mango,01/05/2020,78
jackfruit,02/20/2020,70
peach,03/11/2020,2222
apple,01/07/2019,130
mango,01/09/2019,278
jackfruit,02/11/2019,270
peach,03/09/2019,266
```

### Data flow

![df-ce](img/df-ce-1.png)

- Compute Expression
![df-cexpr](img/df-ce-2.png)

- Dataflow JSON
```
{
  "getFruitYied": {
    "action": "edgemart",
    "parameters": {
      "alias": "fruit_yield2"
    }
  },
  "num_yieds": {
    "action": "computeExpression",
    "parameters": {
      "mergeWithSource": true,
      "source": "getFruitYied",
      "computedFields": [
        {
          "type": "Numeric",
          "saqlExpression": "1",
          "name": "num_yields",
          "label": "num_yields"
        }
      ]
    }
  },
  "regFruitYield": {
    "action": "sfdcRegister",
    "parameters": {
      "source": "num_yieds",
      "alias": "regFruitYield",
      "name": "regFruitYield"
    }
  }
}
```
###  Lens

![ce-soql](img/ce-soql-1.png)

```
q = load "regFruitYield";
s = group q by  (fruit);
s = foreach s generate fruit,  toDate(max(date_sec_epoch)) as m_date, 
                      sum('num_yields') as 'num_yields_total', 
                      sum('qty') as 'qty_total';
``` 

### Dashboard

![ce db](img/ce-db-1.png)
