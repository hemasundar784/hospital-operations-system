public class DailyLeadProcessor implements Schedulable {
    public void execute(SchedulableContext ctx) {
        List<Lead> leadsToUpdate = [
            SELECT Id, LeadSource 
            FROM Lead 
            WHERE LeadSource = NULL 
            OR LeadSource = '' 
            LIMIT 200
        ];
        
        for (Lead l : leadsToUpdate) {
            l.LeadSource = 'Dreamforce';
        }
        
        if (!leadsToUpdate.isEmpty()) {
            update leadsToUpdate;
        }
    }
}