/**
 * @description Test coverage for AccountService.
 * Covers positive, negative, and bulk (251+) scenarios for every public method.
 */
@isTest
private class AccountServiceTest {

    private static final Integer BULK_COUNT = 251;

    // ─── Test Setup ───────────────────────────────────────────────────────────

    @TestSetup
    static void setupTestData() {
        // Bulk accounts for governor-limit coverage
        List<Account> accounts = TestDataFactory.createAccounts(BULK_COUNT, true);

        // Add 3 contacts to the first account to verify syncContactCounts
        TestDataFactory.createContacts(3, accounts[0].Id, true);
    }

    // ─── getAccount ──────────────────────────────────────────────────────────

    @isTest
    static void shouldReturnAccount_WhenValidIdProvided() {
        // Given
        Account acct = [SELECT Id FROM Account LIMIT 1];

        // When
        Test.startTest();
        Account result = AccountService.getAccount(acct.Id);
        Test.stopTest();

        // Then
        Assert.areEqual(acct.Id, result.Id, 'Returned account Id should match the queried Id');
        Assert.isNotNull(result.Name, 'Account Name should be populated');
    }

    @isTest
    static void shouldThrowAuraHandledException_WhenGetAccountCalledWithNullId() {
        // When / Then
        Test.startTest();
        try {
            AccountService.getAccount(null);
            Assert.fail('Expected AuraHandledException to be thrown for null Id');
        } catch (AuraHandledException e) {
            Assert.isTrue(
                e.getMessage().contains('null') || e.getMessage().toLowerCase().contains('cannot'),
                'Exception message should indicate null Id: ' + e.getMessage()
            );
        }
        Test.stopTest();
    }

    // ─── searchAccounts ──────────────────────────────────────────────────────

    @isTest
    static void shouldReturnMatchingAccounts_WhenSearchTermMatches() {
        // Given — all setup accounts contain "Test Account" in their name
        String term = 'Test Account';

        // When
        Test.startTest();
        List<Account> results = AccountService.searchAccounts(term);
        Test.stopTest();

        // Then
        Assert.isTrue(results.size() > 0, 'Search should return at least one result for "' + term + '"');
    }

    @isTest
    static void shouldReturnEmptyList_WhenSearchTermIsBlank() {
        // When
        Test.startTest();
        List<Account> results = AccountService.searchAccounts('   ');
        Test.stopTest();

        // Then
        Assert.areEqual(0, results.size(), 'Blank search term should return an empty list');
    }

    @isTest
    static void shouldReturnEmptyList_WhenSearchTermIsNull() {
        // When
        Test.startTest();
        List<Account> results = AccountService.searchAccounts(null);
        Test.stopTest();

        // Then
        Assert.areEqual(0, results.size(), 'Null search term should return an empty list');
    }

    @isTest
    static void shouldReturnNoResults_WhenSearchTermMatchesNothing() {
        // When
        Test.startTest();
        List<Account> results = AccountService.searchAccounts('XYZZY_NO_MATCH_12345');
        Test.stopTest();

        // Then
        Assert.areEqual(0, results.size(), 'Non-matching search term should return an empty list');
    }

    // ─── syncContactCounts ───────────────────────────────────────────────────

    @isTest
    static void shouldUpdateContactCount_WhenAccountHasContacts() {
        // Given — first account has 3 contacts inserted in @TestSetup
        Account acct = [SELECT Id FROM Account LIMIT 1];

        // When
        Test.startTest();
        Integer updated = AccountService.syncContactCounts(new Set<Id>{ acct.Id });
        Test.stopTest();

        // Then
        Account refreshed = [SELECT Number_Of_Contacts__c FROM Account WHERE Id = :acct.Id];
        Assert.areEqual(1, updated, 'One account record should have been updated');
        Assert.areEqual(3, (Integer) refreshed.Number_Of_Contacts__c,
            'Number_Of_Contacts__c should equal the 3 contacts inserted in setup');
    }

    @isTest
    static void shouldBulkUpdateContactCounts_ForAllAccounts() {
        // Given
        List<Account> accounts = [SELECT Id FROM Account];
        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

        // When
        Test.startTest();
        Integer updated = AccountService.syncContactCounts(accountIds);
        Test.stopTest();

        // Then
        Assert.areEqual(BULK_COUNT, updated,
            'All ' + BULK_COUNT + ' accounts should be updated');
    }

    @isTest
    static void shouldThrowAccountServiceException_WhenSyncCalledWithNullInput() {
        // When / Then
        Test.startTest();
        try {
            AccountService.syncContactCounts(null);
            Assert.fail('Expected AccountService.AccountServiceException for null input');
        } catch (AccountService.AccountServiceException e) {
            Assert.isTrue(e.getMessage().toLowerCase().contains('null')
                || e.getMessage().toLowerCase().contains('empty'),
                'Exception message should indicate null/empty input: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void shouldThrowAccountServiceException_WhenSyncCalledWithEmptySet() {
        // When / Then
        Test.startTest();
        try {
            AccountService.syncContactCounts(new Set<Id>());
            Assert.fail('Expected AccountService.AccountServiceException for empty Set');
        } catch (AccountService.AccountServiceException e) {
            Assert.isTrue(e.getMessage().toLowerCase().contains('null')
                || e.getMessage().toLowerCase().contains('empty'),
                'Exception message should indicate empty input: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ─── syncContactCount (single-record overload) ───────────────────────────

    @isTest
    static void shouldUpdateContactCount_UsingSingleRecordOverload() {
        // Given
        Account acct = [SELECT Id FROM Account LIMIT 1];

        // When
        Test.startTest();
        Integer updated = AccountService.syncContactCount(acct.Id);
        Test.stopTest();

        // Then
        Assert.areEqual(1, updated, 'Single-record overload should return 1 on success');
    }

    // ─── getAccountsWithContacts ─────────────────────────────────────────────

    @isTest
    static void shouldReturnAccountsWithContacts_WhenValidIdsProvided() {
        // Given — first account has 3 contacts from @TestSetup
        Account acct = [SELECT Id FROM Account LIMIT 1];

        // When
        Test.startTest();
        List<Account> results = AccountService.getAccountsWithContacts(new Set<Id>{ acct.Id });
        Test.stopTest();

        // Then
        Assert.areEqual(1, results.size(), 'Should return exactly one account');
        Assert.areEqual(3, results[0].Contacts.size(),
            'Account should have 3 contacts from test setup');
    }

    @isTest
    static void shouldReturnBulkAccounts_WithContactsPopulated() {
        // Given
        List<Account> accounts = [SELECT Id FROM Account];
        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

        // When
        Test.startTest();
        List<Account> results = AccountService.getAccountsWithContacts(accountIds);
        Test.stopTest();

        // Then
        Assert.areEqual(BULK_COUNT, results.size(),
            'All ' + BULK_COUNT + ' accounts should be returned');
    }

    @isTest
    static void shouldThrowAccountServiceException_WhenGetWithContactsCalledWithNull() {
        // When / Then
        Test.startTest();
        try {
            AccountService.getAccountsWithContacts(null);
            Assert.fail('Expected AccountService.AccountServiceException for null input');
        } catch (AccountService.AccountServiceException e) {
            Assert.isNotNull(e.getMessage(), 'Exception should carry a message');
        }
        Test.stopTest();
    }
}
