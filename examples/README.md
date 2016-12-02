# jobhub examples #

## Running examples

Each example can be run by specifying the individual example directories as the node entry point.

For example: `node examples/simple`

## Example directories

* `simple` - A simple usage of jobhub
* `unique` - Demonstrates the "unique" and "uniqueKey" job config props
* `cached-result` - Caches the result of a potentially heavy weight job so future jobs will run using quickRun instead
* `abort-jobs` - Aborts jobs at various stages of a job, and allows the worker process to hand
* `throttled` - Queues 10 jobs but throttles the jobs to only run 2 concurrently.
