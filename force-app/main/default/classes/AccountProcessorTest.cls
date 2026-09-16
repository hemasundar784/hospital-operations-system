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
private class AccountProcessorTest {
    @isTest
    static void testCountContacts() {
        // Create test Account
        Account newAcc = new Account(Name = 'Test Account');
        insert newAcc;
        
        // Create test Contacts associated with the Account
        Contact newContact1 = new Contact(FirstName = 'John', LastName = 'Doe', AccountId = newAcc.Id);
        Contact newContact2 = new Contact(FirstName = 'Jane', LastName = 'Doe', AccountId = newAcc.Id);
        insert new List<Contact>{ newContact1, newContact2 };
        
        List<Id> accountIds = new List<Id>{ newAcc.Id };
        
        Test.startTest();
        AccountProcessor.countContacts(accountIds);
        Test.stopTest();
        
        // Verify result
        Account updatedAcc = [SELECT Number_Of_Contacts__c FROM Account WHERE Id = :newAcc.Id];
        Assert.areEqual(2, updatedAcc.Number_Of_Contacts__c, 'The contact count should match the number of inserted contacts.');
    }
}