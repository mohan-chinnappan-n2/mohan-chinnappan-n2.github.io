## Salesforce Optimizer Report

- Salesforce generates a PDF report with recommendations to improve your implementation and saves the report to Salesforce Files.
- Salesforce also saves a .xls file in Salesforce Files. The file includes some of the information from the report:
    - Feature section and subsection per the report’s table of contents
    - Type of feature analyzed, along with the number of items found
    - Severity of observation

### Trending and triggers
- Use the .xls file to **load the data into Salesforce to analyze it for trending and historical analysis**. 
- By uploading data into a Salesforce custom object, you can create workflow triggers and alerts when various thresholds are reached.


### How to Run the Salesforce Optimizer Report

- From Setup, enter Optimizer in the Quick Find box, then select Optimizer.
- Click Create PDF | Allow | Got It.

![How to run optimizer](img/opt-1.png)

### References

- [Run the Salesforce Optimizer Report](https://help.salesforce.com/articleView?id=optimizer_kick_off.htm&type=5&sfdcIFrameOrigin=null)
