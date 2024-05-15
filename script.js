const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const uploadBtn = document.getElementById("uploadBtn");
const statusCircle = document.getElementById("statusCircle");
const recordingLengthText = document.getElementById("recordingLength");
const recordedTimeLabel = document.getElementById("recordedTimeLabel");
let mediaRecorder;
let recordedChunks = [];
let recordingStartTime;
let recordingLengthInterval;
let stream; // Define stream variable in a broader scope

// Disable the stop button initially
stopBtn.disabled = true;

document.addEventListener("DOMContentLoaded", () => {
  const permission = localStorage.getItem("audioPermission");
  if (permission === "granted") {
    console.log(
      "Audio recording permission already granted. Proceed with recording."
    );
    stream = navigator.mediaDevices.getUserMedia();
    // Code to start audio recording
  } else {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((userStream) => {
        localStorage.setItem("audioPermission", "granted");
        stream = userStream;
        startBtn.disabled = false; // Enable start button once permission is granted
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  }
});

startBtn.addEventListener("click", () => {
  if (stream) {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    mediaRecorder.start();

    // Update status indicator to show recording status
    statusCircle.style.backgroundColor = "red";
    recordingStartTime = Date.now();

    // Start interval to update recording length text and recorded time label
    recordingLengthInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsedTime % 60).toString().padStart(2, "0");
      recordingLengthText.textContent = `Recording Length: ${minutes}:${seconds}`;
      recordedTimeLabel.textContent = `Recorded Time: ${minutes}:${seconds}`;
    }, 1000); // Update every second

    // Enable the stop button and disable the start button
    stopBtn.disabled = false;
    startBtn.disabled = true;
  }
});

stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      audioElement.controls = true;

      // Find and replace the existing audio file element with the new one
      const existingAudioElement = document.querySelector("audio");
      if (existingAudioElement) {
        existingAudioElement.src = audioUrl; // Update the source of the existing audio element
      } else {
        // If no existing audio element, create a new one
        document.body.appendChild(audioElement);
      }

      // Enable the start button and disable the stop button
      stopBtn.disabled = true;
      startBtn.disabled = false;

      // Update status indicator to show idle status
      statusCircle.style.backgroundColor = "grey"; // Change color to grey
      recordingLengthText.textContent = ""; // Reset recording length text

      // Clear recording length interval
      clearInterval(recordingLengthInterval); // Stop updating the recording length text

      // Reset the recorded time label
      recordedTimeLabel.textContent = "";
    };
  }
});

uploadBtn.addEventListener("click", () => {
  // Implement file upload logic to your API here
  // You can use fetch API or XMLHttpRequest to send the recorded audio file to the server
});
