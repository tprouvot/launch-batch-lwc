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
	public static AsyncApexJob getBatchJobStatus(String jobIdOrClassName){
		List<AsyncApexJob> jobs;
		String query = 'SELECT Status, NumberOfErrors, JobItemsProcessed, TotalJobItems	FROM AsyncApexJob WHERE ';
		Id jobId;
		try {
			jobId = Id.valueOf(jobIdOrClassName);
			query += ' Id =:jobId';
		} catch (Exception e) {
			query += ' ApexClass.Name =:jobIdOrClassName ORDER BY CreatedDate DESC LIMIT 1';
		} finally {
			jobs = (List<AsyncApexJob>)Database.query(query);
		}
		return jobs.isEmpty() ? null : jobs.get(0);
	}
}