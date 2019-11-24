/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Save options
function saveOptions() {
    // Notification mode setting
    browser.storage.local.set({
        'notificationMode': document.settings.notificationMode.value
    });
    
    // Do Not Disturb setting
    browser.storage.local.set({
        'tempDisabled': document.settings.tempDisabled.value
    });
    
    // Apply changes to Do Not Disturb setting
    if (document.settings.tempDisabled.value == 1 && !isDisabled) {
        chrome.runtime.sendMessage('disabletimer');
        isDisabled = true;
    } else if (document.settings.tempDisabled.value == 0 && isDisabled) {
        chrome.runtime.sendMessage('enabletimer');
        isDisabled = false;
    }
}

// Prefill saved settings into option page
function restoreOptions() {
    // Notification mode setting
    browser.storage.local.get('notificationMode', (res) => {
        document.settings.notificationMode.value = res.notificationMode;
    });
    // Do Not Disturb setting
    browser.storage.local.get('tempDisabled', (res) => {
        document.settings.tempDisabled.value = res.tempDisabled;
        if (res.tempDisabled == 1) {
            isDisabled = true;
        }
    });
}

var isDisabled = false;
restoreOptions();
document.getElementsByTagName('form')[0].addEventListener('change', saveOptions);