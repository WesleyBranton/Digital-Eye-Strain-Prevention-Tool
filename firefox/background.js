/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Check if user has set a notification type
browser.storage.local.get('notificationMode', (res) => {
    if (typeof res.notificationMode === 'undefined') {
        firstRun();
    }
});

var openWindow;
let activityPending = false;
enableTimer();
browser.alarms.onAlarm.addListener(handleAlarm);
chrome.runtime.onMessage.addListener(handleMessages);
browser.windows.onRemoved.addListener((windowId) => {
    if (windowId == openWindow) {
        enableTimer();
    }
});
browser.notifications.onClicked.addListener(function(notificationId) {
  notificationClick(notificationId);
});
browser.notifications.onClosed.addListener(function(notificationId) {
  notificationClosed(notificationId);
});
browser.storage.local.set({'tempDisabled': 0});
browser.runtime.onInstalled.addListener(handleInstalled);
browser.tabs.onUpdated.addListener(checkTimer);
browser.browserAction.onClicked.addListener(handleBrowserActionClicked);

// Check that alarm is valid
async function checkTimer() {
    const alarm = await browser.alarms.get('enablepopup');
    const alarmTime = alarm.scheduledTime;
    const currentTime = new Date().getTime();

    if (alarmTime < currentTime || (alarmTime - currentTime) > 1200000) enableTimer();
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
                open('main');
            }
        });
        activityWaiting();
    }
}

// Handles install/update
function handleInstalled(details) {
    if (details.reason == 'install') {
        browser.tabs.create({
            url: 'messages/new.html'
        });
    } else if (details.reason == 'update') {
        browser.tabs.create({
            url: 'messages/update.html'
        });
    }
}

// Open popup
function open(page) {
    chrome.windows.create({
        'url': chrome.extension.getURL('popup/' + page + '.html'),
        'state': 'fullscreen',
        'type': 'popup'
    });
}

// Create browser notification
function notify() {
    browser.notifications.create('eye-notification',{
        'type': 'basic',
        'iconUrl': browser.extension.getURL('icons/icon-96.png'),
        'title': getMessage('title'),
        'message': getMessage('message') + '\n\nClick here to get started...'
    });
}

// Handle browser notification click
function notificationClick(notificationId) {
    if (notificationId == 'eye-notification') {
        open('activity');
    }
}

// Handle browser notification close
function notificationClosed(notificationId) {
    if (notificationId == 'eye-notification') {
        // Restart timer
        enableTimer();
    } else if (notificationId == 'eye-minimized') {
        // Maximize popup
        browser.windows.update(openWindow, {
            state: 'fullscreen',
            focused: true
        });
    }
}

// Generate random notification messages
function getMessage(msg) {
    if (msg == 'title') {
        var messages = [
            "It's time to protect your eyes!",
            "Hey! Look over here!",
            "Yours eyes are super important!",
            "Do you have 20 seconds to spare?",
            "You have such beautiful eyes!",
            "Healthy eyes are happy eyes!"
        ];
    } else if (msg == 'message') {
        var messages = [
            "You've been looking at your screen for a long time. Let's give your eyes a break.",
            "You are reading this message thanks to your eyes. Show them some appreciation by doing this short exercise to prevent digital eye strain.",
            "You look like you're being really productive right now. Let's take a short break to protect your eyes.",
            "Let's make sure your eyes stay top-notch. It only takes 20 seconds of your time.",
            "Staring at your computer screen for long periods of time can lead to permanent damage. Let's prevent that with a short activity."
        ];
    }
    var random = Math.floor(Math.random() * Math.floor(messages.length));
    return messages[random];
}

// Initialize nofitication type
function firstRun() {
    browser.storage.local.set({
        notificationMode: 1
    });
}

async function disableTimer() {
    return await browser.alarms.clear('enablepopup');
}

async function enableTimer() {
    return await browser.alarms.create('enablepopup', { delayInMinutes: 20 });
}

// Handle browser messages
function handleMessages(msgCode) {
    if (msgCode == 'disabletimer') disableTimer();
    else if (msgCode == 'enabletimer') enableTimer();
    else if (msgCode == 'activityFinished') activityFinished();
    else openWindow = msgCode;
}

// Handle toolbar button click
function handleBrowserActionClicked() {
    if (activityPending) open('activity');
}

// End activity
function activityFinished() {
    activityPending = false;
    browser.browserAction.setIcon({ path: 'icons/browserAction/disabled.png' });
    browser.browserAction.setBadgeText({ text: '' });
}

// Add activity to queue
function activityWaiting() {
    activityPending = true;
    browser.browserAction.setIcon({ path: 'icons/browserAction/active.gif' });
    browser.browserAction.setBadgeText({ text: ' ! ' });
}