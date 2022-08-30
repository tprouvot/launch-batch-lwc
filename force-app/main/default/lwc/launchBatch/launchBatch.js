import { LightningElement, api, wire, track } from 'lwc';
import executeBatchJob from '@salesforce/apex/LaunchBatchController.executeBatchJob';
import abortBatchJob from '@salesforce/apex/LaunchBatchController.abortBatchJob';
import getBatchJobStatus from '@salesforce/apex/LaunchBatchController.getBatchJobStatus';
import { refreshApex } from '@salesforce/apex';

import launchBtn from '@salesforce/label/c.launchBtn';
import abortBtn from '@salesforce/label/c.abortBtn';
import sectionTitle from '@salesforce/label/c.sectionTitle';
import statusLabel from '@salesforce/label/c.statusLabel';
import notFound from '@salesforce/label/c.notFound';

export default class LaunchBatch extends LightningElement {
	@api className = '';
	@api batchSize;
	@api durationDelay;

	@track progress = 100;
	@track processStatus;
	@track isProgressing = false;

	jobId;
	status;
	total = 100;
	processed = 100;
	errors;
	btnLabel;
	_interval;

	label = {
		sectionTitle,
		statusLabel
	};

	@wire(getBatchJobStatus, { className: '$this.className' })
	batchJobStatus;

	connectedCallback() {
		this.getJobStatus();
		this._interval = setInterval(() => {
			this.getJobStatus();
		}, this.durationDelay);
	}

	renderedCallback() {
		if (!this.isProcessStopped()) {
			this.runJobStatusReq();
		}
	}

	runBatch() {
		if (this.isProgressing) {
			this.isProgressing = false;
			abortBatchJob({
				jobId: this.jobId
			}).then(result => {
				this.getJobStatus();
			})
				.catch((error) => {
					// Handle errors
					console.error(error);
				});
			clearInterval(this._interval);
		} else {

			executeBatchJob({
				batchName: this.className,
				scopeSize: this.batchSize
			}).then(result => {
				this.jobId = result;
				this.getJobStatus();
				this._interval = setInterval(() => {
					this.getJobStatus();
				}, this.durationDelay);
			})
				.catch((error) => {
					// Handle errors
					console.error(error);
				});
		}
	}

	disconnectedCallback() {
		// it's needed for the case the component gets disconnected
		clearInterval(this._interval);
	}

	runJobStatusReq() {
		if (this.isProcessStopped()) {
			clearInterval(this._interval);
		} else {
			refreshApex(this.batchJobStatus);
		}
	}

	getJobStatus() {
		this.updateStatusAndLabels();
		getBatchJobStatus({ jobIdOrClassName: this.jobId ? this.jobId : this.className })
			.then(result => {
				this.jobId = result == null ? null : result.Id;
				this.status = result == null ? notFound : result.Status;
				this.total = result == null ? 0 : result.TotalJobItems;
				this.processed = result == null ? 0 : result.JobItemsProcessed;
				this.errRec = result == null ? 0 : result.NumberOfErrors;
				this.progress = this.total == 0 ? 0 : (this.processed / this.total) * 100;
				this.processStatus = this.status + ' => ' + this.processed + '/' + this.total;
				if (this.progress === 100) {
					clearInterval(this._interval);
					this.processStatus = this.status;
					this.isProgressing = false;
				} else {
					this.isProgressing = true;
				}
				this.updateStatusAndLabels();
				this.runJobStatusReq();
			})
			.catch((error) => {
				// Handle errors
				console.error(error);
			});
	}

	updateStatusAndLabels() {
		if (this.isProcessStopped()) {
			clearInterval(this._interval);
			this.isProgressing = false;
			this.btnLabel = launchBtn + ' ' + this.className;
		} else {
			this.isProgressing = true;
			this.btnLabel = abortBtn;
		}
	}

	isProcessStopped() {
		// batch statuses from AsyncApexJob which don't need to be integrated in customLabels
		return this.status == 'Completed' || this.status == 'Aborted' || this.status == notFound ? true : false;
	}
}