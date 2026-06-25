public without sharing class BillingCalculatorController {
 
    @AuraEnabled(cacheable=true)
    public static Billing_c__c getBillingRecord(Id id) {
        if (id == null) return null;
        try {
            return [
                select Id, Name, Patient_c__c, Total_Amount__c, Amount_Paid__c, Due_Date__c, Invoice_Status__c, Insurance_Provider_Link__c, Outstanding_Balance__c, Days_Overdue_c__c , insuranceAmount__c, Consultation_Charge_c__c, Treatment_Charge_c__c, Medicine_Charge_c__c, Ward_Charge_c__c, Total_Invoice_Amount__c 
                from Billing_c__c      
                WHERE Id = :ID
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Billing_c__c> searchBillingRecords(String searchTerm) {
        String key = '%' + searchTerm + '%';
        return [
            SELECT Id, Name 
            FROM Billing_c__c 
            WHERE Name LIKE :key 
            LIMIT 5
        ];
    }
 
    @AuraEnabled
    public static void saveInsuranceAmount(Id id, Decimal insuranceAmount) {
        update new Billing_c__c(
            Id = id,
            insuranceAmount__c = insuranceAmount
        );
    }
}