gatherWindowInfo();
document.getElementById('start').addEventListener('click',loadStart);
document.getElementById('later').addEventListener('click',doLater);
document.getElementById('wait').addEventListener('click',minimize);

// Proceed to activity
function loadStart() {
	window.location.href = 'activity.html';
}

// Proceed to cancel confirmation page
function doLater() {
	window.location.href = 'confirm.html';
}

// Minimize window
async function minimize() {
	var popup = await browser.windows.getCurrent();
	browser.windows.update(popup.id,{state: "minimized"});
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