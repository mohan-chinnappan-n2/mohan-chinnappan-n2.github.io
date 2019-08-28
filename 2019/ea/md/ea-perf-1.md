## Key Ideas
- Every step in the dashboard is ultimately a query that is being fired off to the engine
- Every step in the dashboard have to be executed in batches before the dashboard loads and user can view the results
- All dimensions (anything you can group by) are indexed in Einstein Analytics, which means selections based on dimensions run fast. Measures are not indexed, so if you have range filters based on a measure that can slow down the performance of your dashboard.
- If the dashboard is slow, try to do the calculations in the data layer 
-  Pages  have positive effects on your dashboard performance
 -  When you use pages only the steps that are used on the viewed page are executed

## Dashboard Inspector
![dashboard inspector](img/dbrd/ea-dbd-insp-2.png)
 - Checks the performance of your dashboard as well as the individual steps 

![demo dashboard inspector](img/dbrd/ea-db-per-2.gif)

### Viewing binding trace
![demo dashboard inspector with binding trace](img/dbrd/ea-db-per-3.gif)


