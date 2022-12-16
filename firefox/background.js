/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

let openWindow;
let activityPending = false;
const chime = new Audio('audio/chime.ogg');
const webBase = 'https://addons.wesleybranton.com/addon/digital-eye-strain-prevention-tool';

const PERMISSIONS_NOTIFICATION = {
    permissions: ['notifications']
};
const PERMISSIONS_PAUSE = {
    permissions: ['tabs'],
    origins: ['<all_urls>']
};

init();

/**
 * Initialize add-on on startup
 */
function init() {
    browser.alarms.onAlarm.addListener(handleAlarm);
    browser.runtime.onMessage.addListener(handleMessage);
    browser.windows.onRemoved.addListener(handleWindowRemoved);
    browser.runtime.onInstalled.addListener(handleInstalled);
    browser.tabs.onUpdated.addListener(checkTimer);
    browser.browserAction.onClicked.addListener(handleBrowserActionClicked);
    browser.storage.onChanged.addListener(handleStorageChanged);

    checkPermissions();
    setUninstallPage();
    updateStatus();
    startAlarm();

    browser.alarms.create('updateStatus', {
        periodInMinutes: 0.5
    });
    browser.storage.local.set({
        'tempDisabled': 0
    });
}

/**
 * Handle add-on installation or update
 * @param {Object} details
 */
function handleInstalled(details) {
    switch (details.reason) {
        case browser.runtime.OnInstalledReason.INSTALL:
            browser.tabs.create({
                url: `${webBase}/welcome/v1`
            });
            break;
        case browser.runtime.OnInstalledReason.UPDATE:
            if (compareVersionNumbers(details.previousVersion, '2.2') == 2) {
                browser.tabs.create({
                    url: `${webBase}/update/v2_2`
                });
            }
            break;
    }
}

/**
 * Compare two version numbers
 * @param {string} v1 Version number
 * @param {string} v2 Version number
 * @returns Same (0), v1 > v2 (1), v2 > v1 (2)
 */
function compareVersionNumbers(v1, v2) {
    v1 = parseVersion(v1);
    v2 = parseVersion(v2);

    for (const key of ['major', 'minor', 'patch']) {
        if (v1[key] > v2[key]) {
            return 1;
        } else if (v1[key] < v2[key]) {
            return 2;
        }
    }

    return 0;
}

/**
 * Parse semantic version number to object
 * @param {string|number} versionString Version number
 * @returns Version object
 */
function parseVersion(versionString) {
    versionString = versionString.toString().split('.');

    const version = {};
    let i = 0;

    for (const key of ['major', 'minor', 'patch']) {
        if (versionString.length > i) {
            const number = parseInt(versionString[i]);
            if (!isNaN(number)) {
                version[key] = number;
            } else {
                version[key] = 0;
            }
        } else {
            version[key] = 0;
        }
        ++i;
    }

    return version;
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

/**
 * Warn user about any essential missing permissions
 */
function checkPermissions() {
    browser.storage.local.get('notificationMode', (settings) => {
        if (settings.notificationMode === 0) {
            browser.permissions.contains(PERMISSIONS_NOTIFICATION, (granted) => {
                if (!granted) {
                    browser.tabs.create({
                        url: 'error/missingPermissions.html'
                    });
                }
            });
        }
    });
}

/**
 * Start main activity alarm
 */
function startAlarm() {
    browser.alarms.create('enablepopup', {
        delayInMinutes: 20
    });
}

/**
 * Stop main activity alarm
 */
function stopAlarm() {
    browser.alarms.clear('enablepopup');
}

/**
 * Restarts the activity alarm if:
 *     - alarm will trigger in the past
 *     - alarm will trigger more than 20 minutes in the future
 */
function checkTimer() {
    browser.alarms.get('enablepopup', (alarm) => {
        const alarmTime = alarm.scheduledTime;
        const currentTime = Date.now();

        if (alarmTime < currentTime || (alarmTime - currentTime) > 1200000) {
            startAlarm();
        }
    });
}

/**
 * Handle alarm firing
 * @param {Object} alarmInfo
 */
function handleAlarm(alarmInfo) {
    switch (alarmInfo.name) {
        case 'enablepopup':
            startActivity();
            break;
        case 'updateStatus':
            updateStatus();
            break;
    }
}

/**
 * Check if the add-on is currently in the quiet time schedule
 * @param {Function} callback Function that accepts boolean
 */
function isQuietTime(callback) {
    browser.storage.local.get(['scheduleEnabled', 'schedule'], (settings) => {
        const now = new Date();
        const nowWeekday = now.getDay();
        const nowTime = (now.getHours() * 60) + now.getMinutes();

        if (typeof settings.scheduleEnabled == 'undefined' || settings.scheduleEnabled == 0) {
            callback(false);
            return;
        }

        if (typeof settings.schedule == 'undefined' || typeof settings.schedule[nowWeekday] == 'undefined') {
            callback(false);
            return;
        }

        for (const t of settings.schedule[nowWeekday]) {
            if (nowTime >= t.start && nowTime <= t.end) {
                callback(true);
                return;
            }
        }

        callback(false);
    });
}

/**
 * Check if the add-on is currently temporarily disabled
 * @param {Function} callback Function that accepts boolean
 */
function isDisabled(callback) {
    browser.storage.local.get('tempDisabled', (settings) => {
        callback(typeof settings.tempDisabled != 'undefined' && settings.tempDisabled == 1);
    });
}

/**
 * Checks if activity can start
 * @param {Function} callback Function that accepts boolean
 */
function canStart(callback) {
    isDisabled((disabled) => {
        if (disabled) {
            callback(false);
        } else {
            isQuietTime((quietTime) => {
                callback(!quietTime);
            });
        }
    });
}

/**
 * Update browserAction icon based on current status
 */
function updateStatus() {
    canStart((allowed) => {
        if (allowed) {
            if (!activityPending) {
                browser.browserAction.setBadgeText({
                    text: ''
                });
            }
        } else {
            browser.browserAction.setBadgeText({
                text: 'OFF'
            });
            activityPending = false;
        }
    });
}

/**
 * Start activity
 */
function startActivity() {
    canStart((allowed) => {
        // Restart the alarm if it cannot start
        if (!allowed) {
            startAlarm();
            return;
        }

        browser.storage.local.get(['notificationMode', 'playChime'], (settings) => {
            // Notify user (if enabled)
            if (typeof settings.notificationMode === 'undefined' || settings.notificationMode == 1) {
                createPopup('main');
            } else if (settings.notificationMode == 0) {
                createNotification();
            }

            // Play chime (if enabled)
            if (typeof settings.playChime === 'undefined' || settings.playChime == 1) {
                chime.play();
            }

            activityPending = true;
            browser.browserAction.setIcon({
                path: 'icons/browserAction/active.gif'
            });
            browser.browserAction.setBadgeText({
                text: ' ! '
            });
        });
    });
}

/**
 * Create fullscreen popup displaying specified page
 * @param {String} page
 */
function createPopup(page) {
    pauseMedia(() => {
        browser.windows.create({
            url: browser.extension.getURL('popup/' + page + '.html'),
            state: browser.windows.WindowState.FULLSCREEN,
            type: browser.windows.WindowType.POPUP
        });
    });
}

/**
 * Create activity notification
 */
function createNotification() {
    browser.permissions.contains(PERMISSIONS_NOTIFICATION, (granted) => {
        if (!granted) {
            console.error('User has not granted permission to create browser notifications');
            return;
        }

        browser.notifications.onClicked.addListener(handleNotificationClicked);
        browser.notifications.onClosed.addListener(handleNotificationClosed);

        browser.notifications.create('eye-notification', {
            type: 'basic',
            iconUrl: browser.extension.getURL('icons/icon-96.png'),
            title: getRandomMessage('title'),
            message: getRandomMessage('message') + '\n\nClick here to get started...'
        });
    });
}

/**
 * Handle notification clicked
 * @param {String} id
 */
function handleNotificationClicked(id) {
    switch (id) {
        case 'eye-notification':
            createPopup('activity');
            break;
    }

    browser.notifications.onClicked.removeListener(handleNotificationClicked);
    browser.notifications.onClosed.removeListener(handleNotificationClosed);
}

/**
 * Handle browser notification closed
 * @param {String} id
 */
function handleNotificationClosed(id) {
    switch (id) {
        case 'eye-notification':
            startAlarm();
            break;
        case 'eye-minimized':
            browser.windows.update(openWindow, {
                state: browser.windows.WindowState.FULLSCREEN,
                focused: true
            });
            break;
    }

    browser.notifications.onClicked.removeListener(handleNotificationClicked);
    browser.notifications.onClosed.removeListener(handleNotificationClosed);
}

/**
 * Generate random notification message
 * @param {String} messageKeyPrefix
 * @param {String} numberKey
 * @returns Message
 */
function getRandomMessage(messageKeyPrefix, numberKey) {
    const number = parseInt(browser.i18n.getMessage(numberKey));
    let random = 1;

    if (!isNaN(number)) {
        random = Math.floor((Math.random() * number) + 1);
    }

    return browser.i18n.getMessage(messageKeyPrefix + random);
}

/**
 * Pause media in tabs
 * @param {Function} callback
 */
function pauseMedia(callback) {
    browser.storage.local.get('autoPause', (settings) => {
        if (typeof settings.autoPause == 'undefined' || settings.autoPause == 0) {
            callback();
            return;
        }

        browser.permissions.contains(PERMISSIONS_PAUSE, (granted) => {
            if (!granted) {
                console.warn('User has not granted permissions required to pause media in tabs');
                callback();
                return;
            }

            const tabQuery = {};

            // Restrict to active tabs only based on user settings
            if (settings.autoPause != 2) {
                tabQuery['active'] = true;
            }

            browser.tabs.query(tabQuery, (tabs) => {
                for (const tab of tabs) {
                    browser.tabs.executeScript(tab.id, {
                        allFrames: true,
                        code: 'for (m of document.querySelectorAll("video, audio")) { m.pause(); }',
                        runAt: browser.extensionTypes.RunAt.DOCUMENT_IDLE
                    });
                }

                callback();
            });
        });
    });
}

/**
 * Handle activity completed
 */
function activityFinished() {
    activityPending = false;
    browser.browserAction.setIcon({
        path: 'icons/browserAction/disabled.png'
    });
    browser.browserAction.setBadgeText({
        text: ''
    });
    startAlarm();
}

/**
 * Handle toolbar button clicked
 */
function handleBrowserActionClicked() {
    if (activityPending) {
        createPopup('activity');
    } else {
        browser.runtime.openOptionsPage();
    }
}

/**
 * Handle browser window removed
 * @param {Number} id
 */
function handleWindowRemoved(id) {
    if (id == openWindow) {
        startAlarm();
    }
}

/**
 * Handle incoming runtime message
 * @param {Object} message
 */
function handleMessage(message) {
    switch (message.command) {
        case 'stopAlarm':
            stopAlarm();
            break;
        case 'startAlarm':
            startAlarm();
            break;
        case 'activityFinished':
            activityFinished();
            break;
        case 'updateStatus':
            updateStatus();
            break;
        case 'updateWindowId':
            openWindow = message.windowId;
    }
}

/**
 * Handle changes to the settings
 * @param {Object} changes
 */
function handleStorageChanged(changes) {
    // Remove unchanged values
    for (const key of Object.keys(changes)) {
        if (changes[key].oldValue == changes[key].newValue) {
            delete changes[key];
        }
    }

    for (const c of Object.keys(changes)) {
        switch (c) {
            case 'scheduleEnabled':
            case 'schedule':
            case 'tempDisabled':
                updateStatus();
                return;
        }
    }
}
