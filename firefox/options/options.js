/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Save options
function saveOptions() {
    // Save settings
    browser.storage.local.set({
        'notificationMode': parseInt(document.settings.notificationMode.value),
        'tempDisabled': parseInt(document.settings.tempDisabled.value),
        'playChime': parseInt(document.settings.playChime.value)
    });
    
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
}

restoreOptions();
document.getElementsByTagName('form')[0].addEventListener('change', saveOptions);