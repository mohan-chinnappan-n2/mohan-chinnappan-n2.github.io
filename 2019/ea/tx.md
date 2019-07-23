## EA tranformations

## sfdcDigest
The sfdcDigest transformation generates a dataset based on data that it extracts from a Salesforce object.

At run time, Analytics runs the dataflow as the Integration User
-  validates access to the objects and fields based on the profile of the Integration User.
- Integration User is a preconfigured user that is created when Analytics is enabled in your organization.

### Example: create a dataset that contains all opportunities from the Opportunity object.
```json
{    
   "Extract_Opportunities": {        
      "action": "sfdcDigest",        
      "parameters": {            
         "object": "Opportunity",
         "fields": [                
            { "name": "Id" },                
            { "name": "Name" },
            { "name": "Amount" },
            { "name": "StageName" },                
            { "name": "CloseDate" },
            { "name": "AccountId" },
            { "name": "OwnerId" },
            { "name": "OpportunitySupportTeamMembers__c" }
         ]  
      }    
   },    
   "Register_Opportunities_Dataset": {        
      "action": "sfdcRegister",        
      "parameters": {            
         "alias": "Opportunities",            
         "name": "Opportunities",            
         "source": "Extract_Opportunities"        
      }    
   }
}
```

### Limits 

-  a dataset can contain a maximum of 5,000 fields
-  sfdcDigest transformation runs a SOQL query to extract data from a Salesforce object, and so is subject to SOQL limits
-  length of the SOQL query cannot exceed 20,000 characters
    - for long SOQL queries:
        - Consider breaking up the extract into two or more sfdcDigest transformations and then use the augment transformation to combine the results. 
- sfdcDigest transformation can extract data from Salesforce Big Objects, but incremental extract isn’t supported and filtering is possible only on primary key fields.
- filter records to reduce the number of extracted and processed records, exclude records that contain irrelevant or sensitive data, and increase dataflow performance.
- Analytics can add a default value to records that have missing values for a field.

## sfdcRegister 

sfdcRegister transformation registers a dataset to make it available for queries
