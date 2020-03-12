trigger leadConvert on LCTest__e  (after insert) {
    // TODO: Bulkify
    // TODO: Check for the msg__c content and do the action based on that
    String msg = Trigger.new[0].msg__c;
    
    String fname = Trigger.new[0].fname__c;
    String lname = Trigger.new[0].lname__c;
    String cname = Trigger.new[0].cname__c;
    
    Lead myLead = new Lead(LastName = lname, FirstName= fname, Company= cname );
    insert myLead;
    
    Database.LeadConvert lc = new database.LeadConvert();
    lc.setLeadId(myLead.id);
    
    LeadStatus convertStatus = [SELECT Id, MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1];
    lc.setConvertedStatus(convertStatus.MasterLabel);
    
    Database.LeadConvertResult lcr = Database.convertLead(lc);
    System.assert(lcr.isSuccess());
    
    // POST chatter message to  user profile 
    LCEventTriggerHandler.postTextToUserProfile('0053h000000IJFeAAO', 'Lead Created finished!');
}


public with sharing class LCEventTriggerHandler { 

   public static void postTextToUserProfile(Id userId, String msg) {
            // feedType is UserProfile
            ConnectApi.FeedType feedType = ConnectApi.FeedType.UserProfile;        
        
            // prepare the message
            ConnectApi.MessageBodyInput mbi = new     ConnectApi.MessageBodyInput();
            mbi.messageSegments = new List<ConnectApi.MessageSegmentInput>();
            // add the text segments           
            ConnectApi.TextSegmentInput textSegment = new ConnectApi.TextSegmentInput();
            textSegment.text = msg;
            mbi.messageSegments.add(textSegment);            
        
            // assemble feed body
            ConnectApi.FeedItemInput feedItemInput = new ConnectApi.FeedItemInput();
            feedItemInput.body = mbi;    
        
            // post the msg 
            ConnectApi.ChatterFeeds.postFeedElement(null, userId , ConnectApi.FeedElementType.FeedItem, msg);
        
      }
 }
