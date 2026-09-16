@isTest
private class AddPrimaryContactTest {
    @isTest
    static void testQueueable() {
        List<Account> accounts = new List<Account>();

        // Insert 50 Account records for NY
        for (Integer i = 0; i < 50; i++) {
            accounts.add(new Account(
                Name = 'Test NY Account ' + i, 
                BillingCountry = 'US', 
                BillingState = 'NY'
            ));
        }

        // Insert 50 Account records for CA
        for (Integer i = 0; i < 50; i++) {
            accounts.add(new Account(
                Name = 'Test CA Account ' + i, 
                BillingCountry = 'US', 
                BillingState = 'CA'
            ));
        }

        insert accounts;

        Contact testContact = new Contact(FirstName = 'John', LastName = 'Doe');
        AddPrimaryContact updater = new AddPrimaryContact(testContact, 'CA');

        Test.startTest();
        System.enqueueJob(updater);
        Test.stopTest();

        // Assert 50 contacts were created for CA accounts
        Assert.areEqual(
            50, 
            [SELECT COUNT() FROM Contact WHERE Account.BillingState = 'CA'], 
            '50 Contact records should be created for Accounts in CA.'
        );
    }
}