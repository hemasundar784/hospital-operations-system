@isTest
private class TaskUtilTests {

    @isTest
    static void testGetTaskPriorityNormal() {
        test.startTest();
        String priority = TaskUtil.getTaskPriority('TX');
        test.stopTest();
        System.assertEquals('Normal', priority, 'Expected Normal for a non-CA state');
    }

    @isTest
    static void testGetTaskPriorityHigh() {
        test.startTest();
        String priority = TaskUtil.getTaskPriority('CA');
        test.stopTest();
        System.assertEquals('High', priority, 'Expected High for CA state');
    }

    @isTest
    static void testGetTaskPriorityNullInputs() {
        test.startTest();
        System.assertEquals(null, TaskUtil.getTaskPriority(''), 'Expected null for blank input');
        System.assertEquals(null, TaskUtil.getTaskPriority('CAL'), 'Expected null for state longer than 2 chars');
    }
}
