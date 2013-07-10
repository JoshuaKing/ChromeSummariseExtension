$("#defaults").click(function() {
	chrome.runtime.sendMessage({type: "setVariables", values: {
		percent: 0.3,
		max: 6,
		min: 3,
		imperial: true
	}});
	
	restore();
});

function setup() {
	$("#percent").change(function() {
		save();
		$('#percent-label').html($("#percent").val() + "% Of Size.");
	});

	$("#min").change(function() {
		save();
		$('#min-label').html($("#min").val() + " Sentences");
	});

	$("#max").change(function() {
		save();
		$('#max-label').html($("#max").val() + " Sentences");
	});
	
	$("#imperial").change(function() {
		save();
		if ($("#imperial").prop('checked'))
			$('#imperial-label').html("Convert");
		else
			$('#imperial-label').html("Do Not Convert");
	});
	
	$('#save').click(save);	
	
	restore();
}

function save() {
	chrome.runtime.sendMessage({type: "setVariables", values: {
		percent: $('#percent').val() / 100,
		max: $('#max').val(),
		min: $('#min').val(),
		imperial: $('#imperial').prop('checked')
	}});
}

function restore() {
	chrome.runtime.sendMessage({type: "getVariables"}, function(response) {
		$('#percent').val(response.percent * 100).change();
		$('#max').val(response.max).change();
		$('#min').val(response.min).change();
		$('#imperial').prop('checked', response.imperial).change();
	});
}

document.addEventListener('DOMContentLoaded', setup);