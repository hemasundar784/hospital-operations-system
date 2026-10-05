import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CONTACT_OBJECT from '@salesforce/schema/contact';
import FIRSTNAME_FIELD from '@salesforce/schema/contact.FirstName';
import LASTNAME_FIELD from '@salesforce/schema/contact.LastName';
import EMAIL_FIELD from '@salesforce/schema/contact.Email';
export default class contactCreator extends LightningElement {
    objectApiName = CONTACT_OBJECT;
    fields = [FIRSTNAME_FIELD, LASTNAME_FIELD, EMAIL_FIELD];
    handleSuccess(event) {
        const toastEvent = new ShowToastEvent({
            title: "Contact created",
            message: "Record ID: " + event.detail.id,
            variant: "success"
        });
        this.dispatchEvent(toastEvent); 
    }
}