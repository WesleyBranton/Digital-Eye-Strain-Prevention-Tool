function open(page) {
	chrome.windows.create({
		"url": chrome.extension.getURL("popup/" + page + ".html"),
		"state": "fullscreen"
	});
}

function getMessage(msg) {
	if (msg == 'title') {
		var messages = ["It's time to protect your eyes!",
			"test1"];
	} else if (msg == 'message') {
		var messages = ["You've been looking at your screen for a long time. Let's give your eyes a break.",
			"test1"];
	}
	var random = Math.floor(Math.random() * Math.floor(2));
	return messages[random];
}

function notify() {
	browser.notifications.create("eye-notification",{
		"type": "basic",
		"iconUrl": browser.extension.getURL("icons/icon-96.png"),
		"title": getMessage("title"),
		"message": getMessage("message") + "\n\nClick here to get started..."
	});
}

function notificationClick(notificationId) {
	if (notificationId == "eye-notification") {
		open("activity");
	}
}

function notificationClosed(notificationId) {
	if (notificationId == "eye-notification") {
		startCountdown();
	}
}

function startCountdown() {
	browser.alarms.create('enablepopup',{delayInMinutes:20});
}

function handleAlarm(alarmInfo) {
	var trigger = alarmInfo.name;
	if (trigger == 'enablepopup') {
		browser.storage.local.get('notificationMode', (res) => {
			if (res.notificationMode == 0) {
				// Notification only
				notify();
			} else {
				// Popup
				open("main");
			}
		});
	}
}

function firstRun() {
	browser.storage.local.set({notificationMode: 1});
}

function handleMessages(msgCode) {
	openWindow = msgCode;
}

browser.storage.local.get('notificationMode', (res) => {
	if (typeof res.notificationMode === 'undefined') {
		firstRun();
	}
});
var openWindow;
startCountdown();
browser.alarms.onAlarm.addListener(handleAlarm);
chrome.runtime.onMessage.addListener(handleMessages);
browser.windows.onRemoved.addListener((windowId) => {
	if (windowId == openWindow) {
		startCountdown();
	}
});
browser.notifications.onClicked.addListener(function(notificationId) {
  notificationClick(notificationId);
});
browser.notifications.onClosed.addListener(function(notificationId) {
  notificationClosed(notificationId);
});