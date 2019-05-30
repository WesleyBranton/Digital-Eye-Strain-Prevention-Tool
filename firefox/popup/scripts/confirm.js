document.getElementById('close').addEventListener('click',gatherWindowInfo);
document.getElementById('goback').addEventListener('click',goback);

document.onkeypress = function(e) {
	if (e.keyCode == 13) {
		// Enter key
		// Close popup
		e.preventDefault();
		gatherWindowInfo();
	} else if (e.keyCode == 27) {
		// Escape key
		// Go back
		e.preventDefault();
		goback();
	} else if (e.keyCode == 8 || e.keyCode == 122) {
		// Backspace or F11 key
		// Prevent user from closing popup
		e.preventDefault();
	}
};

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