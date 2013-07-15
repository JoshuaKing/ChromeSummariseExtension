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
		} else if (request.type == "parsePart") {
			var response = parsePart(request.value, request.tree);
			sendResponse(response);
		}
	}
);

chrome.contextMenus.create({
	"title": "Summarise Selected",
	"contexts":["selection"],
	"id": "summarize",
	"onclick": summariseSelected
});

function parsePart(paragraph, addToTree) {
	var summariser = new Summariser();
	summariser.setString(paragraph);
	summariser.tokenize();
	var structure = summariser.sentence_tokenize();
	var s = parseStructure(structure, addToTree);
	return {value: s};
}

function parseStructure(structure, tree) {
	var ss = structure.getStructure();
	for (var i = 0; i < ss.length; i++) {
		var t = ss[i].value;
		if (ss[i].token == SenSym.TOKEN) {
			if (t.token == Tok.WORD) {
				var word = t.value;				
				console.log(word);
				
				var point = tree;
				for (var j = 0; j < word.length; j++) {
					var c = word.charAt(j);
					if (typeof point[c] == 'undefined') {
						point[c] = {total: 0, sum: 0, finish: 0};
					}
					point = point[word.charAt(j)];
					point.sum++;
				}
				point.total++;
				
				if (i + 2 < ss.length && ss[i + 2].token == SenSym.TOKEN && ss[i + 2].value.token == Tok.EOL) {
					point.finish++;
				}
			}
		} else if (ss[i].token == SenSym.BRACKETQUOTE || ss[i].token == SenSym.QUOTATION) {
			tree = parseStructure(t, tree);
		}
	}
		
	return tree;
}

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