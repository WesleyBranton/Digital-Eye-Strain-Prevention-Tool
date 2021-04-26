/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https: //mozilla.org/MPL/2.0/. */

function grantPermission() {
    browser.permissions.request({ permissions: ['notifications'] }).then(updateUI);
}

function openOptions() {
    browser.runtime.openOptionsPage();
}

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

document.getElementById('grantPermission').addEventListener('click', grantPermission);
document.getElementById('viewOptions').addEventListener('click', openOptions);