/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https: //mozilla.org/MPL/2.0/. */

/**
 * Grant notification permissions
 */
function grantPermission() {
    browser.permissions.request({
        permissions: ['notifications']
    }, updateUI);
}

/**
 * Open options
 */
function openOptions() {
    browser.runtime.openOptionsPage();
}

/**
 * Update the UI
 * @param {Boolean} granted
 */
function updateUI(granted) {
    const grantedUI = document.getElementById('granted');
    const notGrantedUI = document.getElementById('notGranted');
    const errorGranting = document.getElementById('errorGranting');

    if (granted) {
        grantedUI.classList.remove('hidden');
        notGrantedUI.classList.add('hidden');
        errorGranting.classList.add('hidden');
    } else {
        errorGranting.classList.remove('hidden');
    }
}

i18nParse();
document.getElementById('grantPermission').addEventListener('click', grantPermission);
document.getElementById('viewOptions').addEventListener('click', openOptions);