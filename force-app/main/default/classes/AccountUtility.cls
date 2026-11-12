public with sharing class AccountUtility {
    public static void viewAnnualRevenue() {
        list<account> accountsList= [SELECT Name, AnnualRevenue FROM Account];

        for( account acc : accountsList) {
            String acctRev = 'Account Name: ' + acc.Name + ', Annual Revenue: ' + acc.AnnualRevenue;
            system.debug(acctRev);
        }
    }
}