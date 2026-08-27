import { LightningElement, api, wire } from 'lwc'; // Removed unnecessary @track
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBillingRecord from '@salesforce/apex/BillingCalculatorController.getBillingRecord';
import searchBillingRecords from '@salesforce/apex/BillingCalculatorController.searchBillingRecords';
import saveInsuranceAmount from '@salesforce/apex/BillingCalculatorController.saveInsuranceAmount';
import BILLING_TITLE from '@salesforce/label/c.Billing_Calculator_Title';

export default class BillingCalculator extends LightningElement {
    @api recordId;
    
    // Modern LWC is reactive by default; @track is no longer needed for primitive types/basic arrays
    selectedBillingId;
    searchKey = '';
    searchResults = [];
    insuranceAmount = 0;

    billing;
    wiredResult;
    label = { BILLING_TITLE };
    
    // Explicit internal loading flag to handle imperatives and wire transitions flawlessly
    isSaving = false; 
    wireError = false;

    fieldsToDisplay = [
        'Patient_c__c', 
        'Invoice_Status__c',
        'Due_Date__c', 
        'Days_Overdue_c__c',
        'Consultation_Charge_c__c', 
        'Treatment_Charge_c__c',
        'Medicine_Charge_c__c', 
        'Ward_Charge_c__c'
    ];

    get targetId() {
        return this.recordId || this.selectedBillingId || null;
    }

    @wire(getBillingRecord, { id: '$targetId' })
    wiredBilling(result) {
        this.wiredResult = result;
        const { data, error } = result;
        
        if (data) {
            this.billing = data;
            this.insuranceAmount = data.insuranceAmount__c || 0;
            this.wireError = false;
        } else if (error) {
            this.billing = null;
            this.wireError = true;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Loading Record',
                    message: error.body?.message || 'Unknown wire error',
                    variant: 'error'
                })
            );
        } else {
            // Handles initialization or empty states cleanly
            this.billing = null;
            this.wireError = false;
        }
    }

    @wire(searchBillingRecords, { searchTerm: '$searchKey' })
    wiredSearch({ data, error }) {
        if (data) {
            this.searchResults = data;
        } else if (error) {
            this.searchResults = [];
        }
    }

    handleSearchChange(event) {
        this.searchKey = event.target.value;
    }

    handleSelectRecord(event) {
        event.preventDefault();
        this.selectedBillingId = event.currentTarget.dataset.id;
        this.searchResults = [];
        this.searchKey = '';
    }

    handleInsuranceChange(event) {
        this.insuranceAmount = parseFloat(event.target.value) || 0;
    }

    handleFormSuccess() {
        return refreshApex(this.wiredResult);
    }

    async handleSave() {
        // Guard clause to make sure we actually have a target record
        if (!this.targetId) return;

        this.isSaving = true; // Turn on spinner for the database operation
        try {
            await saveInsuranceAmount({
                id: this.targetId,
                insuranceAmount: this.insuranceAmount
            });
            this.dispatchEvent(new ShowToastEvent({ title: 'Invoice Saved', message: 'Insurance updates recorded.', variant: 'success' }));
            await refreshApex(this.wiredResult);
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({ title: 'Error Updating', message: error.body?.message || 'Unknown save error', variant: 'error' }));
        } finally {
            this.isSaving = false; // Always turn off spinner, even if save fails
        }
    }

    handlePrint() {
        window.print();
    }

    get recordName() {
        return this.billing ? this.billing.Name : '';
    }

    get totalInvoiceAmount() {
        return this.billing ? (this.billing.Total_Amount__c || 0) : 0;
    }

    get payable() {
        return this.totalInvoiceAmount - this.insuranceAmount;
    }

    // Dynamic, bug-free spinner calculation
    get isLoading() {
        // 1. Spinnings during active database saves
        if (this.isSaving) return true;
        // 2. Do not spin if an error took place or if no targetId is set
        if (this.wireError || !this.targetId) return false;
        // 3. Spin if targetId is set but wire data hasn't loaded yet
        return !this.billing;
    }

    get showPromptMessage() {
        return !this.targetId;
    }
}
