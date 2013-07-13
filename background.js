chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.type == "getUrl") {
			sendResponse({url: sender.tab.url});
		} else if (request.type == "setVariables") {
			localStorage["variables"] = JSON.stringify(request.values);
		} else if (request.type == "getVariables") {
			if (!localStorage["variables"] || localStorage["variables"] == "undefined") {
				localStorage["variables"] = JSON.stringify({
					percent: 0.3,
					max: 6,
					min: 3,
					imperial: true,
					stats: true
				});
			}
			var variables = JSON.parse(localStorage["variables"]);
			
			/* For new variables */
			if (variables.imperial == "undefined") variables.imperial = true;
			if (variables.stats == "undefined") variables.stats = true;
			
			sendResponse(variables);
		} else if (request.type == "setVar") {
			var variables = JSON.parse(localStorage["variables"]);
			variables[request.key] = request.value;
			localStorage["variables"] = JSON.stringify(variables);
		} else if (request.type == "getWorker") {
			createWorker(request.value, request.callback);
		}
	}
);

chrome.contextMenus.create({
	"title": "Summarise Selected",
	"contexts":["selection"],
	"id": "summarize",
	"onclick": summariseSelected
});

function summariseSelected(info, tab) {
	chrome.tabs.sendMessage(tab.id, {
		"type": "summariseSelected",
		"selectedText": info.selectionText
	});
}


function createWorker(val, callback) {
	var worker = new Worker(chrome.extension.getURL("parse.js"));
	worker.addEventListener('message', callback, false);
	worker.postMessage(val);
}