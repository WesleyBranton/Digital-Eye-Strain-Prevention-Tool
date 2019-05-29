function open() {
	chrome.windows.create({
		"url": chrome.extension.getURL("popup/main.html"),
		"state": "fullscreen"
	});
}

function startCountdown() {
	browser.alarms.create('enablepopup',{delayInMinutes:20});
}

function handleAlarm(alarmInfo) {
	var trigger = alarmInfo.name;
	if (trigger == 'enablepopup') {
		open();
	}
}

function handleMessages(msgCode) {
	openWindow = msgCode;
}

var openWindow;
startCountdown();
browser.alarms.onAlarm.addListener(handleAlarm);
chrome.runtime.onMessage.addListener(handleMessages);
browser.windows.onRemoved.addListener((windowId) => {
	if (windowId == openWindow) {
		startCountdown();
	}
});