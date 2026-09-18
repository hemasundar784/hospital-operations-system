/**
 * This class contains unit tests for validating the behavior of Apex classes
 * and triggers.
 *
 * Unit tests are class methods that verify whether a particular piece
 * of code is working properly. Unit test methods take no arguments,
 * commit no data to the database, and are flagged with the testMethod
 * keyword in the method definition.
 *
 * All test methods in an org are executed whenever Apex code is deployed
 * to a production org to confirm correctness, ensure code
 * coverage, and prevent regressions. All Apex classes are
 * required to have at least 75% code coverage in order to be deployed
 * to a production org. In addition, all triggers must have some code coverage.
 * 
 * The @isTest class annotation indicates this class only contains test
 * methods. Classes defined with the @isTest annotation do not count against
 * the org size limit for all Apex scripts.
 *
 * See the Apex Language Reference for more information about Testing and Code Coverage.
 */
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