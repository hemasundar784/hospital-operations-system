public with sharing class ContactController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        // Comment out the return statement temporarily to test error handling
        /*
        return [
            SELECT FirstName, LastName, Email
            FROM Contact
            WITH USER_MODE
            ORDER BY FirstName
        ];
        */
        throw new AuraHandledException('Forced error');
    }
}