// Example trigger to prevent changes to record except on EXCLUDED fields.
// This is for example only and is no provided with any gaurentee.
trigger MyValidationTrigger on Task (before update) {
  String ERROR_MSG = 'Not allowed to change closed Task!';
  Set<String> EXCLUDED_FIELDS = new Set<String>{'FinServ__Household__c', 'LastModifiedById'};
 
  // Build the set of fields to check prohibited changes
  Set<String> taskFields = new Set<String>();
  for(String field : Schema.Task.getSObjectType().getDescribe().fields.getMap().keySet()) {
      if(!EXCLUDED_FIELDS.contains(field)) // exclude the EXCLUDED_FIELDS 
      	taskFields.add(field);
  }
 
  // Bulkified. Loop on all updated Task records.
  for(Integer i = 0; i < Trigger.new.size(); i++) {
      Task oldTask = Trigger.old[i];
      Task newTask = Trigger.new[i];
     
      // Task not previously closed, skip
      if(!oldTask.isClosed)
          break;
     
      //Loop and check if ANY field change, minus excluded set.
      for(String field : taskFields) { 
          // Error if change detected
          if(oldTask.get(field) != newTask.get(field)) // change has happened
              newTask.addError(ERROR_MSG + ' Field changed was: ' + field);
          //Add any other condition checks here...
      }
  }
}


