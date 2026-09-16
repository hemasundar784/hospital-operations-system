@isTest
private class DailyLeadProcessorTest {
    public static String CRON_EXP = '0 0 0 15 3 ? 2042';

    @isTest
    static void testDailyLeadProcessorScheduledJob() {
        // Create 200 Lead records with a blank LeadSource
        List<Lead> testLeads = new List<Lead>();
        for (Integer i = 0; i < 200; i++) {
            testLeads.add(new Lead(
                LastName = 'Test Lead ' + i,
                Company = 'Test Company ' + i,
                Status = 'Open - Not Contacted'
            ));
        }
        insert testLeads;

        Test.startTest();
        // Schedule the job
        String jobId = System.schedule('TestDailyLeadProcessor', CRON_EXP, new DailyLeadProcessor());
        Test.stopTest();

        // Verify all 200 records were updated to Dreamforce
        List<Lead> updatedLeads = [
            SELECT Id, LeadSource 
            FROM Lead 
            WHERE LeadSource = 'Dreamforce'
        ];
        
        Assert.areEqual(200, updatedLeads.size(), 'All 200 Lead records should be updated to Dreamforce.');
    }
}