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
	public static void abortBatchJob(Id jobId){
		System.abortJob(jobId);
	}

	@AuraEnabled
	public static AsyncApexJob getLatestBatchJobStatus(String className){
		return [SELECT Status, NumberOfErrors, JobItemsProcessed, TotalJobItems
			FROM AsyncApexJob WHERE ApexClass.Name =:className ORDER BY CreatedDate DESC LIMIT 1];
	}

	@AuraEnabled
	public static AsyncApexJob getBatchJobStatus(String jobIdOrClassName){
		AsyncApexJob job;
		String query = 'SELECT Status, NumberOfErrors, JobItemsProcessed, TotalJobItems	FROM AsyncApexJob WHERE ';
		Id jobId;
		try {
			jobId = Id.valueOf(jobIdOrClassName);
			query += ' Id =:jobId';
		} catch (Exception e) {
			query += ' ApexClass.Name =:jobIdOrClassName ORDER BY CreatedDate DESC LIMIT 1';
		} finally {
			System.debug(LoggingLevel.INFO, 'query ' + query);
			job = (AsyncApexJob)Database.query(query);
		}
		return job;
	}
}
