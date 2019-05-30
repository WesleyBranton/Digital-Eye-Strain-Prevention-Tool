gatherWindowInfo();
document.getElementById('start').addEventListener('click',loadStart);
document.getElementById('later').addEventListener('click',doLater);

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