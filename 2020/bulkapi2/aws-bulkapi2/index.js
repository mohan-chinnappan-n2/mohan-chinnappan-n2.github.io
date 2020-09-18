//------------------------------------------------------------------
// Code for the aws lambda function using Salesforce BulkAPI 2.0
// Mohan Chinnappan (mar-21-2020)
//------------------------------------------------------------------

const sfb2 = require('sfbulk2js'); 
const  fs = require('fs');

const AT = '00D3h000007R1Lu!AR0AQGyDeGEGhToyawRbG9rrc006T6.3Gi7V5JEU6X88ED7io7IUtzYDjhaLuQLQ_Ylp2TKux560e6rGzbQ8vAP7zd_hsYpy'; // can be read from env
const opts = {
     instanceUrl: 'https://mohansun-ea-02-dev-ed.my.salesforce.com', // can be read from env
     apiVersion: 'v49.0',
     accessToken: `${AT}`,
     contentType: 'CSV',
     lineEnding: 'LF'
};

const waitTimeMs = 5000;

exports.handler = async (event) => {

// TODO: read the s3 bucket data here (max size: 150 MB)  into fdata
let fdata = 
` Subject,Priority
Engine cylinder has knocking,High
Wiper Blade needs replacement,Low
`;

    await dataload(fdata, 'Case', opts);
    return { statusCode: 200, body: "Ok"};
};

doDataload = async () => {

// TODO: read the s3 bucket data here (max size: 150 MB)  into fdata
let fdata = 
` Subject,Priority
Engine cylinder has knocking,High
Wiper Blade needs replacement,Low
`;

    await dataload(fdata, 'Case', opts);
    return { statusCode: 200, body: "Ok"};
};

// test run, comment it while moving it to lambda
//doDataload();


function sleep(ms) {
  //console.log('WAITING');
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dataload(fdata, sobj, cji) {
 try {

     console.log(`=== CREATE JOB === `);
     const job = await sfb2.createJob(cji.instanceUrl, cji.apiVersion, cji.accessToken, 'insert', sobj, cji.contentType,  cji.lineEnding );
     console.log(job);
     console.log(`jobId: ${job.id}`);

     console.log(`=== JOB STATUS === `);
     let jobStatus = await sfb2.getJobStatus(cji.instanceUrl, cji.apiVersion, cji.accessToken, 'ingest', job.id );
     console.log(`=== JOB STATUS for job: ${job.id} ===`);
     console.log(jobStatus);


     console.log(`=== PUT DATA === `);

     const putDataStatus  = await sfb2.putData(cji.instanceUrl, cji.accessToken, job.contentUrl, fdata );

     console.log(`=== JOB STATUS === `);
     jobStatus = await sfb2.getJobStatus(cji.instanceUrl, cji.apiVersion, cji.accessToken, 'ingest', job.id );
     console.log(`=== JOB STATUS for job: ${job.id} ===`);
     console.log(jobStatus);

     console.log(`=== PATCH STATAE === `);
     const patchDataStatus  = await sfb2.patchState(cji.instanceUrl, cji.apiVersion, cji.accessToken,  job.id, 'UploadComplete' );
     console.log(patchDataStatus);

     console.log(`=== JOB STATUS === `);
     jobStatus = await sfb2.getJobStatus(cji.instanceUrl, cji.apiVersion, cji.accessToken, 'ingest', job.id );
     console.log(`=== JOB STATUS for job: ${job.id} ===`);
     console.log(jobStatus);

     while (jobStatus.state === 'InProgress') { // wait for it 
        await sleep(waitTimeMs);
        jobStatus = await sfb2.getJobStatus(cji.instanceUrl, cji.apiVersion, cji.accessToken, 'ingest', job.id );
        console.log(jobStatus);
     }

     console.log(`=== JOB Failure STATUS === `);
     jobStatus = await sfb2.getJobFailureStatus(cji.instanceUrl, cji.apiVersion, cji.accessToken,  job.id );
     console.log(`=== JOB Failure STATUS for job: ${job.id} ===`);
     console.log(jobStatus);

     console.log(`=== JOB getUnprocessedRecords STATUS === `);
     jobStatus = await sfb2.getUnprocessedRecords(cji.instanceUrl, cji.apiVersion, cji.accessToken,  job.id );
     console.log(`=== JOB getUnprocessedRecords STATUS for job: ${job.id} ===`);
     console.log(jobStatus);



} catch (err) {
     console.log(`ERROR in dataload : ${err}`);
   }

}


