/**
 * @description Service class for Account management in the Hospital Operations System.
 * Provides LWC-facing retrieval and search methods, and a bulk service method that
 * replaces the legacy @future approach in AccountProcessor with a safe, shareable call.
 *
 * Security model mirrors BillingCalculatorController:
 *   - with sharing enforces record-level visibility
 *   - WITH USER_MODE / AccessLevel.USER_MODE enforces CRUD + FLS
 *   - AuraHandledException wraps all @AuraEnabled errors for clean LWC error handling
 */
public with sharing class AccountService {

    // ─── Constants ───────────────────────────────────────────────────────────
    private static final String ERROR_NULL_ID    = 'Account Id cannot be null.';
    private static final String ERROR_NULL_INPUT = 'Input cannot be null or empty.';

    // ─── @AuraEnabled Methods (LWC / Aura surface) ───────────────────────────

    /**
     * @description Fetches a single Account record by Id for display in an LWC component.
     * @param accountId The Id of the Account to retrieve.
     * @return The matching Account, or an AuraHandledException if not found.
     * @example
     * AccountService.getAccount('001xx000003GbYAAA');
     */
    @AuraEnabled(cacheable=true)
    public static Account getAccount(Id accountId) {
        if (accountId == null) {
            throw new AuraHandledException(ERROR_NULL_ID);
        }
        try {
            return [
                SELECT Id, Name, Phone, BillingCity, BillingState, BillingCountry,
                       Number_Of_Contacts__c, Industry, Type, OwnerId
                FROM   Account
                WHERE  Id = :accountId
                WITH   USER_MODE
                LIMIT  1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving account: ' + e.getMessage());
        }
    }

    /**
     * @description Wildcard name search on Account records, safe against SOQL injection.
     * @param searchTerm Keyword string supplied by the user.
     * @return Up to 20 matching Account records, or an empty list when the term is blank.
     * @example
     * List<Account> results = AccountService.searchAccounts('City Hospital');
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String searchTerm) {
        if (String.isBlank(searchTerm)) {
            return new List<Account>();
        }
        try {
            String safeKey = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            return [
                SELECT Id, Name, Phone, BillingCity, BillingState, Type
                FROM   Account
                WHERE  Name LIKE :safeKey
                WITH   USER_MODE
                ORDER BY Name
                LIMIT  20
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Account search failed: ' + e.getMessage());
        }
    }

    // ─── Bulk Service Methods ─────────────────────────────────────────────────

    /**
     * @description Refreshes Number_Of_Contacts__c for a set of Accounts in one SOQL + one DML.
     * Replaces the AccountProcessor @future method with a bulkified, shareable service call
     * that can be invoked from triggers, flows (via @InvocableMethod), or other services.
     * @param accountIds Set of Account Ids to refresh.
     * @return Number of Account records successfully updated.
     * @throws AccountServiceException if accountIds is null or empty.
     * @example
     * Integer updated = AccountService.syncContactCounts(new Set<Id>{ acc1Id, acc2Id });
     */
    public static Integer syncContactCounts(Set<Id> accountIds) {
        if (accountIds == null || accountIds.isEmpty()) {
            throw new AccountServiceException(ERROR_NULL_INPUT);
        }

        List<Account> accounts = [
            SELECT Id, (SELECT Id FROM Contacts)
            FROM   Account
            WHERE  Id IN :accountIds
            WITH   USER_MODE
        ];

        List<Account> toUpdate = new List<Account>();
        for (Account acct : accounts) {
            toUpdate.add(new Account(
                Id                    = acct.Id,
                Number_Of_Contacts__c = acct.Contacts.size()
            ));
        }

        if (toUpdate.isEmpty()) {
            return 0;
        }

        List<Database.SaveResult> results = Database.update(toUpdate, AccessLevel.USER_MODE);
        return countSuccesses(results);
    }

    /**
     * @description Single-account convenience overload for syncContactCounts.
     * @param accountId The Account Id to refresh.
     * @return 1 if updated, 0 if the record was not found.
     */
    public static Integer syncContactCount(Id accountId) {
        return syncContactCounts(new Set<Id>{ accountId });
    }

    /**
     * @description Returns Accounts with their nested Contacts in one relationship query.
     * @param accountIds Set of Account Ids to retrieve.
     * @return List of Account records with Contacts populated.
     * @throws AccountServiceException if accountIds is null or empty.
     * @example
     * List<Account> accounts = AccountService.getAccountsWithContacts(accountIds);
     */
    public static List<Account> getAccountsWithContacts(Set<Id> accountIds) {
        if (accountIds == null || accountIds.isEmpty()) {
            throw new AccountServiceException(ERROR_NULL_INPUT);
        }

        return [
            SELECT Id, Name, Phone, BillingState, Number_Of_Contacts__c,
                   (SELECT Id, FirstName, LastName, Email, Phone
                    FROM   Contacts
                    ORDER BY LastName)
            FROM   Account
            WHERE  Id IN :accountIds
            WITH   USER_MODE
            ORDER BY Name
        ];
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    /**
     * @param results SaveResult list from a partial-success DML call.
     * @return Count of successful operations; logs a warning for each failure.
     */
    private static Integer countSuccesses(List<Database.SaveResult> results) {
        Integer count = 0;
        for (Database.SaveResult sr : results) {
            if (sr.isSuccess()) {
                count++;
            } else {
                for (Database.Error err : sr.getErrors()) {
                    System.debug(
                        LoggingLevel.WARN,
                        'Account update failed for ' + sr.getId() + ': ' + err.getMessage()
                    );
                }
            }
        }
        return count;
    }

    // ─── Exception ───────────────────────────────────────────────────────────

    /**
     * @description Custom exception for AccountService errors.
     */
    public class AccountServiceException extends Exception {}
}
