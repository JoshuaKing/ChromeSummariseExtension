function defaults() {
	$('#percent').val(30).change();
	$('#max').val(3).change();
	$('#min').val(6).change();
}

function restore_options() {
	$("#percent").change(function() {
		$('#percent-label').html($("#percent").val() + "% Of Size.");
	});

	$("#min").change(function() {
		$('#min-label').html($("#min").val() + " Sentences");
	});

	$("#max").change(function() {
		$('#max-label').html($("#max").val() + " Sentences");
	});
	
	$('#save').click(function() {
		localStorage["percent"] = $('#percent').val() / 100;
		localStorage["max"] = $('#max').val();
		localStorage["min"] = $('#min').val();
		
		chrome.runtime.sendMessage({type: "setVariables", values: {
			percent: $('#percent').val() / 100,
			max: $('#max').val(),
			min: $('#min').val()
		}});
	});
	
	defaults();
	if (!localStorage["percent"]) return;
	$('#percent').val(localStorage["percent"] * 100).change();
	$('#max').val(localStorage["max"]).change();
	$('#min').val(localStorage["min"]).change();
	
}

document.addEventListener('DOMContentLoaded', restore_options);