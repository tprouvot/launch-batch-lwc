import { LightningElement, api } from 'lwc';
import getAccountDocuments from '@salesforce/apex/LaunchBatchController.executeBatchJob';

export default class LaunchBatch extends LightningElement {
	@api className = '';
	@api batchSize;

	progress = 50;
	isProgressing = false;

	get computedLabel() {
		return this.isProgressing ? 'Stop Execution' : 'Launch ' + this.className;
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
				if (this.data) {
					console.log(this.data);
				}
			})
				.catch(error => {
					console.log(error);
				});

			//TODO REMOVE test
			// start
			this.isProgressing = true;
			// eslint-disable-next-line @lwc/lwc/no-async-operation
			this._interval = setInterval(() => {
				this.progress = this.progress === 100 ? 0 : this.progress + 1;
			}, 200);
		}
	}

	disconnectedCallback() {
		// it's needed for the case the component gets disconnected
		// and the progress is being increased
		// this code doesn't show in the example
		clearInterval(this._interval);
	}
}