/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

i18nParse();
sendWindowId();
document.getElementById('start').addEventListener('click', start);
document.getElementById('later').addEventListener('click', cancel);
document.getElementById('wait').addEventListener('click', minimize);

/**
 * Start activity
 */
function start() {
    window.location.href = 'activity.html';
}

/**
 * Cancel activity
 */
function cancel() {
    window.location.href = 'confirm.html';
}

/**
 * Minimize activity
 */
function minimize() {
    browser.windows.getCurrent((window) => {
        browser.windows.update(window.id, {
            state: browser.windows.WindowState.MINIMIZED
        }, () => {
            browser.notifications.create('eye-minimized', {
                type: 'basic',
                iconUrl: browser.extension.getURL('icons/icon-96.png'),
                title: browser.i18n.getMessage('delayedNotificationTitle'),
                message: browser.i18n.getMessage('delayedNotificationMessage')
            });
        });
    });
}

/**
 * Send window ID to background script
 */
function sendWindowId() {
    browser.windows.getCurrent((window) => {
        browser.runtime.sendMessage({
            command: 'updateWindowId',
            windowId: window.id
        });
    });
}
