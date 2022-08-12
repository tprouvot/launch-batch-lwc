public with sharing class LaunchBatchController {

	@AuraEnabled
	public static Id executeBatchJob(String batchName, Integer scopeSize){

		Type typ = Type.forName(batchName);
		Object batchInstance = null;
		if (typ != null) {
			batchInstance = typ.newInstance();
		}
		return Database.executeBatch((Database.Batchable<sObject>)batchInstance, scopeSize);
	}

	@AuraEnabled
	public static AsyncApexJob getBatchJobStatus(Id jobId){
		return [SELECT Status, NumberOfErrors, JobItemsProcessed, TotalJobItems FROM AsyncApexJob WHERE Id = :jobId];
	}
}
