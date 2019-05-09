// Example trigger to prevent changes to record except on EXCLUDED fields.
// This is  provided as an example. Modifications are needed to fit to your use case

trigger MyValidationTrigger on Task (before update) {
  String ERROR_MSG = 'Not allowed to change closed Task!';
  Set<String> EXCLUDED_FIELDS = new Set<String>{'FinServ__Household__c', 'LastModifiedById'};
 
  // Build the set of fields to check prohibited changes
  Set<String> taskFields = new Set<String>();
  for(String field : Schema.Task.getSObjectType().getDescribe().fields.getMap().keySet()) {
      if(!EXCLUDED_FIELDS.contains(field)) // exclude the EXCLUDED_FIELDS 
      	taskFields.add(field);
  }
 
  // Bulkified: Loop on all updated Task records.
  for(Integer i = 0; i < Trigger.new.size(); i++) {
      Task oldTask = Trigger.old[i];
      Task newTask = Trigger.new[i];
     
      // Task not previously closed the skip it:
      // ref for task fields: https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer.html?f=Task
      if(!oldTask.isClosed)
          break;
     
      //Loop and check if ANY field change, minus excluded set.
      for(String field : taskFields) { 
          // Error if change detected
          if(oldTask.get(field) != newTask.get(field)) // change has happened
              // ref for addError:
              // https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_exceptions.htm
              newTask.addError(ERROR_MSG + ' Field changed was: ' + field);
          //Add any other condition checks here...
      }
  }
}


