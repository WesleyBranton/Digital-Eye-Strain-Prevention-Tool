document.getElementById('close').addEventListener('click',closeWindow);
document.getElementById('goback').addEventListener('click',goback);

// Go back to main menu
function goback() {
	window.location.href = 'main.html';
}

// Close popup
async function closeWindow() {
	var popup = await browser.windows.getCurrent();
	browser.windows.remove(popup.id);
}