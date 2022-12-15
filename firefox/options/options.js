/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Save options
function saveOptions() {
    // Save settings
    browser.storage.local.set({
        notificationMode: parseInt(document.settings.notificationMode.value),
        tempDisabled: parseInt(document.settings.tempDisabled.value),
        autoPause: parseInt(document.settings.autoPause.value),
        playChime: parseInt(document.settings.playChime.value),
        chimeVolume: document.settings.chimeVolume.value / 100,
        scheduleEnabled: parseInt(document.settings.scheduleEnabled.value),
        schedule: saveSchedule()
    });
    
    // Apply changes to Do Not Disturb setting
    if (document.settings.tempDisabled.value == 1) {
        browser.runtime.sendMessage('disabletimer');
        browser.browserAction.setBadgeText({ text: 'OFF' });
    } else {
        browser.runtime.sendMessage('enabletimer');
        browser.browserAction.setBadgeText({ text: '' });
    }

    // Check timer schedule
    browser.runtime.sendMessage('checkQuietTime');

    updateUI();
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

    // Chime volume setting
    if (typeof data.chimeVolume === 'undefined') document.settings.chimeVolume.value = 100;
    else document.settings.chimeVolume.value = data.chimeVolume * 100;
    document.getElementById('chimeVolumeLabel').textContent = document.settings.chimeVolume.value + '%';

    // Do Not Disturb setting
    if (typeof data.tempDisabled === 'undefined') document.settings.tempDisabled.value = 0;
    else document.settings.tempDisabled.value = data.tempDisabled;

    // Auto pause setting
    if (typeof data.autoPause === 'undefined') document.settings.autoPause.value = 0;
    else document.settings.autoPause.value = data.autoPause;

    // Schedule enabled setting
    if (typeof data.scheduleEnabled === 'undefined') document.settings.scheduleEnabled.value = 0;
    else document.settings.scheduleEnabled.value = data.scheduleEnabled;

    // Schedule setting
    if (typeof data.schedule === 'undefined') restoreSchedule({});
    else restoreSchedule(data.schedule);

    checkPermissions();
    updateUI();
}

/**
 * Check all optional permissions and trigger UI updates
 */
function checkPermissions() {
    if (parseInt(document.settings.notificationMode.value) == 0) {
        browser.permissions.contains(notificationsPermissions).then(processNotificationsPermissions);
    }

    browser.permissions.contains(autoPausePermissions).then(processAutoPausePermissions);
}

/**
 * Shows/Hides error messages for auto pause feature permissions
 * @param {boolean} allowed 
 */
function processAutoPausePermissions(allowed) {
    const error = document.getElementById('error-autoPausePermissionMissing');
    const inputs = document.getElementsByName('autoPause');

    if (allowed) {
        error.classList.add('hidden');
    } else {
        error.classList.remove('hidden');
        document.settings.autoPause.value = 0;
    }

    for (input of inputs) {
        input.disabled = !allowed;
    }
}

/**
 * Shows/Hides error messages for notifications permission
 * @param {boolean} isAllowed
 */
function processNotificationsPermissions(isAllowed) {
    const error = document.getElementById('error-notificationsPermissionMissing');

    if (isAllowed) {
        error.classList.add('hidden');
    } else {
        console.warn('User has selected browser notifications mode without granting the required permissions');
        error.classList.remove('hidden');
    }
}

// Update the UI based on the current settings
function updateUI() {
    const chimeVolumeSection = document.getElementById('chimeVolumeSection');
    const chimeVolumeDivider = document.getElementById('chimeVolumeDivider');

    if (parseInt(document.settings.playChime.value) == 1) {
        chimeVolumeSection.classList.remove('hidden');
        chimeVolumeDivider.classList.remove('hidden');
    } else {
        chimeVolumeSection.classList.add('hidden');
        chimeVolumeDivider.classList.add('hidden');
    }
}

// Preview chime
function previewChime() {
    const chime = new Audio('../audio/chime.ogg');
    chime.volume = document.settings.chimeVolume.value / 100;
    chime.play();
}

/**
 * Get time object
 * @param {Number} weekday
 * @param {Number} start
 * @param {Number} end
 * @returns Time object or null
 */
function getTime(weekday, start, end) {
    if (typeof times[weekday] == 'undefined') {
        return null;
    }

    for (const t of times[weekday]) {
        if (t.start == start && t.end == end) {
            return t;
        }
    }

    return null;
}

/**
 * Handle add time button click
 */
function addTimeClick() {
    const weekday = parseInt(document.getElementById('time-weekday').value);
    const startHour = parseInt(document.getElementById('time-start-hour').value);
    const startMinute = parseInt(document.getElementById('time-start-minute').value);
    const endHour = parseInt(document.getElementById('time-end-hour').value);
    const endMinute = parseInt(document.getElementById('time-end-minute').value);

    const time = addTime(weekday, startHour, startMinute, endHour, endMinute);

    if (time != null) {
        if (typeof times[weekday] == 'undefined') {
            times[weekday] = [];
        }

        times[weekday].push(time);
        saveOptions();
    }
}

/**
 * Add a time to do not disturb schedule
 * @param {Number} weekday
 * @param {Number} startHour
 * @param {Number} startMinute
 * @param {Number} endHour
 * @param {Number} endMinute
 * @returns Bar UI
 */
function addTime(weekday, startHour, startMinute, endHour, endMinute) {
    const dayStart = 0;
    const dayEnd = 24 * 60;
    const start = (startHour * 60) + startMinute;
    const end = (endHour * 60) + endMinute;

    const error = document.getElementById('time-error');
    error.textContent = '';

    if (start >= end) {
        error.textContent = browser.i18n.getMessage('errorStartTimeAfterEndTime');
        return null;
    }

    if (getTime(weekday, start, end) != null) {
        error.textContent = browser.i18n.getMessage('errorScheduleExists');
        return null;
    }

    const startPos = calculateTimePercentage(start, dayStart, dayStart, dayEnd);
    const timeSize = calculateTimePercentage(end, start, dayStart, dayEnd);

    const weekdays = document.getElementsByClassName('time-container');
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.marginLeft = `${startPos}%`;
    bar.style.width = `${timeSize}%`;
    bar.dataset.weekday = weekday;
    bar.dataset.start = start;
    bar.dataset.end = end;

    const list = document.getElementById('time-list');
    const item = document.getElementById('template-time-list-item').content.cloneNode(true).children[0];
    item.dataset.weekday = weekday;
    item.dataset.start = start;
    item.dataset.end = end;
    item.getElementsByClassName('text')[0].textContent = weekdayList[weekday];
    const itemLabel = item.getElementsByClassName('text-label')[0];
    itemLabel.textContent = `${startHour}:${pad(startMinute, 2, '0')} - ${endHour}:${pad(endMinute, 2, '0')}`;
    const itemButton = item.getElementsByTagName('button')[0];
    itemButton.title = browser.i18n.getMessage('actionDelete');
    itemButton.addEventListener('click', removeTimeClick);

    weekdays[weekday].appendChild(bar);

    let insertBefore = null;
    for (const li of list.children) {
        if (compareTimeListItems(item, li) <= 0) {
            insertBefore = li;
            break;
        }
    }

    if (insertBefore == null) {
        list.appendChild(item);
    } else {
        list.insertBefore(item, insertBefore);
    }

    return {
        weekday: weekday,
        start: start,
        end: end,
        bar: bar,
        list: item
    };
}

/**
 * Handle remove time button click
 * @param {Event} event
 */
function removeTimeClick(event) {
    let button = event.target;

    while (typeof button.dataset.weekday == 'undefined') {
        button = button.parentNode;

        if (button == document.body) {
            return;
        }
    }

    const time = getTime(
        button.dataset.weekday,
        button.dataset.start,
        button.dataset.end
    );

    if (time != null) {
        removeTime(time);
        saveOptions();
    }
}

/**
 * Remove a time schedule
 * @param {Object} time
 */
function removeTime(time) {
    time.list.parentNode.removeChild(time.list);
    time.bar.parentNode.removeChild(time.bar);

    const index = times[time.weekday].indexOf(time);
    if (index > -1) {
        times[time.weekday].splice(index, 1);
    }
}

/**
 * Calculate percentage using times
 * @param {Number} value
 * @param {Number} offset
 * @param {Number} lower
 * @param {Number} upper
 * @returns Percentage
 */
function calculateTimePercentage(value, offset, lower, upper) {
    const range = upper - lower;
    const adjustedValue = value - offset;
    return adjustedValue / range * 100;
}

/**
 * Left pad a string
 * @param {String|Number} value
 * @param {Number} places
 * @param {String} character
 * @returns Padded string
 */
function pad(value, places, character) {
    let result = value + "";

    while (result.length < places) {
        result = character + result;
    }

    return result;
}

/**
 * Sanitize schedule data for Storage API
 * @returns Storage Object
 */
function saveSchedule() {
    const data = {};

    for (const w of Object.keys(times)) {
        data[w] = [];

        for (const t of times[w]) {
            if (t == null) {
                continue;
            }

            data[w].push({
                start: t.start,
                end: t.end
            });
        }

        if (data[w].length < 1) {
            delete data[w];
        }
    }

    return data;
}

/**
 * Parse schedule data from Storage API
 * @param {Object} data
 */
function restoreSchedule(data) {
    times = {};

    for (const w of Object.keys(data)) {
        times[w] = [];

        for (const t of data[w]) {
            const startHour = Math.floor(t.start / 60);
            const startMinute = t.start % 60;
            const endHour = Math.floor(t.end / 60);
            const endMinute = t.end % 60;
            const time = addTime(w, startHour, startMinute, endHour, endMinute);
            
            if (time != null) {
                times[w].push(time);
            }
        }
    }

    document.getElementById('time-error').textContent = '';
}

/**
 * Compare time list items
 * @param {HTMLElement} item1
 * @param {HTMLElement} item2
 * @returns 
 */
function compareTimeListItems(item1, item2) {
    const item1Weekday = parseInt(item1.dataset.weekday);
    const item2Weekday = parseInt(item2.dataset.weekday);

    if (item1Weekday < item2Weekday) {
        return -1;
    } else if (item1Weekday > item2Weekday) {
        return 1;
    }

    const item1Start = parseInt(item1.dataset.start);
    const item2Start = parseInt(item2.dataset.start);

    if (item1Start < item2Start) {
        return -1;
    } else if (item1Start > item2Start) {
        return 1;
    }

    const item1End = parseInt(item1.dataset.end);
    const item2End = parseInt(item2.dataset.end);

    if (item1End < item2End) {
        return -1;
    } else if (item1End > item2End) {
        return 1;
    }

    return 0;
}

/**
 * Populate drop-down menu with numbers
 * @param {HTMLSelectElement} element
 * @param {Number} numbers
 */
function generateNumberOptions(element, numbers) {
    for (let i = 0; i <= numbers; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = pad(i, 2, '0');
        element.appendChild(option);
    }
}

const weekdayList = [
    browser.i18n.getMessage('sunday'),
    browser.i18n.getMessage('monday'),
    browser.i18n.getMessage('tuesday'),
    browser.i18n.getMessage('wednesday'),
    browser.i18n.getMessage('thursday'),
    browser.i18n.getMessage('friday'),
    browser.i18n.getMessage('saturday')
];

let times = {};
generateNumberOptions(document.getElementById('time-start-hour'), 23);
generateNumberOptions(document.getElementById('time-end-hour'), 23);
generateNumberOptions(document.getElementById('time-start-minute'), 59);
generateNumberOptions(document.getElementById('time-end-minute'), 59);

const notificationsPermissions = { permissions: ['notifications'] };
const autoPausePermissions = { permissions: ['tabs'], origins: ['<all_urls>'] };
i18nParse();
restoreOptions();
document.getElementsByTagName('form')[0].addEventListener('change', saveOptions);
document.settings.notificationMode.addEventListener('change', () => {
    // Handle optional permissions for browser notifications
    if (parseInt(document.settings.notificationMode.value) == 0) {
        browser.permissions.request(notificationsPermissions).then(processNotificationsPermissions);
    } else {
        browser.permissions.remove(notificationsPermissions);
        processNotificationsPermissions(true);
    }
});
document.getElementById('trigger-notificationsPermissionMissing').addEventListener('click', () => {
    browser.permissions.request(notificationsPermissions).then(processNotificationsPermissions);
});
document.getElementById('trigger-autoPausePermissionMissing').addEventListener('click', () => {
    browser.permissions.request(autoPausePermissions).then(processAutoPausePermissions);
});
document.settings.chimeVolume.addEventListener('change', () => {
    document.getElementById('chimeVolumeLabel').textContent = document.settings.chimeVolume.value + '%';
});
document.getElementById('time-add').addEventListener('click', addTimeClick);
document.getElementById('chimePreview').addEventListener('click', previewChime);
browser.permissions.onAdded.addListener(checkPermissions);
browser.permissions.onRemoved.addListener(checkPermissions);

