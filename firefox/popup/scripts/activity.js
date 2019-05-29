browser.alarms.create('countdown',{delayInMinutes:0.33});
browser.alarms.onAlarm.addListener(timerTrigger);
document.getElementById('complete').addEventListener('click',gatherWindowInfo);
document.onkeypress = function(e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		if (document.getElementById('complete').disabled == false) {
			gatherWindowInfo();
		}
	} else if (e.keyCode == 8 || e.keyCode == 122 || e.keyCode == 27) {
		e.preventDefault();
	}
};

function timerTrigger(alarmInfo) {
	if (alarmInfo.name == 'countdown') {
		document.getElementById('audio').play();
		document.body.className = 'blinking';
		document.getElementById('complete').disabled = false;
		document.getElementById('beforeMsg').style.display = 'none';
		document.getElementById('afterMsg').style.display = 'block';
	}
}

function gatherWindowInfo() {
	var getting = browser.windows.getCurrent();
	getting.then(closeWindow);
}

function closeWindow(windowInfo) {
	browser.windows.remove(windowInfo.id);
}