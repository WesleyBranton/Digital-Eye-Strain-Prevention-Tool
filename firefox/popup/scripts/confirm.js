document.getElementById('close').addEventListener('click',gatherWindowInfo);
document.getElementById('goback').addEventListener('click',goback);

// Go back to main menu
function goback() {
	window.location.href = 'main.html';
}

// Start window close procedure
function gatherWindowInfo() {
	var getting = browser.windows.getCurrent();
	getting.then(closeWindow);
}

// Close popup window
function closeWindow(windowInfo) {
	browser.windows.remove(windowInfo.id);
}