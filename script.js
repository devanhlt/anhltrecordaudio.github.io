const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const uploadBtn = document.getElementById("uploadBtn");
const recordingLengthText = document.getElementById("recordingLength");
let mediaRecorder;
let recordedChunks = [];
let recordingStartTime;
let recordingLengthInterval;
let stream; // Define stream variable in a broader scope

// Disable the stop button initially
stopBtn.disabled = true;
uploadBtn.disabled = true;

function renderItemsFromApi(apiUrl, targetDivId) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      const targetDiv = document.getElementById(targetDivId);
      // Clear all existing child nodes
      while (targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.firstChild);
      }
      data &&
        data.forEach((item) => {
          const targetDiv = document.getElementById("list_audio"); // Replace "targetDiv" with the ID of the target div element
          const playButtonDiv = document.createElement("div");
          playButtonDiv.classList.add("play-button");

          const playButtonLink = document.createElement("a");
          playButtonLink.classList.add("play-title");
          playButtonLink.textContent = item;
          playButtonLink.target = "_blank";
          playButtonLink.href =
            "https://anhlt-record-api.onrender.com/files/" + item; // Replace "item" with the variable containing the audio file name

          const playIcon = document.createElement("i");
          playIcon.classList.add("play-icon");
          playIcon.innerHTML = "&#9654;";

          playButtonLink.appendChild(playIcon);
          playButtonDiv.appendChild(playButtonLink);
          targetDiv.appendChild(playButtonDiv);
        });
    })
    .catch((error) => console.error("Error fetching data:", error));
}

document.addEventListener("DOMContentLoaded", () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((userStream) => {
      stream = userStream;
      startBtn.disabled = false; // Enable start button once permission is granted
      renderItemsFromApi(
        "https://anhlt-record-api.onrender.com/list_files",
        "list_audio"
      );
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
    });
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
    recordingStartTime = Date.now();

    // Start interval to update recording length text and recorded time label
    recordingLengthInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsedTime % 60).toString().padStart(2, "0");
      recordingLengthText.textContent = `${minutes}:${seconds}`;
    }, 1000); // Update every second

    // Enable the stop button and disable the start button
    stopBtn.disabled = false;
    startBtn.disabled = true;
    uploadBtn.disabled = true;
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
      uploadBtn.disabled = false;

      // Update status indicator to show idle status
      recordingLengthText.textContent = ""; // Reset recording length text

      // Clear recording length interval
      clearInterval(recordingLengthInterval); // Stop updating the recording length text
    };
  }
});

uploadBtn.addEventListener("click", () => {
  uploadBtn.disabled = true;
  // Upload the audio file
  const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
  // Assuming formData contains the audio file data
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.wav");
  fetch("https://anhlt-record-api.onrender.com/upload_audio", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      alert("Audio file uploaded successfully");
      renderItemsFromApi(
        "https://anhlt-record-api.onrender.com/list_files",
        "list_audio"
      );
    })
    .catch((error) => {
      uploadBtn.disabled = false;
      alert("Failed!");
    });
});

clearBtn.addEventListener("click", () => {
  fetch("https://anhlt-record-api.onrender.com/clear_audios", {
    method: "DELETE",
  })
    .then(() => {
      const targetDiv = document.getElementById("list_audio");
      while (targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.firstChild);
      }
      alert("Deleted!");
    })
    .catch((error) => {
      alert("Failed!");
    });
});
