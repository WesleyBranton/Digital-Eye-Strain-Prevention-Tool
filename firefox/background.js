/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

let openWindow;
let activityPending = false;
const chime = new Audio('audio/chime.ogg');
enableTimer();
loadStorage();
browser.alarms.onAlarm.addListener(handleAlarm);
browser.runtime.onMessage.addListener(handleMessages);
browser.windows.onRemoved.addListener((wID) => { if (wID == openWindow) enableTimer(); });
browser.storage.local.set({ 'tempDisabled': 0 });
browser.runtime.onInstalled.addListener(handleInstalled);
browser.tabs.onUpdated.addListener(checkTimer);
browser.browserAction.onClicked.addListener(handleBrowserActionClicked);
browser.storage.onChanged.addListener(handleStorageChange);
checkPermissions();

// Check that alarm is valid
async function checkTimer() {
    const alarm = await browser.alarms.get('enablepopup');
    const alarmTime = alarm.scheduledTime;
    const currentTime = new Date().getTime();

    if (alarmTime < currentTime || (alarmTime - currentTime) > 1200000) enableTimer();
}

// Handle timer trigger
async function handleAlarm(alarmInfo) {
    const trigger = alarmInfo.name;
    if (trigger == 'enablepopup') {
        const data = await browser.storage.local.get();
        
        if (typeof data.notificationMode === 'undefined' || data.notificationMode == 1) open('main');
        else if (data.notificationMode == 0) notify();

        // Play chime (if enabled)
        if (typeof data.playChime === 'undefined' || data.playChime == 1) {
            chime.play();
        }
        
        activityWaiting();
    }
}

// Handles install/update
function handleInstalled(details) {
    if (details.reason == 'install') browser.tabs.create({ url: 'https://addons.wesleybranton.com/addon/digital-eye-strain-prevention-tool/welcome/v1' });
    else if (details.reason == 'update') browser.tabs.create({ url: 'https://addons.wesleybranton.com/addon/digital-eye-strain-prevention-tool/update/v2_2' });
}

// Open popup
function open(page) {
    browser.windows.create({
        'url': browser.extension.getURL('popup/' + page + '.html'),
        'state': 'fullscreen',
        'type': 'popup'
    });
}

// Create browser notification
async function notify() {
    if (await browser.permissions.contains({ permissions: ['notifications'] })) {
        browser.notifications.onClicked.addListener(notificationClick);
        browser.notifications.onClosed.addListener(notificationClosed);
        browser.notifications.create('eye-notification', {
            type: 'basic',
            iconUrl: browser.extension.getURL('icons/icon-96.png'),
            title: getMessage('title'),
            message: getMessage('message') + '\n\nClick here to get started...'
        });
    } else {
        console.error('User has not granted permission to create browser notifications');
    }
}

// Handle browser notification click
function notificationClick(notificationId) {
    if (notificationId == 'eye-notification') open('activity');

    browser.notifications.onClicked.removeListener(notificationClick);
    browser.notifications.onClosed.removeListener(notificationClosed);
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

    browser.notifications.onClicked.removeListener(notificationClick);
    browser.notifications.onClosed.removeListener(notificationClosed);
}

// Generate random notification messages
function getMessage(msg) {
    let messages;

    if (msg == 'title') {
        messages = [
            "It's time to protect your eyes!",
            "Hey! Look over here!",
            "Yours eyes are super important!",
            "Do you have 20 seconds to spare?",
            "You have such beautiful eyes!",
            "Healthy eyes are happy eyes!"
        ];
    } else if (msg == 'message') {
        messages = [
            "You've been looking at your screen for a long time. Let's give your eyes a break.",
            "You are reading this message thanks to your eyes. Show them some appreciation by doing this short exercise to prevent digital eye strain.",
            "You look like you're being really productive right now. Let's take a short break to protect your eyes.",
            "Let's make sure your eyes stay top-notch. It only takes 20 seconds of your time.",
            "Staring at your computer screen for long periods of time can lead to permanent damage. Let's prevent that with a short activity."
        ];
    }
    const random = Math.floor(Math.random() * Math.floor(messages.length));
    return messages[random];
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
    else browser.runtime.openOptionsPage();
}

// End activity
function activityFinished() {
    activityPending = false;
    browser.browserAction.setIcon({ path: 'icons/browserAction/disabled.png' });
    browser.browserAction.setBadgeText({ text: '' });
    enableTimer();
}

// Add activity to queue
function activityWaiting() {
    activityPending = true;
    browser.browserAction.setIcon({ path: 'icons/browserAction/active.gif' });
    browser.browserAction.setBadgeText({ text: ' ! ' });
}

// Checks that the required optional permissions are enabled
async function checkPermissions() {
    const settings = await browser.storage.local.get();
    if (settings.notificationMode === 0) {
        if (!(await browser.permissions.contains({ permissions: ['notifications'] }))) {
            browser.tabs.create({
                url: 'error/missingPermissions.html'
            });
        }
    }
}

// Load the Storage API to init data
async function loadStorage() {
    const data = await browser.storage.local.get();

    if (typeof data.chimeVolume == 'number') {
        chime.volume = data.chimeVolume;
    } else {
        chime.volume = 1;
    }
}

// Handle changes to the Storage API
function handleStorageChange(changes, area) {
    for (c of Object.keys(changes)) {
        if (c == 'chimeVolume') {
            chime.volume = changes[c].newValue;
        }
    }
}