### Lead Conversion 

 - The *convertLead* Database method converts a lead into an account and contact, as well as (optionally) an opportunity. 
 - The Database.convertLead() method can take one LeadConvert object or a list of LeadConvert objects
 - Doc: [LeadConvert Class)(https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_dml_convertLead.htm)


```java

// create the lead
Lead myLead = new Lead(LastName = 'Johnson', Company='Johnson And Sons');
insert myLead;

// prepare the LeadConvert 
Database.LeadConvert lc = new Database.LeadConvert();
lc.setLeadId(myLead.id); // set the id of the lead we just created
 
LeadStatus convertStatus = [SELECT Id, MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1];
lc.setConvertedStatus(convertStatus.MasterLabel);
 
Database.LeadConvertResult lcr = Database.convertLead(lc);
System.assert(lcr.isSuccess());
```
<img src="img/leadstatus-erd.png" height='300' alt="">
<hr/>
<img src="img/leadstatus-data.png" height='300' alt="">


