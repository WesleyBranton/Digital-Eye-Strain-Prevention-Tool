// Save options
function saveOptions() {
	var setting = document.getElementById('notificationMode').value;
	browser.storage.local.set({'notificationMode': setting});
	var disable = document.getElementById('tempDisabled').value;
	browser.storage.local.set({'tempDisabled': disable});
	
	if (disable == 1 && !isDisabled) {
		chrome.runtime.sendMessage("disabletimer");
		isDisabled = true;
	} else if (disable == 0 && isDisabled) {
		chrome.runtime.sendMessage("enabletimer");
		isDisabled = false;
	}
}

// Prefill saved settings into option page
function restoreOptions() {
	browser.storage.local.get('notificationMode', (res) => {
		var setting = document.getElementById('notificationMode');
		setting.value = res.notificationMode;
	});
	browser.storage.local.get('tempDisabled', (res) => {
		var setting = document.getElementById('tempDisabled');
		setting.value = res.tempDisabled;
		if (res.tempDisabled == 1) {
			isDisabled = true;
		}
	});
}

var isDisabled = false;
restoreOptions();
document.getElementsByTagName("form")[0].addEventListener("change", saveOptions);