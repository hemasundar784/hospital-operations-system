import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi'; 

const FIELDS = [
    'BankAccount__c.Id', 
    'BankAccount__c.accnumber__c', 
    'BankAccount__c.maxAmount__c', 
    'BankAccount__c.minAmount__c', 
    'BankAccount__c.totalDeposits__c'
];
    
export default class TestingLwc extends LightningElement {
    @api recordId;
    
    // Tracked variables
    enteredName = '';
    enter2Name = '';
    data = '';
    retrievedRecord = {};
    isClicked = false;
    isrecord = false; // Added the missing property declaration

    // 1. Fires when the component is inserted into the DOM
    connectedCallback() {
        console.log('test:Component initialized. Record ID is: ', this.recordId);
        this.data = 'Initial setup data via connectedCallback'; 
    }

    // 2. Fires every time the component finishes rendering/rerendering the HTML
    renderedCallback() {
        console.log('test:The UI has rendered or updated.');
    }

    // Standard input changes
    handleChange(event) {
        this.enteredName = event.target.value; 
        console.log('test:value', this.enteredName);
    }

    handleSecondInputChange(event) {
        this.enter2Name = event.target.value;
        console.log('test:value', this.enter2Name);
    }

    // Button click handler
    handleClick() {
        this.isClicked = true;
        this.data = 'Button was clicked! Displaying new data.';
    } // <-- FIXED: Added the missing closing brace here

    // Fetch record data using wire service
    @wire(getRecord, { recordId: "$recordId", fields: FIELDS })
    retrieveRecord({ error, data }) {
        if (data) {
            console.log(`test:: Data: ${JSON.stringify(data, null, 1)}`);
            
            // Map the LDS response using uniform camelCase names
            this.retrievedRecord = {
                bankAccountId: data.fields.Id.value,
                accountNumber: data.fields.accnumber__c.value,
                maxAmount: data.fields.maxAmount__c.value, 
                minAmount: data.fields.minAmount__c.value,
                totalDeposits: data.fields.totalDeposits__c.value
            };

            // Enable the visibility flag so HTML template renders the grid
            this.isrecord = true; 
        }
        if (error) {
            console.error(`test:: Error: ${JSON.stringify(error, null, 1)}`);
            this.isrecord = false;
        }
    }

    // Getter logic combines both constraints: Show data ONLY after click AND wire is loaded
    get showRecordGrid() {
        return this.isClicked && this.isrecord;
    }
} // <-- FIXED: Removed the extra trailing brace here
