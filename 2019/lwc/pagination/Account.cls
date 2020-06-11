public with sharing class AccountClass {
    @AuraEnabled
     public static List<Account> getAccountList(){
        return [select id, Name , Phone from Account limit 2000];
     }
}
