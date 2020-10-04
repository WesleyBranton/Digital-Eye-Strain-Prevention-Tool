/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

document.getElementById('close').addEventListener('click', closeWindow);
document.getElementById('goback').addEventListener('click', goback);

// Go back to main menu
function goback() {
    window.location.href = 'main.html';
}

// Close popup
async function closeWindow() {
    const popup = await browser.windows.getCurrent();
    await browser.runtime.sendMessage('activityFinished');
    browser.windows.remove(popup.id);
}