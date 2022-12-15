/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

let openWindow;
let activityPending = false;
const chime = new Audio('audio/chime.ogg');
const webBase = 'https://addons.wesleybranton.com/addon/digital-eye-strain-prevention-tool';
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
setUninstallPage();
checkQuietTime();
browser.alarms.create('checkquiettime', { periodInMinutes: 0.5 });

// Check that alarm is valid
async function checkTimer() {
    const alarm = await browser.alarms.get('enablepopup');
    const alarmTime = alarm.scheduledTime;
    const currentTime = new Date().getTime();

    if (alarmTime < currentTime || (alarmTime - currentTime) > 1200000) enableTimer();
}

/**
 * Check if the add-on is currently in the quiet time schedule
 * @returns Boolean
 */
async function isQuietTime() {
    const now = new Date();
    const nowWeekday = now.getDay();
    const nowTime = (now.getHours() * 60) + now.getMinutes();

    const data = await browser.storage.local.get(['scheduleEnabled', 'schedule']);

    if (typeof data.scheduleEnabled == 'undefined' || data.scheduleEnabled == 0) {
        return false;
    }

    if (typeof data.schedule == 'undefined' || typeof data.schedule[nowWeekday] == 'undefined') {
        return false;
    }

    for (const t of data.schedule[nowWeekday]) {
        if (nowTime >= t.start && nowTime <= t.end) {
            return true;
        }
    }

    return false;
}

/**
 * Check if the add-on is in quiet time
 */
async function checkQuietTime() {
    const quietTime = await isQuietTime();

    if (quietTime) {
        browser.browserAction.setBadgeText({ text: 'OFF' });
    } else {
        browser.browserAction.setBadgeText({ text: '' });
    }
}

// Handle timer trigger
async function handleAlarm(alarmInfo) {
    switch (alarmInfo.name) {
        case 'enablepopup':
            handlePopupAlarm(alarmInfo);
            break;
        case 'checkquiettime':
            checkQuietTime();
            break;
    }
}

async function handlePopupAlarm(alarmInfo) {
    const quietTime = await isQuietTime();
    if (quietTime) {
        await disableTimer();
        await enableTimer();
        return;
    }

    const data = await browser.storage.local.get();
    
    if (typeof data.notificationMode === 'undefined' || data.notificationMode == 1) open('main');
    else if (data.notificationMode == 0) notify();

    // Play chime (if enabled)
    if (typeof data.playChime === 'undefined' || data.playChime == 1) {
        chime.play();
    }
    
    activityWaiting();
}

// Handles install/update
function handleInstalled(details) {
    if (details.reason == 'install') browser.tabs.create({ url: `${webBase}/welcome/v1` });
    else if (details.reason == 'update') browser.tabs.create({ url: `${webBase}/update/v2_2` });
}

// Open popup
async function open(page) {
    await pauseMedia();
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
function getMessage(messageKey, numberKey) {
    const number = parseInt(browser.i18n.getMessage(numberKey));
    let random = 1;

    if (!isNaN(number)) {
        random = Math.floor((Math.random() * number) + 1);
    }

    return browser.i18n.getMessage(messageKey + random);
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
    else if (msgCode == 'checkQuietTime') checkQuietTime();
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
    browser.browserAction.setIcon({ path: 'icons/browserAction/inactive.png' });
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

// Pause media in user's tabs
async function pauseMedia() {
    const settings = await browser.storage.local.get("autoPause");

    if (typeof settings.autoPause == 'undefined' || settings.autoPause == 0) {
        return;
    }

    if (await browser.permissions.contains({ permissions: ['tabs'], origins: ['<all_urls>'] })) {
        const allTabs = settings.autoPause == 2;
        const tabQuery = {};

        if (!allTabs) {
            tabQuery['active'] = true;
        }

        const tabs = await browser.tabs.query(tabQuery);

        for (const tab of tabs) {
            browser.tabs.executeScript(tab.id, {
                allFrames: true,
                code: "for (v of document.getElementsByTagName('video')) { v.pause(); }",
                runAt: "document_idle"
            });
        }

        for (const tab of tabs) {
            browser.tabs.executeScript(tab.id, {
                allFrames: true,
                code: "for (a of document.getElementsByTagName('audio')) { a.pause(); }",
                runAt: "document_idle"
            });
        }
    } else {
        console.warn('User has not granted permissions required to pause media in tabs');
    }
}

/**
 * Set up uninstall page
 */
function setUninstallPage() {
    getSystemDetails((details) => {
        browser.runtime.setUninstallURL(`${webBase}/uninstall/?browser=${details.browser}&os=${details.os}&version=${details.version}`);
    });
}

/**
 * Send system details to callback
 * @param {Function} callback
 */
function getSystemDetails(callback) {
    browser.runtime.getPlatformInfo((platform) => {
        callback({
            browser: getBrowserName().toLowerCase(),
            version: browser.runtime.getManifest().version,
            os: platform.os
        });
    });
}


/**
 * Get browser name
 * @returns Browser name
 */
function getBrowserName() {
    return 'FIREFOX';
}
