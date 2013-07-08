var domain = "";
var url = "";
var percent = 0.3;
var min = 3;
var max = 6;

chrome.runtime.sendMessage({type: "getUrl"}, function(response) {
	domain = document.domain;
	url = response.url;
	
	if (domain.match(/reddit.com$/) != null) {
		// Site is reddit do scan //
		redditScan();
	}
});

chrome.runtime.sendMessage({type: "getVariables"}, function(response) {
	if (!response) return;
	percent = response.percent;
	max = response.max;
	min = response.min;
});

function updateHide() {
	$(".summarize-hide").click(function() {
		$(this).parents(".summarize").hide();
	});
}

function getSummaryDiv(includeHeading, summary, originalText) {
	var percentage = Math.floor((summary.length / originalText.length) * 100);
	var div = "<div class='summarize'>";
	div += "<div class='summarize-summary'>";
	div += "<div class='summarize-heading'>Summary (" + percentage + "%)</div>";
	div += "<div class='summarize-content'></div>";
	div += "</div></div></div>";
	
	div = $(div);
	if (includeHeading) {
		div.find(".summarize-heading").append("<div class='summarize-hide'>Hide</div>");
	}
	
	summary = summary.replace(/[<]\/?br\/?[>]/g, "[br]");
	div.find(".summarize-content").html(document.createTextNode(summary));
	var onlybr = div.find(".summarize-content").text().replace(/\[br\]/g, "<br>");
	div.find(".summarize-content").html(onlybr);
	
	return div;
}

function getTlDrDiv(tldr) {
	var div = "<div class='summarize-tldr'>";
	div += "<div class='summarize-heading'>User tl;dr";
	div += "<div class='summarize-hide'>hide</div></div>";
	div += "<div class='summarize-user-tldr'></div>";
	div += "</div>";
	
	div = $(div);
	tldr = tldr.replace(/[<]\/?br\/?[>]/g, "[br]");
	div.find(".summarize-user-tldr").html(document.createTextNode(tldr));
	var onlybr = div.find(".summarize-user-tldr").text().replace(/\[br\]/g, "<br>");
	div.find(".summarize-user-tldr").html(onlybr);
	
	return div;
}

function genSummary(text) {
	var summary = new Summariser();	
	return summary.getSummary(text, percent, min, max, true);
}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
	if (request.type == "summariseSelected") {
		var text = request.selectedText;
		var summary = genSummary(text);

		if (url.search(/.pdf$/) >= 0) {
			$(".summarize-pdf").remove();
			summaryDiv = getSummaryDiv(true, summary, text);
			$("body").prepend($("<div class='summarize-pdf'></div>").html(summaryDiv));
			$(".summarize-hide").click(function() {
				$(".summarize-pdf").remove();
			});
			return;
		}
		
		var el = window.getSelection().getRangeAt(0).startContainer;		
		$(el).parent().prepend(getSummaryDiv(false, summary, text));
		updateHide();
	}
});

function redditScan() {
	if (url.match(/reddit.com\/.*\/comments/) == null) {
		return;	// Not comments section
	}
	
	$(".commentarea div.usertext-body .md, .expando div.usertext-body .md").each(function() {
		text = this.innerHTML;
		if (text.length < 1000) return;	// Not long enough
		
		var summary = genSummary(text);
		var tldr = getTlDr(text);
		
		var summaryDiv = getSummaryDiv((tldr == ""), summary, text);
		
		if (tldr != "") {
			var tldrDiv = getTlDrDiv(tldr);
			summaryDiv.find(".summarize-summary").prepend(tldrDiv);
		}
		
		
		$(this).parent().prepend(summaryDiv);
	});
	
	updateHide();
}

function getTlDr(text) {
	if (text.search(/tl;?dr/i) < 0) return "";
	var tldr = "";
	text = text.replace(/<[^>]+(>|$)/g, "");
	text = text.replace(/[<>]/g, "");
	
	if (text.search(/.*tl;?dr/i) < text.length / 2) {
		return tldr = text.match(/.*?(tl;?dr\b(?:[^.!?]+[.!?\b]))/i)[0];
	}
	tldr = text.match(/.*(tl;?dr\b(?:[^.!?]+[.!?\b]){1,5})/i)[0];
	
	var edit = tldr.search(/edit:/i);
	if (edit >= 0) {
		tldr = tldr.substr(0, edit);
	}
	return tldr;
}