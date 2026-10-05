@isTest
private class AccountManagerTest {
    @isTest 
    static void testGetAccount() {
        // Create test record
        Account acc = new Account(Name = 'Test Account');
        insert acc;
        
        Contact con = new Contact(FirstName = 'John', LastName = 'Doe', AccountId = acc.Id);
        insert con;
        
        // Set up REST request context
        RestRequest request = new RestRequest();
        request.requestUri = 'https://yourInstance.my.salesforce.com/services/apexrest/Accounts/' + acc.Id + '/contacts';
        request.httpMethod = 'GET';
        RestContext.request = request;
        
        // Call the REST method
        Account resultAccount = AccountManager.getAccount();
        
        // Verify results
        System.assert(resultAccount != null, 'Account should not be null');
        System.assertEquals('Test Account', resultAccount.Name, 'Account name should match');
        System.assertEquals(1, resultAccount.Contacts.size(), 'Should return associated contact');
        System.assertEquals('Doe', resultAccount.Contacts[0].LastName, 'Contact last name should match');
    }
}