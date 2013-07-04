var domain = "";
var url = "";

chrome.runtime.sendMessage({type: "getUrl"}, function(response) {
	domain = document.domain;
	url = response.url;
	console.log("domain: " + domain);
	console.log("url: " + url);
	
	if (domain.match(/reddit.com$/) != null) {
		// Site is reddit do scan //
		redditScan();
	}
});

function getSummary(text) {
	var summary = new Summariser();
	summary.setString(text);
	summary.remove_brackets();
	numsentences = summary.s_split();
	summarylen = Math.max(3, Math.min(Math.floor(numsentences * 0.3), 6));
	return summary.summarise(summarylen);
}

function getSummaryDiv(includeHeading, summary, originalText) {
	var percentage = Math.floor((summary.length / originalText.length) * 100);
	var div = "<div class='summarize-summary'>";
	div += "<div class='summarize-heading'>Summary (" + percentage + "%)</div>";
	div += "<div class='summarize-content'></div>";
	div += "</div></div>";
	
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

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
	if (request.type == "summariseSelected") {
		var text = request.selectedText;
		var summary = getSummary(text);

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
	}
});

function redditScan() {
	if (url.match(/reddit.com\/.*\/comments/) == null) {
		console.log("not reddit comments");
		return;	// Not comments section
	}
	
	console.log("reddit comments: " + $("div.usertext-body>.md").length);
	$(".commentarea div.usertext-body .md").each(function() {
		text = this.innerHTML;
		if (text.length < 1000) return;	// Not long enough
		
		var summary = new Summariser();
		summary.setString(text);
		summary.remove_brackets();
		numsentences = summary.s_split();
		summarylen = Math.max(3, Math.min(Math.floor(numsentences * 0.2), 5));
		summary.summarise(summarylen);
		
		pre = "<div class='summarize-summary .reddit'>";
		
		var tldr = getTlDr(text);
		if (tldr != "") {
			pre += "<div class='summarize-tldr'><div class='summarize-heading'>User tl;dr<div class='summarize-hide'>hide</div></div>" + tldr + "</div><div class='summarize-heading'>Summary</div><div class='summarize-content'>";
		} else {
			pre += "<div class='summarize-heading'>Summary (";
			pre += Math.floor(summary.response.length / text.length * 100) + "%)";
			pre += "<div class='summarize-hide'>hide</div></div><div class='summarize-content'>"
		}
		
		$(this).parent().prepend(pre + summary.response + "</div></div>");
		
		$(".summarize-summary .summarize-hide").click(function() {
			$(this).parent(".summarize-summary").hide();
		});
	});
}

function getTlDr(text) {
	if (text.indexOf("tl;dr") < 0) return "";
	var tldr = "";
	text = text.replace(/<[^>]+(>|$)/g, "");
	
	if (text.lastIndexOf("tl;dr") < text.length / 2) {
		return tldr = text.replace(/[\s\S]*(tl;{0,1}dr\b(?:[^.!?]+[.!?\b]))/i, "$1");
	}
	tldr = text.replace(/[\s\S]*(tl;{0,1}dr\b(?:[^.!?]+[.!?\b]){1,5})/i, "$1");
	return tldr;
}