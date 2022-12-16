/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

i18nParse();
document.getElementById('close').addEventListener('click', closeWindow);
document.getElementById('goback').addEventListener('click', goToMenu);

/**
 * Return to menu
 */
function goToMenu() {
    window.location.href = 'main.html';
}

/**
 * Close the current window
 */
function closeWindow() {
    browser.windows.getCurrent((window) => {
        browser.runtime.sendMessage({
            command: 'activityFinished'
        });
        browser.windows.remove(window.id);
    });
}
