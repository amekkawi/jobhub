# jobhub #

Move your heavy work loads into fully managed child processes.

## Features ##

* Jobs are forked to run in child processes and terminate when they are complete.
* Actively running jobs are fully managed and tracked.
* Jobs can be optionally configured to:
    * Validate job params.
    * Quickly handle a job before a child process is forked.
    * Be unique, so only one instance of the job runs at a time.
    * Be unique by user-generated key, so only one runs per key at a time.
    * Send progress updates.
* Jobs that linger after success/failure are auto-terminated.
* Highly customizable using built-in middleware or by directly extending classes.

## API Docs and Examples ##

There are two forms of the API docs:

* [Normal API docs](docs/api/README.md) - Use this if you using jobhub as-is and not customizing/extending it's functionality.
* [Extended API docs](docs/api-protected/README.md) - Use this to also view `protected` classes and methods that you can use to customize/extend jobhub.

Examples are also available in the [examples](examples) dir.

## Quick Start ##

Install the library using NPM into your existing node project:

```
npm install jobhub
```

At a minimum you need to instantiate and start the [HubManager](docs/api/HubManager.md#HubManager), which we will add to a file named `index.js`.
The only required configuration for HubManager is the path to the file which defines your jobs.

```javascript
/* Contents of index.js */

// Import the HubManager from jobhub
var HubManager = require('jobhub').HubManager;

// Create a new instance of the HubManager, configured to load your jobs from jobs.js
var hub = new HubManager({
	jobsModulePath: require('path').resolve(__dirname, 'jobs.js')
});

// Startup the hub manager, which will import and register the jobs from jobsModulePath.
hub.start();
```

## Defining Jobs ##

Jobs are defined within the module specified by [jobsModulePath](docs/api/HubManagerOptions.md#HubManagerOptions#jobsModulePath), in this case its `jobs.js`. Let's create that file and define some jobs:

```javascript
/* Contents of jobs.js */

// The simplest form of a job is a function, which is executed in the child process.
exports['feed-gremlins'] = function(job) {
	var numberOfGremlins = job.params.numberOfGremlins;
	if (numberOfGremlins < 1) {
		job.resolve('No gremlins to feed, which is probably for the best.');
	}
	else {
		var hour = new Date().getHours();
		if (hour >= 0 && hour < 5) { // Assumes okay to feed after 6am
			job.reject(new Error('Never feed after midnight!'));
		}
		else {
			job.sendProgress({
				message: 'Feeding has begun!'
			});

			setTimeout(function() {
				job.sendProgress({
					message: 'Still feeding...'
				});
			}, 2500);

			// TODO: Yikes! What if it goes past midnight while we're feeding?

			setTimeout(function() {
				job.resolve({
					numberOfGremlins: numberOfGremlins,
					message: numberOfGremlins === 1
						? 'Fed the gremlin!'
						: 'Fed all ' + numberOfGremlins + ' gremlins! Wait, where did the other ones come from?'
				});
			}, 5000);
		}
	}
};

// If a job is an object, we can add additional configuration.
exports['get-gremlins-wet'] = {
	// For example, let's validate the params.
	// The validation is performed in both the parent and child process.
	validate: function(params, InvalidJobParamError) {
		if (params.numberOfGremlins === 0) {
			throw new InvalidJobParamError('No gremlins to get wet!');
		}
	},

	// At a minimum you must include a "run" function, which is executed in the child process.
	run: function(job) {
		job.resolve({
			message: job.params.numberOfGremlins === 1
				? 'Washed that dirty gremlin!'
				: 'Washed those dirty gremlins!',
			numberOfGremlins: job.params.numberOfGremlins * 2
		});
	}
};
```

## Queuing Jobs ##

We can test out our jobs by adding some more code to `index.js`:

```javascript
/* Add to the end of index.js */

// Queue a job to be run, which returns an object that lets us track the job.
var trackedJob = hub.queueJob('feed-gremlins', { numberOfGremlins: 1 });

// We can listen for events, such as when a progress message is received. 
trackedJob.on('jobProgress', function(progress) {
	console.log('[progress update]: ' + progress.message);
});

// TrackedJob instances include then/catch to be Promise-like
trackedJob
	.then(function(feedingResult) {
		console.log('[first feeding result] ' + feedingResult.message);
		return hub.queueJob('get-gremlins-wet', { numberOfGremlins: feedingResult.numberOfGremlins });
	})
	.then(function(washingResult) {
		console.log('[washing result] ' + washingResult.message);
		return hub.queueJob('feed-gremlins', { numberOfGremlins: washingResult.numberOfGremlins });
	})
	.then(function(feedingResult) {
		console.log('[second feeding result] ' + feedingResult.message);
	}, function(err) {
		console.error('Something went wrong: ' + err.stack);
	});
```

## Express.js Example ##

A common use case for jobhub is to use it with a HTTP server, such as [express.js](http://expressjs.com).
 
Since you do not want your heavy processing to be done in the same process as your express app, we can use jobhub
to run that processing in child processes.

First install express and jobhub.

```
npm install express jobhub
```

Second, create our express app in `index.js`:

```javascript
/* Contents of index.js */

var express = require('express');
var HubManager = require('jobhub').HubManager;

var hub = new HubManager({
	jobsModulePath: require('path').resolve(__dirname, 'jobs.js')
}).start();

// Listen to job lifecycle events.
hub.on('jobCreated', function(trackedJob) {
	console.log('[JOB CREATED] name:' + trackedJob.jobConfig.jobName + ' id:' + trackedJob.jobId);
}).on('jobSuccess', function(trackedJob, result) {
	console.log('[JOB SUCCESS] name:' + trackedJob.jobConfig.jobName + ' id:' + trackedJob.jobId + ' result:' + JSON.stringify(result));
}).on('jobFailure', function(trackedJob, err) {
	console.log('[JOB FAILURE] name:' + trackedJob.jobConfig.jobName + ' id:' + trackedJob.jobId + ' err:' + err.stack);
});

var app = express();

app.get('/is-big-daily-load-running', function(req, res) {
	res.json({
		isRunning: !!hub.findUniqueTrackedJob('big-daily-data-load')
	});
});

app.get('/big-daily-data-load', function(req, res) {
	var trackedJob = hub.queueJob('big-daily-data-load');

	// Since this job is flagged as "unique", repeated attempts to queue
	// this job will return the same TrackedJob instance, allowing all
	// of the requests to wait on the same job.
	console.log('[Load request] jobId:' + trackedJob.jobId);

	trackedJob.then(function(result) {
		res.json(result);
	}).catch(function(err) {
		res.json({
			error: err.message,
			stack: err.stack
		});
	});
});

app.on('error', function(err) {
	console.error('Failed to listen to port 3000: ' + err.message);
}).listen(3000, function() {
	console.log('Listening on port 3000!');
});
```

Finally, create the jobs in `jobs.js`:

```javascript
/* Contents of jobs.js */

exports['big-daily-data-load'] = {
	// Make sure only one instance runs at a time.
	unique: true,

	run: function(job) {
		setTimeout(function() {
			job.resolve({
				recordsLoaded: 5000000
			});
		}, 15000);
	}
};
```

Start the server using:

```
node index.js
```
 
We can test the routes using a few HTTP calls. Create a file with the following contents named `client.js`:

```javascript
/* Contents of client.js */

var http = require('http');

fetch('http://localhost:3000/is-big-daily-load-running', function(err, body) {
	if (err) console.log('[isRunning failed] ' + err.message);
	else console.log('[isRunning success] ' + body);
});

fetch('http://localhost:3000/big-daily-data-load', function(err, body) {
	if (err) console.log('[dataLoad failed] ' + err.message);
	else console.log('[dataLoad success] ' + body);
});

fetch('http://localhost:3000/is-big-daily-load-running', function(err, body) {
	if (err) console.log('[isRunning failed] ' + err.message);
	else console.log('[isRunning success] ' + body);
});

fetch('http://localhost:3000/big-daily-data-load', function(err, body) {
	if (err) console.log('[dataLoad failed] ' + err.message);
	else console.log('[dataLoad success] ' + body);
});

function fetch(url, cb) {
	http.get(url, function(res) {
		readData(res, cb);
	}).on('error', cb);
}

function readData(stream, cb) {
	var body = '';
	stream.on('data', function(d) {
		body += d;
	}).on('end', function() {
		cb(null, body);
	}).on('error', cb);
}
```

Then run the tests on the command line:

```
node client.js
```

## Job Config ##

Configuration for a job.

A job can be defined in two ways:

1. Just a function, which is the code that will run in the child process.
2. An object that has at a minimum of a [JobConfig#run](docs/api/JobConfig.md#JobConfig+run) function, which is the code that will run in the child process.

<a name="JobConfig+unique"></a>

### jobConfig.unique : <code>boolean</code>
Optional. Set to `true` to only allow one instance of the job to run at a time.
Attempts to queue the job while one is still running will return the [TrackedJob](docs/api/TrackedJob.md#TrackedJob) instance of the already running job.
This option is ignored if [JobConfig#uniqueKey](docs/api/JobConfig.md#JobConfig+uniqueKey) is set.

**Default**: <code>false</code>  
<a name="JobConfig+meta"></a>

### jobConfig.meta : <code>object</code>
User-defined data that can be stored with the JobConfig.

**Default**: <code>{}</code>  
<a name="JobConfig+jobName"></a>

### jobConfig.jobName : <code>string</code>
Set by jobhub after the job config is registered with a [JobConfigStore](docs/api/JobConfigStore.md#JobConfigStore).

<a name="JobConfig+run"></a>

### jobConfig.run(job)
Required. This function will be executed in the child process to run the job.


| Param | Type |
| --- | --- |
| job | <code>[JobRunArg](docs/api/JobRunArg.md#JobRunArg)</code> | 

<a name="JobConfig+uniqueKey"></a>

### jobConfig.uniqueKey(params) ⇒ <code>void</code> &#124; <code>null</code> &#124; <code>String</code>
Optional. Provides a unique key used to only allow one instance of the job to run at a time for that key.

The unique key returned must be a string, but the function can also return null/undefined to allow that job to run
without being unique. This function runs in the same process the [HubManager](docs/api/HubManager.md#HubManager) is started in.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>\*</code> | Value provided to [HubManager#queueJob](docs/api/HubManager.md#HubManager+queueJob). |

<a name="JobConfig+validate"></a>

### jobConfig.validate(params, InvalidJobParamError) ⇒ <code>void</code> &#124; <code>Promise</code>
Optional. Validates the params value provided to [HubManager#queueJob](docs/api/HubManager.md#HubManager+queueJob).
The function will receive two arguments, the params value provided to [HubManager#queueJob](docs/api/HubManager.md#HubManager+queueJob) and the
[InvalidJobParamError](docs/api/InvalidJobParamError.md#InvalidJobParamError) constructor. The function should throw an Error
(preferably [InvalidJobParamError](docs/api/InvalidJobParamError.md#InvalidJobParamError)) if the params are invalid. The function can return a
Promise to validate the params asynchronously.

**Throws**:

- <code>Error</code><code>[InvalidJobParamError](docs/api/InvalidJobParamError.md#InvalidJobParamError)</code> 


| Param | Type | Description |
| --- | --- | --- |
| params | <code>\*</code> |  |
| InvalidJobParamError | <code>[InvalidJobParamError](docs/api/InvalidJobParamError.md#InvalidJobParamError)</code> | Error constructor that should be used to throw validation errors. |

<a name="JobConfig+onCreate"></a>

### jobConfig.onCreate(trackedJob)
Called when a job for this config is created, similar to the [HubManager#event:jobCreated](docs/api/HubManager.md#HubManager+event_jobCreated) event.

**See**: [HubManager#queueJob](docs/api/HubManager.md#HubManager+queueJob)  

| Param | Type |
| --- | --- |
| trackedJob | <code>[TrackedJob](docs/api/TrackedJob.md#TrackedJob)</code> | 

<a name="JobConfig+quickRun"></a>

### jobConfig.quickRun(job, next)
Optional. This function will be executed in the [HubManager](docs/api/HubManager.md#HubManager) process to optionally allow a job
to be quickly resolved/rejected without starting a child process.


| Param | Type | Description |
| --- | --- | --- |
| job | <code>[JobRunArg](docs/api/JobRunArg.md#JobRunArg)</code> |  |
| next | <code>function</code> | Call to skip "quickRun", continuing to "run" the worker. |


## Job Run Arg ##

Passed to [JobConfig#run](docs/api/JobConfig.md#JobConfig+run) and [JobConfig#quickRun](docs/api/JobConfig.md#JobConfig+quickRun)
to provide information about the job and facilitate communicate progress/success/failure.

<a name="JobRunArg+jobId"></a>

### jobRunArg.jobId : <code>string</code>
The unique identifier for the job.

<a name="JobRunArg+params"></a>

### jobRunArg.params : <code>\*</code>
The params passed to [HubManager#queueJob](docs/api/HubManager.md#HubManager+queueJob).

<a name="JobRunArg+resolve"></a>

### jobRunArg.resolve(result)
Call to resolve the job.

**See**

- [TrackedJob#event:jobSuccess](docs/api/TrackedJob.md#TrackedJob+event_jobSuccess)
- [HubManager#event:jobSuccess](HubManager#event:jobSuccess)


| Param | Type |
| --- | --- |
| result | <code>\*</code> | 

<a name="JobRunArg+reject"></a>

### jobRunArg.reject(error)
Call to reject the job.

**See**

- [TrackedJob#event:jobFailure](docs/api/TrackedJob.md#TrackedJob+event_jobFailure)
- [HubManager#event:jobFailure](HubManager#event:jobFailure)


| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JobRunArg+sendProgress"></a>

### jobRunArg.sendProgress(progress) ⇒ <code>Promise</code>
Send progress data.

**Returns**: <code>Promise</code> - Resolves once the progress is sent, and rejects if there was an error sending the progress.  
**See**

- [TrackedJob#event:jobProgress](docs/api/TrackedJob.md#TrackedJob+event_jobProgress)
- [HubManager#event:jobProgress](HubManager#event:jobProgress)


| Param | Type |
| --- | --- |
| progress | <code>\*</code> | 


## Change Log ##

See [CHANGELOG.md](CHANGELOG.md)

## License ##

The MIT License (MIT)

Copyright (c) 2016 Andre Mekkawi &lt;github@andremekkawi.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
