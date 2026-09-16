import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi'; 
// import { NavigationMixin } from 'lightning/navigation';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { createRecord } from 'lightning/uiRecordApi';

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
    // isCreateClicked = false;
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

    
    // Fetch record data using wire service
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
    
// export default class AccountCreationForm extends NavigationMixin(LightningElement) {
    // Form fields mapped exactly to HTML name properties
//     name = '';
//     accountNumber = '';
//     amount = '';
//     maxAmount = '';
//     minAmount = '';

//     // Toggle handler
//     handleCreateClick() {
//         this.isCreateClicked = !this.isCreateClicked;

//         // Optional: clear inputs when closing
//         if (!this.isCreateClicked) {
//             this.clearHandler();
//         }
//     }

//     // Capture inputs dynamically
//     captureInputs(event) {
//         const fieldName = event.target.name;
//         this[fieldName] = event.target.value;
//     }

//     // Submit handler
//     submitHandler() {
//         const allInputs = this.template.querySelectorAll('lightning-input');
//         let isValid = true;

//         allInputs.forEach(input => {
//             if (!input.reportValidity()) {
//                 isValid = false;
//             }
//         });

//         if (!isValid) {
//             this.showNotification('Check Inputs!!!', 'Mandatory inputs are missing or invalid!', 'warning', 'dismissible');
//             return;
//         }

//         const recordToCreate = {
//             apiName: 'BankAccount__c',
//             fields: {
//                 Name: this.name,
//                 AccountNumber__c: this.accountNumber,
//                 Amount__c: this.amount,
//                 maxAmount__c: this.maxAmount,
//                 minAmount__c: this.minAmount
//             }
//         };

//         createRecord(recordToCreate)
//             .then(result => {
//                 const message = `A prospect "${result.fields.Name.value}" was created successfully.`;
//                 this.showNotification('Success!!!', message, 'success', 'dismissible');
//                 this.navigateToRecord(result.id, 'BankAccount__c');
//                 this.handleCreateClick(); // auto-close form after success
//             })
//             .catch(error => {
//                 let errorMessage = 'Something went wrong while creating the record.';
//                 const errorBody = JSON.stringify(error);

//                 if (errorBody.includes('ACC-422-VR-ACCTNO-LEN')) {
//                     errorMessage = 'Account Number should not exceed 10 characters!';
//                 } else if (errorBody.includes('duplicate value found: email__c')) {
//                     errorMessage = 'No two Accounts can have the same email.';
//                 }

//                 this.showNotification('Error!!!', errorMessage, 'error', 'sticky');
//             });
//     }

//     // Clear inputs
//     clearHandler() {
//         this.name = '';
//         this.accountNumber = '';
//         this.amount = '';
//         this.maxAmount = '';
//         this.minAmount = '';

//         const allInputs = this.template.querySelectorAll('lightning-input');
//         allInputs.forEach(input => {
//             input.value = '';
//         });
//     }

//     // Toast notification
//     showNotification(title, message, variant, mode) {
//         this.dispatchEvent(new ShowToastEvent({ title, message, variant, mode }));
//     }

//     // // Navigate to record
//     // navigateToRecord(recordId, objectApiName) {
//     //     this[NavigationMixin.Navigate]({
//     //         type: 'standard__recordPage',
//     //         attributes: {
//     //             recordId,
//     //             objectApiName,
//     //             actionName: 'view'
//     //         }
//     //     });
//     // }

//     get showcreateRecord() {
//     return this.isCreateClicked;
// }

// // Example action that closes the form on completion or cancel
// hideForm() {
//     this.isCreateClicked = false; 
//     this.clearHandler(); // optional: reset inputs when hiding
// }
}
