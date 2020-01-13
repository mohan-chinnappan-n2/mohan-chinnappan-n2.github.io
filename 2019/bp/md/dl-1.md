

## Data load best practices
1.    Identify which data you will migrate.

    You may not want or need to migrate a whole set of data—choose which objects you wish to migrate. For example, you may want to migrate only the contact information from each account, or only migrate account information from a particular division.
    Create templates for the data.

 2.   Create one template for each object, for example in an Excel worksheet.

    Identify the required fields for each object. In addition to the required fields for each standard object, there may be additional required fields such as those needed to follow business rules, or legacy ID fields. Use this guide or see the page layout definitions in the Salesforce user interface to find out which fields are required on standard objects.

    You may wish to highlight the required fields in red for easier review of the data after you populate the templates.

    You should also identify any ordering dependencies. Objects may have mandatory relationships, for example all accounts have an owner, and all opportunities are associated with an account. The dependencies in these relationships dictate the order of data migration. For Salesforce data, for example, you should load users first, then accounts, then opportunities.

    To identify dependencies, review the related lists and lookup fields in the page layout of the given object, and IDs (foreign keys) in the database.

 5.    Populate the templates.


    Clean your data before populating the template, and review the data in the templates.

 4.  Migrate the data.

    Create custom fields to store legacy ID information. Optionally, give the custom field the External ID attribute so it will be indexed. This will help maintain relationships, and help you build custom reports for validation.

    Load one record, check the results, then load all records.

5.  Validate the data.

    Use all of these techniques to validate your migration:
        - Create custom reports that validate record counts and provide an overall snapshot of migration.
        - Spot check the data.
        - Review exception reports to see what data was not migrated.

6.   Re-migrate or update data as needed.


## Loading Lean

- Include only the data and configuration you need to meet your business-critical operations.
    - Identifying the business-critical operations before moving users to Salesforce.
    - Identifying the minimal data set and configuration required to implement those operations.
    - Defining a data and configuration strategy based on the requirements you’ve identified.
    - Loading the data as quickly as possible to reduce the scope of synchronization.

- Organization-wide sharing defaults. 
    - When you load data with a Private sharing model, the system calculates sharing as the records are being added. If you load with a Public Read/Write sharing model, you can defer this processing until after cutover.
 - Complex object relationships. 
    - The more lookups you have defined on an object, the more checks the system has to perform during data loading. But if you’re able to establish some of these relationships in a later phase, that makes loading go faster. 
- Sharing rules. 
    - If you have ownership-based sharing rules configured before loading data, each record you insert requires sharing calculations if the owner of the record belongs to a role or group that defines the data to be shared. If you have criteria-based sharing rules configured before loading data, each record with fields that match the rule selection criteria also requires sharing calculations.
- Workflow rules, validation rules, and triggers. 
    -  Validation rules ensure that the data users enter for new and existing records meets the standards specified by your business. 
    - Workflow  rules allow you to automate field updates, email alerts, outbound messages, and tasks associated with workflow, approvals, and milestones. 
    -  Triggers allow you to manipulate data and perform other actions on record insert.
    - These are powerful tools for making sure data entered during daily operations is clean and includes appropriate relationships between records. But they can also slow down processing if they’re enabled during massive data loads.
    -  But if you turn off validation, workflow, and triggers, how can you be sure that once you’ve finished loading, you have accurate data and the right relationships established between objects? There are three key phases to this effort—analyzing and preparing data, disabling events for loading, and post-processing.

    - With the right prep and post-processing, you can disable data validation and enrichment operations while loading —without compromising your data integrity or business rules.

## Required pieces

- Parent records with master-detail children
   - You won’t be able to load child records if the parents don’t already exist
- Record owners 
    - In most cases, your records will be owned by individual users, and the owners need to exist in the system before you can load the data.
 - Role hierarchy
    -  You might think that loading would be faster if the owners of your records were not members of the role hierarchy. But in almost all cases, the performance would be the same, and it would be considerably faster if you were loading portal accounts. So there’s no benefit to deferring this aspect of configuration.

## Right API to load the data
-  SOAP API is optimized for real-time client applications that update a few records at a time
    - Acceptable for small data loads, but becomes unwieldy and time-consuming with large data sets.
- Bulk API designed to to process data from a few thousand to millions of records
    - Based on REST principles and was developed specifically to simplify and optimize the process of loading or deleting large data sets.
    - Easy-to-monitor job status
    - Automatic retry of failed records
    - Support for parallel processing
    - Minimal round trips to Force.com 
    - Minimal API calls
    - Limited dropped connections
    - Easy-to-tune batch size 

## Bulk API

- Records are streamed to Force.com to create a new job.
- As the data rolls in for the job, it’s stored in temporary storage and then sliced up into user-defined batches (10,000 records max).
- Even as your data is still being sent to the server, the Force.com platform submits the batches for processing.
- Batches can be processed in parallel or serially depending on your needs
    - Each batch is processed independently, and once the batch finishes (successful or not), the job is updated with the results.
- The API logs the status of each job and tries to reprocess failed records for you automatically.
- If a job times out, the Bulk API automatically puts it back in the queue and re-tries it for you
- Jobs can be monitored and administrated from the Salesforce.com Admin UI by anyone with appropriate access.


## Analyzing and Preparing Data
- To load safely without triggers, validation rules, and workflow rules running, examine the business requirements that you could ordinarily meet with these operations, then answer a couple of questions.
    - Which of your requirements can you meet by data cleansing before data loading?
        - Query the data set before loading to find and fix records that don’t conform to the rules.
    - By sequencing load operations where there are critical dependencies between objects? 
    - Which of your requirements can you meet by **post-processing records** after data loading
        -  involve adding lookup relationships between objects, roll-up summary fields to parent records, and other data relationships between records.

## Disabling Events for Loading
- You can temporarily disable your rules and triggers to speed up loading
    - Edit each rule and set it to “inactive” status. 
    - Disable Validation, Lead and Case assignment rules, and Territory assignment rules 

### Disabling Triggers
-  Create a Custom Setting (e.g. ```Load_Lean__c```)  and a corresponding checkbox field to control when a trigger should fire. 
```

// disabling or enabling your trigger is as simple as editing the checkbox field.
trigger setDefaultValues on Account (before insert, before update) {
    Load_Settings__c settings = Load_Settings__c.getInstance(UserInfo.GetUserID() );
    if (settings.Load_Lean__c) return; // skip the trigger
    for (Account acct : trigger.new) {
      // code to handle the trigger.new
    }
}

```

### Post Processing
- Complete the data enrichment and configuration tasks you’ve deferred until this point
    - Add lookup relationships between objects, roll-up summary fields to parent records, and other data relationships between records using **Batch Apex or Bulk API**.
    - Enhance records in Salesforce with **foreign keys** or other data to facilitate integration with your other systems using **Batch Apex or Bulk API**.
    - Reset the fields on the custom settings you created for triggers, so they’ll fire appropriately on record creation and updates.
    - Turn validation, workflow, and assignment rules **back on** so they’ll trigger the appropriate actions as users enter and edit records.


