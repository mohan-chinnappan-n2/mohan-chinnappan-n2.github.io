public with sharing class ServiceAppointmentsMapController {
    @AuraEnabled(cacheable=true)
    public static List<SObject> getServiceAppointments() {
        return [
            SELECT Id, Description, Latitude, Longitude 
            FROM ServiceAppointment WHERE Latitude != null
        ];
    }
}