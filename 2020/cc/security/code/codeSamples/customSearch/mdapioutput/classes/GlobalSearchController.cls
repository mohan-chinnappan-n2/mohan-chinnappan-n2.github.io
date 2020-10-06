public with sharing class GlobalSearchController {

    @AuraEnabled(Cacheable=true)
    public static Object[] searchInObject(String searchString, String objectApiName) {

        // Error handling / validation of arguments would go here...

        String whereClause = 'WHERE Name LIKE \'%' + searchString + '%\'';
        String networkId = System.Network.getNetworkId();
        return Database.query('SELECT Id, Name FROM ' + objectApiName + ' ' + whereClause + ' ORDER BY Name');
    }

}