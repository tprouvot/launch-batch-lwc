import { LightningElement, api, wire, track } from 'lwc';
import executeBatchJob from '@salesforce/apex/LaunchBatchController.executeBatchJob';
import getBatchJobStatus from '@salesforce/apex/LaunchBatchController.getBatchJobStatus';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

//TODO use lwc encapsulation to pass those values
import JOB_ID from '@salesforce/schema/MaskSObject__c.LastJobId__c';
import ERROR_RECORDS from '@salesforce/schema/AsyncApexJob.NumberOfErrors';
import ITEMS_PROCESSED from '@salesforce/schema/AsyncApexJob.JobItemsProcessed';
import TOTAL_RECORDS from '@salesforce/schema/AsyncApexJob.TotalJobItems';
import JOB_STATUS from '@salesforce/schema/AsyncApexJob.Status';

//const FIELDS = [JOB_ID];
export default class LaunchBatch extends LightningElement {
	@api recordId;
	@api className = '';
	@api batchSize = 200;

	@track progress = 100;
	@track isBulk = false;
	@track processStatus = 'In Progress';

	isProgressing = false;
	status;
	total;
	processed;
	jobId;
	errors;

	//@wire(getRecord, { recordId: '$recordId', fields: ['MaskSObject__c.LastJobId__c'] })
	@wire(getRecord, { recordId: '$recordId', fields: [JOB_ID] })
	wiredRecord({ error, data }) {
		if (error) {
			//TODO handle error
			console.error(error);
		} else if (data) {
			this.jobId = data.fields.LastJobId__c.value;

		}
	}

	get computedLabel() {
		return this.isProgressing ? 'Stop Execution' : 'Launch ' + this.className;
	}

	renderedCallback() {
		this.runJobStatusReq();
	}

	toggleProgress() {
		if (this.isProgressing) {
			// stop
			this.isProgressing = false;
			clearInterval(this._interval);
		} else {
			executeBatchJob({
				batchName: this.className,
				scopeSize: this.batchSize
			}).then(result => {
				console.log(JSON.stringify(result));
				this.jobId = result.Id;
				this.getJobStatus();
			})
				.catch((error) => {
					// Handle errors
				});
		}
	}

	disconnectedCallback() {
		// it's needed for the case the component gets disconnected
		// and the progress is being increased
		// this code doesn't show in the example
		clearInterval(this._interval);
	}

	getJobStatus() {
		getBatchJobStatus({ jobId: this.jobId })
			.then(result => {
				this.status = result.Status;
				console.log('Status is:' + this.status);
				this.total = result.TotalJobItems;
				console.log('Total Records:' + this.total);
				this.processed = result.JobItemsProcessed;
				console.log('Records Processed:' + this.processed);
				this.errRec = result.NumberOfErrors;
				console.log('error :' + this.errRec);
			});
		this.progress = (this.processed / this.total) * 100;
		console.log('Progress is:' + this.progress);
		this.processStatus = 'Processing => ' + this.progress + '/' + this.total;
		if (this.progress === this.total) {
			clearInterval(this._interval);
			this.processStatus = 'Completed';
		}
	}

	runJobStatusReq() {
		this._interval = setInterval(() => {
			this.getJobStatus();
		}, 5000);
		if (this.processStatus == 'Completed') {
			console.log('Refreshing Wire Status');
			//will call my wire method to refresh the results once batch process completes
			return refreshApex(this._wiredResult);
		}
	}
}