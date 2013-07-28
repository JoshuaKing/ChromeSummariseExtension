var parses = new Array();

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.type == "getUrl") {
            if (typeof sender.url != "undefined")
			    sendResponse({url: sender.tab.url});
            else
                sendResponse({url: "unavailable"});
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
			if (typeof variables.imperial == "undefined") variables.imperial = true;
			if (typeof variables.stats == "undefined") variables.stats = true;
			localStorage["variables"] = JSON.stringify(variables);
			
			sendResponse(variables);
		} else if (request.type == "setVar") {
			var variables = JSON.parse(localStorage["variables"]);
			variables[request.key] = request.value;
			localStorage["variables"] = JSON.stringify(variables);
		} else if (request.type == "parsePart") {
			var response = parsePart(request.value, request.list);
			sendResponse(response);
		} else if (request.type == "submitParse") {
			parses.push(request.value);
			if (parses.length % 10 != 0) return;
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "http://cub.freshte.ch/stats.php");
			xhr.onload = xhrFinished;
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.send("stats=" + JSON.stringify(parses));
		}
	}
);

function xhrFinished(resp) {
	var xhr = resp.currentTarget;
    if (xhr.status == 200) {
       parses = new Array(); 
    } else {
        if (parses.length >= 30) parses = new Array();
    }
}

chrome.contextMenus.create({
	"title": "Summarise Selected",
	"contexts":["selection"],
	"id": "summarize",
	"onclick": summariseSelected
});

function parsePart(paragraph, addToList) {
	var summariser = new Summariser();
	summariser.setString(paragraph);
	summariser.tokenize();
	var structure = summariser.sentence_tokenize();
	/**
    var s = parseStructure(structure, addToTree);
    /*/
    var s = summariser.count_words(structure, addToList);
    /**/
	return {value: s};
}

function parseStructure(structure, tree) {
	var ss = structure.getStructure();
	/*for (var i = 0; i < ss.length; i++) {
		var t = ss[i].value;
		if (ss[i].token == SenSym.TOKEN) {
			if (t.token == Tok.WORD) {
				var word = t.value;				
				//console.log(word);
				
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
	*/
	return tree;
}

function summariseSelected(info, tab) {
	chrome.tabs.sendMessage(tab.id, {
		"type": "summariseSelected",
		"selectedText": info.selectionText
	});
}
