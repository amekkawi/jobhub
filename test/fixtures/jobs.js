exports.resolvesTo500 = {
	run: function(job) {
		job.resolve(500);
	}
};

exports.noGracefulExit = {
	run: function(job) {
		job.resolve(600);

		process.on('SIGTERM', function() {
			// Ignore SIGTERM
		});

		// Add timeout to prevent graceful exit
		setTimeout(function() {}, 60000)
	}
};
