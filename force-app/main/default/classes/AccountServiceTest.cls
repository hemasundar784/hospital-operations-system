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
private class AccountServiceTest {
    
    @isTest
    static void testCreateAccount() {
        // 1. Setup test data
        String testName = 'Acme Corp';
        String testNumber = 'ACCT-12345';
        String testTicker = 'ACME';
        
        AccountService service = new AccountService();
        
        // 2. Execute the method
        Test.startTest();
        Account result = service.createAccount(testName, testNumber, testTicker);
        Test.stopTest();
        
        // 3. Verify the output
        System.assertNotEquals(null, result, 'The returned account should not be null.');
        System.assertEquals(testName, result.Name, 'Account name should match the input parameter.');
        System.assertEquals(testNumber, result.AccountNumber, 'Account number should match the input parameter.');
        System.assertEquals(testTicker, result.TickerSymbol, 'Ticker symbol should match the input parameter.');
    }
}