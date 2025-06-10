let startTime;
let timerInterval;
let totalStudyTime = 0; // in seconds
let logs = [];

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const endSessionBtn = document.getElementById("endSessionBtn");
const breakInfoEl = document.getElementById("breakInfo");
const logsEl = document.getElementById("logs");

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopOrReset);
endSessionBtn.addEventListener("click", endSession);

function startTimer() {
  if (!timerInterval) {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    stopBtn.textContent = "Stop";
    stopBellReminder(); // Stop bell when starting again
    breakInfoEl.textContent = ""; // Clear break reminder when starting
  }
}

function updateTimer() {
  const elapsed = Date.now() - startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  timerEl.textContent = `${pad(minutes)}:${pad(seconds)}`;
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

function stopOrReset() {
  if (stopBtn.textContent === "Stop") {
    clearInterval(timerInterval);
    timerInterval = null;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    totalStudyTime += elapsed;

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    // Break calculation
    const decimalMinutes = minutes + seconds / 60;
    const breakDecimal = decimalMinutes / 5;
    const breakMinutes = Math.floor(breakDecimal);
    const breakSeconds = Math.round((breakDecimal - breakMinutes) * 60);

    // Next start time
    const now = new Date();
    now.setMinutes(now.getMinutes() + breakMinutes);
    now.setSeconds(now.getSeconds() + breakSeconds);

    const nextStartTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    breakInfoEl.textContent = `Take a break for ${pad(breakMinutes)}:${pad(breakSeconds)} min. Be back at ${nextStartTime}.`;

    // Log stop
    const logTime = new Date();
    logs.push(logTime.toLocaleTimeString());
    updateLogs();

    stopBtn.textContent = "Reset";

    // Start bell reminder and notification after break time
    const totalBreakMs = (breakMinutes * 60 + breakSeconds) * 1000;
    setTimeout(() => {
      startBellReminder();
      showNotification();
    }, totalBreakMs);
  } else {
    timerEl.textContent = "00:00";
    breakInfoEl.textContent = "";
    stopBtn.textContent = "Stop";
  }
}

function updateLogs() {
  logsEl.innerHTML = "<h3 style='color: white;'>Stop Times:</h3><ul>" +
    logs.map(time => `<li>${time}</li>`).join('') +
    "</ul>";
}

function endSession() {
  // If timer is still running, add the current elapsed time to totalStudyTime
  if (timerInterval) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    totalStudyTime += elapsed;
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Stop the bell reminder
  stopBellReminder();

  // Clear break reminder text
  breakInfoEl.textContent = "";

  // Format total time as hh:mm:ss
  const hours = Math.floor(totalStudyTime / 3600);
  const minutes = Math.floor((totalStudyTime % 3600) / 60);
  const seconds = totalStudyTime % 60;

  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  alert(`Session ended!\nTotal study time: ${formattedTime}.`);

  // Reset everything
  totalStudyTime = 0;
  logs = [];
  updateLogs();
  timerEl.textContent = "00:00";
  stopBtn.textContent = "Stop";
}

let bellInterval; // Global variable to control the bell

function startBellReminder() {
  const bellSound = document.getElementById("bellSound");

  bellInterval = setInterval(() => {
    bellSound.play();
  }, 1000);
}

function stopBellReminder() {
  clearInterval(bellInterval);
}

function showNotification() {
  const permissionStatus = localStorage.getItem("notificationPermission");

  if (permissionStatus === "granted") {
    new Notification("Time’s up!", {
      body: "Get back to work.",
      icon: "icon.png"
    });
  } else if (permissionStatus === "default" || permissionStatus === null) {
    // Only ask once
    Notification.requestPermission().then(permission => {
      localStorage.setItem("notificationPermission", permission);
      if (permission === "granted") {
        new Notification("Time’s up!", {
          body: "Get back to work.",
          icon: "icon.png"
        });
      }
    });
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then(registration => {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch(err => {
      console.error("Service Worker registration failed:", err);
    });
}
