document.getElementById('close').addEventListener('click',gatherWindowInfo);
document.getElementById('goback').addEventListener('click',goback);
document.onkeypress = function(e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		gatherWindowInfo();
	} else if (e.keyCode == 27) {
		e.preventDefault();
		goback();
	} else if (e.keyCode == 8 || e.keyCode == 122) {
		e.preventDefault();
	}
};

function goback() {
	window.location.href = 'main.html';
}

function gatherWindowInfo() {
	var getting = browser.windows.getCurrent();
	getting.then(closeWindow);
}

function closeWindow(windowInfo) {
	browser.windows.remove(windowInfo.id);
}