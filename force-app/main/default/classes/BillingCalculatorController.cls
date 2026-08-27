/**
 * @description Secure controller handling billing operations for the BillingCalculator LWC.
 * Enforces strict user sharing structures and security constraints to pass Code Analyzer v5 gates.
 */
public with sharing class BillingCalculatorController {

    /**
     * @description Fetches a singular Billing record based on its record ID safely in User Mode.
     * @param id The Salesforce record ID of the target billing record.
     * @return Billing_c__c record matching the ID.
     */
    @AuraEnabled(cacheable=true)
    public static Billing_c__c getBillingRecord(Id id) {
        // Guard clause to instantly exit if the ID parameter arrives blank
        if (id == null) {
            return null;
        }

        try {
            // WITH USER_MODE completely satisfies Salesforce Graph Engine (SFGE) CRUD/FLS checks
            return [
                SELECT Id, Name, Patient_c__c, Invoice_Status__c, Due_Date__c, 
                       Days_Overdue_c__c, Consultation_Charge_c__c, Treatment_Charge_c__c, 
                       Medicine_Charge_c__c, Ward_Charge_c__c, Total_Amount__c, insuranceAmount__c
                FROM Billing_c__c
                WHERE Id = :id
                WITH USER_MODE
                LIMIT 1
            ];
        } catch (Exception e) {
            // High-severity Code Analyzer rule: Never leave catch blocks empty or throw raw exceptions.
            // Converting standard exceptions into AuraHandledExceptions turns off the infinite LWC spinner.
            throw new AuraHandledException('Error fetching billing details: ' + e.getMessage());
        }
    }

    /**
     * @description Performs a secure, wild-card search query on Billing record names.
     * @param searchTerm The user's dynamic keyword string from the LWC lookup search input.
     * @return List of matching Billing records.
     */
    @AuraEnabled(cacheable=true)
    public static List<Billing_c__c> searchBillingRecords(String searchTerm) {
        if (String.isBlank(searchTerm)) {
            return new List<Billing_c__c>();
        }

        try {
            // Strict bind sanitization to prevent dynamic SOQL/SOSL Injection vulnerabilities
            String safeSearchKey = '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%';
            
            return [
                SELECT Id, Name 
                FROM Billing_c__c 
                WHERE Name LIKE :safeSearchKey
                WITH USER_MODE
                LIMIT 10
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Search execution encountered an error: ' + e.getMessage());
        }
    }

    /**
     * @description Updates the insurance amount field securely. 
     * @param id The targeted billing record ID.
     * @param insuranceAmount The new currency value to write onto the record.
     */
    @AuraEnabled
    public static void saveInsuranceAmount(Id id, Decimal insuranceAmount) {
        if (id == null) {
            throw new AuraHandledException('Cannot update insurance amount: Missing Target Record ID.');
        }

        try {
            // Creating a detached instance to perform a highly safe, localized update matrix
            Billing_c__c recordToUpdate = new Billing_c__c(
                Id = id,
                insuranceAmount__c = (insuranceAmount != null) ? insuranceAmount : 0
            );

            // Using Database methods with AccessLevel forces Code Analyzer engine approval
            Database.update(recordToUpdate, AccessLevel.USER_MODE);
            
        } catch (Exception e) {
            throw new AuraHandledException('Database transaction failed while saving changes: ' + e.getMessage());
        }
    }
}
