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
@IsTest
private class TestVerifyDate {
    
    @IsTest
    static void testCheckDatesWithin30Days() {
        Date date1 = Date.newInstance(2026, 1, 1);
        Date date2 = Date.newInstance(2026, 1, 15);
        
        Date result = VerifyDate.CheckDates(date1, date2);
        
        Assert.areEqual(date2, result, 'Expected date2 to be returned when within 30 days.');
    }

    @IsTest
    static void testCheckDatesMoreThan30Days() {
        Date date1 = Date.newInstance(2026, 1, 1);
        Date date2 = Date.newInstance(2026, 2, 15);
        Date expectedEndOfMonth = Date.newInstance(2026, 1, 31);
        
        Date result = VerifyDate.CheckDates(date1, date2);
        
        Assert.areEqual(expectedEndOfMonth, result, 'Expected end of month date to be returned when date2 is 30+ days away.');
    }

    @IsTest
    static void testCheckDatesDate2InPast() {
        Date date1 = Date.newInstance(2026, 1, 15);
        Date date2 = Date.newInstance(2026, 1, 1);
        Date expectedEndOfMonth = Date.newInstance(2026, 1, 31);
        
        Date result = VerifyDate.CheckDates(date1, date2);
        
        Assert.areEqual(expectedEndOfMonth, result, 'Expected end of month date to be returned when date2 is in the past.');
    }
}