gatherWindowInfo();
document.getElementById('start').addEventListener('click',loadStart);
document.getElementById('later').addEventListener('click',doLater);

document.onkeypress = function(e) {
	if (e.keyCode == 13) {
		// Enter key
		// Proceed to activity
		e.preventDefault();
		loadStart();
	} else if (e.keyCode == 27) {
		// Escape key
		// Proceed to cancel confirmation page
		e.preventDefault();
		doLater();
	} else if (e.keyCode == 8 || e.keyCode == 122) {
		// Backspace or F11 key
		// Prevent user from closing popup
		e.preventDefault();
	}
};

// Proceed to activity
function loadStart() {
	window.location.href = 'activity.html';
}

// Proceed to cancel confirmation page
function doLater() {
	window.location.href = 'confirm.html';
}

// Start timer reset procedure
function gatherWindowInfo() {
	var getting = browser.windows.getCurrent();
	getting.then(sendInfo);
}

// Tell background.js to set new timer
function sendInfo(windowInfo) {
	chrome.runtime.sendMessage(windowInfo.id);
}