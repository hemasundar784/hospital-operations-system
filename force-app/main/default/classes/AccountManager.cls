@RestResource(urlMapping='/Accounts/*/contacts')
global with sharing class AccountManager {
    @HttpGet
    global static Account getAccount() {
        RestRequest request = RestContext.request;
        // Extract the Account ID from the URL path: /Accounts/<Account_ID>/contacts
        String requestURI = request.requestURI;
        String accountId = requestURI.substringBetween('/Accounts/', '/contacts');
        
        Account result = [SELECT Id, Name, (SELECT Id, Name FROM Contacts)
                          FROM Account
                          WHERE Id = :accountId];
        return result;
    }
}