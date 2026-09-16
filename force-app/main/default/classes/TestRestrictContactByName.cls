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
private class TestRestrictContactByName {

    @IsTest
    static void testRestrictInvalidNameInsert() {
        // Test data setup: Create a contact with the restricted last name
        Contact invalidContact = new Contact(LastName = 'INVALIDNAME');

        // Perform test
        Test.startTest();
        Database.SaveResult result = Database.insert(invalidContact, false);
        Test.stopTest();

        // Verify that insert failed and appropriate error message was returned
        Assert.isFalse(result.isSuccess(), 'Contact insertion with INVALIDNAME should fail.');
        Assert.isTrue(result.getErrors().size() > 0, 'Error array should contain elements.');
        Assert.areEqual(
            'The Last Name "INVALIDNAME" is not allowed for DML',
            result.getErrors()[0].getMessage(),
            'Error message text does not match expected result.'
        );
    }

    @IsTest
    static void testValidNameInsertAndUpdate() {
        // Test data setup: Create a valid contact
        Contact validContact = new Contact(LastName = 'ValidName');

        // Perform test: Insert valid contact
        Test.startTest();
        Database.SaveResult insertResult = Database.insert(validContact, false);
        Assert.isTrue(insertResult.isSuccess(), 'Valid contact insert should succeed.');

        // Update contact to test the 'before update' trigger context
        validContact.FirstName = 'Test';
        Database.SaveResult updateResult = Database.update(validContact, false);
        Test.stopTest();

        // Verify update succeeded
        Assert.isTrue(updateResult.isSuccess(), 'Valid contact update should succeed.');
    }
}