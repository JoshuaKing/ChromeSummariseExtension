var domain = "";
var url = "";

chrome.runtime.sendMessage({type: "getUrl"}, function(response) {
	domain = document.domain;
	url = response.url;
	console.log("domain: " + domain);
	console.log("url: " + url);
	
	if (domain.match(/reddit.com/) != null) {
		// Site is reddit do scan //
		redditScan();
	}
});

function redditScan() {
	if (url.match(/reddit.com\/.*\/comments/) == null) {
		console.log("not reddit comments");
		return;	// Not comments section
	}
	
	console.log("reddit comments: " + $("div.usertext-body>.md").length);
	$("div.usertext-body .md").each(function() {
		text = this.innerHTML;
		if (text.length < 1000) return;	// Not long enough
		
		var summary = new Summariser();
		summary.setString(text);
		summary.remove_brackets();
		numsentences = summary.s_split();
		summarylen = Math.max(2, Math.min(Math.floor(numsentences * 0.2), 5));
		summary.summarise(summarylen);
		console.log("Cutting it down: " + numsentences + " vs " + summarylen + "\n\n" + text + "\nsummary:\n" + summary.response);
		
		pre = "<div class='summarize-summary .reddit'><div class='summarize-content'>";
		
		var tldr = getTlDr(text);
		if (tldr != "") {
			pre += "<div class='summarize-tldr'><div class='summarize-heading'>User tl;dr<div class='summarize-hide'>hide</div></div>" + tldr + "</div><div class='summarize-heading'>Summary</div><div class='summarize-content'>";
		} else {
			pre += "<div class='summarize-heading'>Summary<div class='summarize-hide'>hide</div></div><div class='summarize-content'>"
		}
		
		$(this).parent().prepend(pre + summary.response + "</div></div>");
		
		$(".summarize-summary .hide").click(function() {
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