initializeWindowInfo();
document.getElementById('start').addEventListener('click',loadStart);
document.getElementById('later').addEventListener('click',doLater);
document.onkeypress = function(e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		loadStart();
	} else if (e.keyCode == 27) {
		e.preventDefault();
		doLater();
	} else if (e.keyCode == 8 || e.keyCode == 122) {
		e.preventDefault();
	}
};

function loadStart() {
	window.location.href = 'activity.html';
}

function doLater() {
	window.location.href = 'confirm.html';
}

function initializeWindowInfo() {
	var getting = browser.windows.getCurrent();
	getting.then(sendInfo);
}

function sendInfo(windowInfo) {
	chrome.runtime.sendMessage(windowInfo.id);
}