/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

i18nParse();
document.getElementById('start').addEventListener('click', start);
browser.alarms.onAlarm.addListener(timerTrigger);

/**
 * Start the 20 second countdown
 */
function start() {
    // Create timer
    browser.alarms.create('countdown', {
        delayInMinutes: 0.33
    });

    // Update GUI
    document.getElementById('start').style.display = 'none';
    document.getElementById('complete').style.display = 'inline';
    document.getElementById('timer').className = 'animate';
    document.getElementById('timer-bar').className = 'animate';
    document.getElementById('complete').addEventListener('click', closeWindow);
}

/**
 * Handle 20 second countdown end
 * @param {Object} alarmInfo
 */
function timerTrigger(alarmInfo) {
    if (alarmInfo.name == 'countdown') {
        // Play alert sound
        document.getElementById('audio').play();

        // Update GUI
        document.body.className = 'blinking';
        document.getElementById('complete').disabled = false;
        document.getElementById('beforeMsg').style.display = 'none';
        document.getElementById('afterMsg').style.display = 'block';

        // Reset browserAction
        browser.runtime.sendMessage({
            command: 'activityFinished'
        });
    }
}

/**
 * Close the current window
 */
function closeWindow() {
    browser.windows.getCurrent((window) => {
        browser.windows.remove(window.id);
    });
}
