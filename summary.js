var domain = "";
var url = "";
var variables = {};
var done = 0;
var numParts = 0;

chrome.runtime.sendMessage({type: "getUrl"}, function(response) {
	domain = document.domain;
	url = response.url;
	
	done++;
	if (done >= 2) start();
});

chrome.runtime.sendMessage({type: "getVariables"}, function(response) {
	variables = response;
	done++;
	if (done >= 2) start();
});

function start() {
	if (domain.match(/reddit\.com$/) != null) {
		// Site is reddit do scan //
		redditScan();
	}
	
	scanConvert();
}

function Conversion() {}
Conversion.feetToMeters = function(f) {
	return f * 0.3048;
}

Conversion.milesToKm = function(f) {
	return f * 1.609344;
}
Conversion.poundsToGrams = function(f) {
    return f * 453.592;
}

function scanConvert() {
	if (variables.stats) {
		parsePage();
	}
	
	if (variables.imperial) {
        convertImperialLength();
        convertImperialMiles();
        convertImperialWeight();
    }
}

function parsePage() {
	var tree;
	var paragraphs = $.makeArray($("p"));
	
	this.createTree = function(response) {
		this.tree = response.value;
		if (paragraphs.length == 0) { /*console.log(this.tree); */return;}
		
		var p = $(paragraphs.shift()).text();
		chrome.runtime.sendMessage({
			type: "parsePart",
			value: p,
			tree: this.tree
		}, this.createTree);
	}
	
	this.createTree({value: {}});
}

function buildPage(response) {
	console.log("Build another part of page: " + response);
}

function convertHtml(text, input, result, from, to) {
	var origStartHtml = "<u class='conversion-original'>"
	var origEndHtml = "</u>"
	
	var beforeHtml = "<u class='conversion'>";
	var midHtml = "<u class='math'>";
	var endHtml = "</u></u>";
	
	var left = text.substring(0, from);
	var mid = text.substring(from, to);
	var right = text.substring(to);
	
	var conversion = left + origStartHtml + input + origEndHtml;
	conversion += beforeHtml + mid + midHtml + result + endHtml;
	conversion += right;
	
	var len = origStartHtml.length + origEndHtml.length + input.length;
	len += beforeHtml.length + midHtml.length + endHtml.length + result.length;
	
	return {text: conversion, length: len};
}


function convertImperialWeight() {
	var impLength = new RegExp(/(\d+)[ -]?(?:pounds?|lbs?),? (\d+)[ -]?(?:ounces?|oz)(?![ s]*\()|(?:(\d+[\d,]+)[ ]?(?:lbs?))(?![ s]*\()|(?:(\d+)[ -]?(?:oz|ounces?))(?![ s]*\()/ig);
	var impLength = new RegExp(/(\d+)[ ]?(?:pounds?|lbs?),? (\d+)[ ]?(?:ounces?\b|oz)(?![ ]?\()|(\d+[\d,]*)[ ]?(?:lbs?\b)(?![ ]?\()|(\d+(?:\.\d+)?)[ ]?(?:oz|ounces?\b)(?![ ]?\()/ig);
	
	$("body *").contents().filter(function() {
		return this.nodeType == 3 && $(this).parents("h1,h2,h3,header,script,a,style").length == 0;
	}).each(function() {
		var original = $(this).text();
		var text = original;
		while (match = impLength.exec(text)) {
			var m = 0.0;
            if (match[4]) {
				m = parseFloat(match[4]) / 16;
            } else if (match[3]) {
                m = parseFloat(match[3].replace(",", "")); 
            } else {
                m = parseFloat(match[1].replace(",", "")); 
				m += parseFloat(match[2]) / 16;
            }

            m = Conversion.poundsToGrams(m);
			var math = (m < 500) ? "~" : "";
            if (m < 1000) math += Math.ceil(m) + "g";
            else  math += Math.ceil(m / 100) / 10 + "kg";

			var result = convertHtml(text, match[0], math, match.index, impLength.lastIndex);
			text = result.text;
			
			impLength.lastIndex += result.length;
		}
		
		if (text != original) {
			$(this).parent().html(text).find(".conversion").mouseenter(function(obj) {
				$(obj.target).prepend("<u class='conversionoffcontainer'>&nbsp;</u><u class='conversionoff'><u class='sum-button'>Turn Off</u></u>");
				$(".sum-button").click(turnOffConversion);
			}).mouseleave(function(obj){
				$(".conversionoffcontainer,.conversionoff").remove();
			});
		}
	});
}

function convertImperialMiles() {
	var impLength = new RegExp(/([1-9](?:\d{0,2})(?:,?\d{3})*(?:\.\d*[1-9])?|0?\.\d*[1-9])[ ]?(?:miles?)(?![ s]*\()/ig);
	
	$("body *").contents().filter(function() {
		return this.nodeType == 3 && $(this).parents("h1,h2,h3,header,script,a,style").length == 0;
	}).each(function() {
		var original = $(this).text();
		var text = original;
		while (match = impLength.exec(text)) {
			var m = Conversion.milesToKm(match[1].replace(",", ""));
			var math = Math.ceil(m * 10) / 10 + "km";
            if (m > 20) math = Math.ceil(m) + "km";

			var result = convertHtml(text, match[0], math, match.index, impLength.lastIndex);
			text = result.text;
			
			impLength.lastIndex += result.length;
		}
		
		if (text != original) {
			$(this).parent().html(text).find(".conversion").mouseenter(function(obj) {
				$(obj.target).prepend("<u class='conversionoffcontainer'>&nbsp;</u><u class='conversionoff'><u class='sum-button'>Turn Off</u></u>");
				$(".sum-button").click(turnOffConversion);
			}).mouseleave(function(obj){
				$(".conversionoffcontainer,.conversionoff").remove();
			});
		}
	});
}

function convertImperialLength() {
	var impLength = new RegExp(/([1-9](?:\d{0,2})(?:,\d{3})*(?:\.\d*[1-9])?|0?\.\d*[1-9])[ ]?(?:feet|ft|foot) (?:(\d+)[ ]?(?:inch|in))?(?![ ]?\()|(?:(\d+)[ ]?(?:inch))(?![ ]?\()/ig);
	
	$("body *").contents().filter(function() {
		return this.nodeType == 3 && $(this).parents("h1,h2,h3,header,script,a,style").length == 0;
	}).each(function() {
		var original = $(this).text();
		var text = original;
		while (match = impLength.exec(text)) {
			//if (match.length != 2) continue;
			var f = 0;
			if (match[3]) {	// Y Inches
				f = match[3]/12;
			} else if (match[2]) {	// X Feet Y Inches
				f = parseFloat(match[1].replace(",", ""));
				f += match[2]/12;
			} else {	// Just X Feet
				f = parseFloat(match[1].replace(",", ""));
			}
			var m = Conversion.feetToMeters(f);
			var math = (m > 10 ? "" : "~")
			if (m < 1.5)
				math += Math.ceil(m * 100) + "cm";
			else if (m > 1500)
				math += (Math.ceil(m/100)/10) + "km";
			else
				math += Math.ceil(m) + "m";
				
			var result = convertHtml(text, match[0], math, match.index, impLength.lastIndex);
			text = result.text;
			
			impLength.lastIndex += result.length;
		}
		
		if (text != original) {
			$(this).parent().html(text).find(".conversion").mouseenter(function(obj) {
				$(obj.target).prepend("<u class='conversionoffcontainer'>&nbsp;</u><u class='conversionoff'><u class='sum-button'>Turn Off</u></u>");
				$(".sum-button").click(turnOffConversion);
			}).mouseleave(function(obj){
				$(".conversionoffcontainer,.conversionoff").remove();
			});
		}
	});
}

function turnOffConversion() {
	chrome.runtime.sendMessage({type: "setVar", key: "imperial", value:false});
	$(".conversion-original").show();
	$(".conversion").remove();
	chrome.runtime.sendMessage({type: "getVariables"});
}

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
	return summary.getSummary(text, variables.percent, variables.min, variables.max, true);
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
