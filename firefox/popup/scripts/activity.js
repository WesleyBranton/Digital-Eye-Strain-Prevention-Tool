document.getElementById('start').addEventListener('click',start);

// Start the 20s countdown
function start() {
	// Create timer
	browser.alarms.create('countdown',{delayInMinutes:0.33});
	browser.alarms.onAlarm.addListener(timerTrigger);
	
	// Update GUI
	document.getElementById('start').style.display = 'none';
	document.getElementById('complete').style.display = 'inline';
	document.getElementById('timer').className = 'animate';
	document.getElementById('timer-bar').className = 'animate';
	document.getElementById('complete').addEventListener('click',gatherWindowInfo);
}

// Handle 20s countdown end
function timerTrigger(alarmInfo) {
	if (alarmInfo.name == 'countdown') {
		// Play alert sound
		document.getElementById('audio').play();
		
		// Update GUI
		document.body.className = 'blinking';
		document.getElementById('complete').disabled = false;
		document.getElementById('beforeMsg').style.display = 'none';
		document.getElementById('afterMsg').style.display = 'block';
	}
}

// Start window close procedure
function gatherWindowInfo() {
	var getting = browser.windows.getCurrent();
	getting.then(closeWindow);
}

// Close popup window
function closeWindow(windowInfo) {
	browser.windows.remove(windowInfo.id);
}