/**
 * @description Central factory for creating test SObject records.
 * All test classes must use this factory — never build records inline in @TestSetup.
 */
@isTest
public class TestDataFactory {

    /**
     * @description Creates Account records.
     * @param count  Number of records to create.
     * @param doInsert  When true, inserts the records before returning.
     * @return List of Account records.
     */
    public static List<Account> createAccounts(Integer count, Boolean doInsert) {
        String uniqueRun = String.valueOf(Datetime.now().getTime());
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(new Account(
                Name         = 'Test Account ' + uniqueRun + '_' + i,
                BillingCity  = 'Test City',
                BillingState = 'CA',
                Phone        = '555-000-' + String.valueOf(i).leftPad(4, '0')
            ));
        }
        if (doInsert) {
            insert accounts;
        }
        return accounts;
    }

    /**
     * @description Creates Contact records linked to an Account.
     * @param count      Number of contacts to create.
     * @param accountId  Parent Account Id.
     * @param doInsert   When true, inserts the records before returning.
     * @return List of Contact records.
     */
    public static List<Contact> createContacts(Integer count, Id accountId, Boolean doInsert) {
        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < count; i++) {
            contacts.add(new Contact(
                FirstName = 'First' + i,
                LastName  = 'Last' + i,
                AccountId = accountId,
                Email     = 'test' + i + '@example.com'
            ));
        }
        if (doInsert) {
            Database.DmlOptions dml = new Database.DmlOptions();
            dml.DuplicateRuleHeader.allowSave = true;
            Database.insert(contacts, dml);
        }
        return contacts;
    }
}
