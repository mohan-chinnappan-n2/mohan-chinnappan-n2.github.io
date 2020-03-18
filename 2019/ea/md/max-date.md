## How to use MAX(date) in SAQL

```
q = load "DTC_Opportunity_SAMPLE";
q = group q by all;
q = foreach q generate max(Amount) as 'max_amount',
              count() as counts,  
              toDate(max (Close_Date_sec_epoch)) as MaxCloseDate;
q = limit q 2000;


```

![ea max9(date)](img/max-date-1.png)
