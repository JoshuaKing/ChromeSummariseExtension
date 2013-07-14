self.addEventListener('message', function(e) {
	self.postMessage("Bye from worker!");
	//self.close();
	//self.postMessage(new Summariser());
}, false);