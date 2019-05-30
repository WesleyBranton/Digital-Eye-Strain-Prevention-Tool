// Check if user has set a notification type
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

// Create timer
function startCountdown() {
	browser.alarms.create('enablepopup',{delayInMinutes:20});
}

// Handle timer trigger
function handleAlarm(alarmInfo) {
	var trigger = alarmInfo.name;
	if (trigger == 'enablepopup') {
		browser.storage.local.get('notificationMode', (res) => {
			if (res.notificationMode == 0) {
				// Display browser notification
				notify();
			} else {
				// Display popup
				open("main");
			}
		});
	}
}

// Open popup
function open(page) {
	chrome.windows.create({
		"url": chrome.extension.getURL("popup/" + page + ".html"),
		"state": "fullscreen"
	});
}

// Create browser notification
function notify() {
	browser.notifications.create("eye-notification",{
		"type": "basic",
		"iconUrl": browser.extension.getURL("icons/icon-96.png"),
		"title": getMessage("title"),
		"message": getMessage("message") + "\n\nClick here to get started..."
	});
}

// Handle browser notification click
function notificationClick(notificationId) {
	if (notificationId == "eye-notification") {
		open("activity");
	}
}

// Handle browser notification close
function notificationClosed(notificationId) {
	if (notificationId == "eye-notification") {
		startCountdown();
	}
}

// Generate random notification messages
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

// Initialize nofitication type
function firstRun() {
	browser.storage.local.set({notificationMode: 1});
}

// Handle browser messages
function handleMessages(msgCode) {
	openWindow = msgCode;
}