/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Save options
function saveOptions() {
    // Save settings
    browser.storage.local.set({
        notificationMode: parseInt(document.settings.notificationMode.value),
        tempDisabled: parseInt(document.settings.tempDisabled.value),
        playChime: parseInt(document.settings.playChime.value)
    });

    // Handle optional permissions for browser notifications
    if (parseInt(document.settings.notificationMode.value) == 0) {
        browser.permissions.request(notificationsPermissions).then(processNotificationsPermissions);
    } else {
        browser.permissions.remove(notificationsPermissions);
        processNotificationsPermissions(true);
    }
    
    // Apply changes to Do Not Disturb setting
    if (document.settings.tempDisabled.value == 1) browser.runtime.sendMessage('disabletimer');
    else browser.runtime.sendMessage('enabletimer');
}

// Prefill saved settings into option page
async function restoreOptions() {
    const data = await browser.storage.local.get();

    // Notification mode setting
    if (typeof data.notificationMode === 'undefined') document.settings.notificationMode.value = 1;
    else document.settings.notificationMode.value = data.notificationMode;

    // Play chime setting
    if (typeof data.playChime === 'undefined') document.settings.playChime.value = 1;
    else document.settings.playChime.value = data.playChime;

    // Do Not Disturb setting
    if (typeof data.tempDisabled === 'undefined') document.settings.tempDisabled.value = 0;
    else document.settings.tempDisabled.value = data.tempDisabled;

    // Handle optional permissions for browser notifications
    if (parseInt(document.settings.notificationMode.value) == 0) {
        browser.permissions.contains(notificationsPermissions).then(processNotificationsPermissions);
    }
}

/**
 * Shows/Hides error messages for notifications permission
 * @param {boolean} isAllowed
 */
function processNotificationsPermissions(isAllowed) {
    const error = document.getElementById('error-notificationsPermissionMissing');
    const trigger = document.getElementById('trigger-notificationsPermissionMissing');

    if (isAllowed) {
        error.classList.add('hidden');
        trigger.classList.add('hidden');
    } else {
        console.warn('User has selected browser notifications mode without granting the required permissions');
        error.classList.remove('hidden');
        trigger.classList.remove('hidden');
    }
}

const notificationsPermissions = { permissions: ['notifications'] };
restoreOptions();
document.getElementsByTagName('form')[0].addEventListener('change', saveOptions);
document.getElementById('trigger-notificationsPermissionMissing').addEventListener('click', () => {
    browser.permissions.request(notificationsPermissions).then(processNotificationsPermissions);
});