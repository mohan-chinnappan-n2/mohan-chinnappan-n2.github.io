# Salesforce Functions

- Extend Salesforce business logic to any **demand**
- You can write code in **industry-standard** programming lauguages (and frameworks)
	- nodejs
	- java
	- more to come...
	- and run that code in Salesfore **trust boundary**
	- This code can scale automatically with load  - **elastic scaling**
		- does not count against your Salesforce request limits 
	- This code is automatically authenticated to the org invoking this code 

## Uses
- Perform compute-heavy tasks that would be impossible to do in the Salesforce org without hitting the governor limits
- Example: Your Salesforce function may:
	- read  your sales data and calculates a sales tax
	- collects data and generates a formatted PDF report file

## Where it runs? - compute environment (CE)
- In a secure **Salesforce-managed infrastructure** separate from your Salesforce org (core).
	- Shielded from your production org from any impact/interference

## Development
- One or more Functions can be included in a single DX Project 
- You might have a 
	- **Billing** DX Project that contains a “CalculateTax” Function and a **GeneratePDF** Function

## DX project (e.g SalesFunctionPrj) contains
-  Function code 
- Function configuration files
-  Apex code
-  permissions sets
-  anything else necessary for deploying and using the Function. 
- Single Function project runs on a single compute environment (isolated and dedicated)

- Salesforce Org is connected to one or more compute environments
- How your Function Project is linked to your Salesforce org (org1)?
	- you specify where to run (Salesforce org) this Function Project
	- org1.SalesFunctionPrj ==> CE1 

```
├── functions
│ └── calcSalesTax 
│  ├── index.js
│  └── project.toml
│  └── package.json
|  └── README.md
|  └── test
|    └── index.test.js
```

![sf-arch](https://mohan-chinnappan-n2.github.io/2021/sf/img/SF-1.svg)
### Example function in javascript
```js

module.exports = async function execute(event, context, logger) {
  const query = "SELECT Id, Name FROM Account";
  const results = await context.org.dataApi.query(query);
  logger.info(JSON.stringify(results));

  return results;
};

```
## Invoking the the Function from the org
- Specifiy  (prj1.functionName)
	- ProjectName 
	- Function Name
