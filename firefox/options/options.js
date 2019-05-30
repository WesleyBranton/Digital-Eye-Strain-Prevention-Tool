function saveOptions() {
	var setting = document.getElementById('notificationMode').value;
	browser.storage.local.set({'notificationMode': setting});
}

function restoreOptions() {
	browser.storage.local.get('notificationMode', (res) => {
		var setting = document.getElementById('notificationMode');
		setting.value = res.notificationMode;
	});
}

restoreOptions();
document.getElementsByTagName("form")[0].addEventListener("change", saveOptions);