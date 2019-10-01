## Salesforce Optimizer Report

- Salesforce generates a PDF report with recommendations to improve your implementation and saves the report to Salesforce Files.
- Salesforce also saves a .xls file in Salesforce Files. The file includes some of the information from the report:
    - Feature section and subsection per the report’s table of contents
    - Type of feature analyzed, along with the number of items found
    - Severity of observation

### Trending and triggers
- Use the .xls file to **load the data into Salesforce to analyze it for trending and historical analysis**. 
- By uploading data into a Salesforce custom object, you can create workflow triggers and alerts when various thresholds are reached.
![XLS file](img/opt-2.png)
![XLS file view](img/opt-3.png)




### How to Run the Salesforce Optimizer Report

- From Setup, enter Optimizer in the Quick Find box, then select Optimizer.
- Click Create PDF | Allow | Got It.

![How to run optimizer](img/opt-1.png)


### Field Footprint app
- Quickly identify and cleanup underused fields
- Unwind complexity to boost performance and usability of your Salesforce. Use Field Footprint to analyze objects and record types to identify fields that can be reduced or eliminated.
- [Get it from AppExchange](https://appexchange.salesforce.com/listingDetail?listingId=a0N3A00000EShrRUAT)

### References

- [Run the Salesforce Optimizer Report](https://help.salesforce.com/articleView?id=optimizer_kick_off.htm&type=5&sfdcIFrameOrigin=null)
- [Trailhead: Salesforce Optimizer ](https://trailhead.salesforce.com/en/content/learn/modules/salesforce-optimizer)

