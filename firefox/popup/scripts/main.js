/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

sendWindowId();
document.getElementById('start').addEventListener('click', loadStart);
document.getElementById('later').addEventListener('click', doLater);
document.getElementById('wait').addEventListener('click', minimize);

// Proceed to activity
function loadStart() {
    window.location.href = 'activity.html';
}

// Proceed to cancel confirmation page
function doLater() {
    window.location.href = 'confirm.html';
}

// Minimize window
async function minimize() {
    var popup = await browser.windows.getCurrent();
    browser.windows.update(popup.id, {
        state: 'minimized'
    });
    browser.notifications.create('eye-minimized', {
        'type': 'basic',
        'iconUrl': browser.extension.getURL('icons/icon-96.png'),
        'title': "You've delayed your eye activity!",
        'message': 'Once you have wrapped up your work and are ready to take a break, click this notification...'
    });
}

// Send window ID to background.js
async function sendWindowId() {
    var popup = await browser.windows.getCurrent();
    chrome.runtime.sendMessage(popup.id);
}