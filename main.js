const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const uploadBtn = document.getElementById("uploadBtn");
const clearBtn = document.getElementById("clearBtn");
const recordingLabelText = document.getElementById("recording_label");

let recordingLabelInterval;

let context, mediaSource, mediaProcessor, mp3Encoder, stream;
let recordedChunks = [];

startBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);
uploadBtn.addEventListener("click", uploadRecording);
clearBtn.addEventListener("click", clearRecordings);

document.addEventListener("DOMContentLoaded", () => {
  renderItemsFromApi(
    "https://anhlt-record-api.onrender.com/list_files",
    "list_audio"
  );
  startBtn.disabled = false;
  stopBtn.disabled = true;
  uploadBtn.disabled = true;
});

async function startRecording() {
  const options = { audio: true, video: false };
  stream = await navigator.mediaDevices.getUserMedia(options);
  recordedChunks = [];
  context = new AudioContext();
  await context.audioWorklet.addModule("/get-voice-node.js");
  mp3Encoder = new lamejs.Mp3Encoder(1, context.sampleRate, 128);

  mediaSource = context.createMediaStreamSource(stream);

  mediaProcessor = new AudioWorkletNode(context, "get-voice-node");
  mediaProcessor.port.onmessage = (e) => {
    const channelData = e.data[0];
    _decode(channelData);
  };

  mediaSource.connect(mediaProcessor).connect(context.destination);

  // Update status indicator to show recording status
  recordingStartTime = Date.now();

  // Start interval to update recording length text and recorded time label
  recordingLabelInterval = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsedTime % 60).toString().padStart(2, "0");
    recordingLabelText.textContent = `${minutes}:${seconds}`;
  }, 100); // Update every second

  // Enable stop button and disable start button
  stopBtn.disabled = false;
  startBtn.disabled = true;
  uploadBtn.disabled = true;
}

function stopRecording() {
  if (mediaProcessor && mediaProcessor.port) {
    mediaProcessor.port.postMessage({ cmd: "stop" });
  }
  if (mediaProcessor) {
    mediaProcessor.disconnect();
  }
  if (mediaSource) {
    mediaSource.disconnect();
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  if (context) {
    context.close().then(() => {
      // Finalize MP3 file
      const mp3Buffer = mp3Encoder.flush();
      if (mp3Buffer.length > 0) {
        recordedChunks.push(mp3Buffer);
      }

      // Create a Blob from the recorded chunks
      const audioBlob = new Blob(recordedChunks, { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Find and replace the existing audio file element with the new one
      const existingAudioElement = document.querySelector("audio");
      if (existingAudioElement) {
        existingAudioElement.src = audioUrl; // Update the source of the existing audio element
      } else {
        // If no existing audio element, create a new one
        document.body.appendChild(audioElement);
      }

      // Enable the upload button
      uploadBtn.disabled = false;

      // Update status indicator to show idle status
      recordingLabelText.textContent = "00:00"; // Reset recording length text

      // Clear recording length interval
      clearInterval(recordingLabelInterval); // Stop updating the recording length text

      context = null;
      mediaProcessor = null;
      mediaSource = null;
      mp3Encoder = null;
      stream = null;
    });
  }

  // Enable start button and disable stop button
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function _decode(channelData) {
  const mp3Buffer = mp3Encoder.encodeBuffer(channelData);
  if (mp3Buffer.length > 0) {
    recordedChunks.push(new Uint8Array(mp3Buffer));
  }
}

function uploadRecording() {
  uploadBtn.disabled = true;

  // Create a Blob from the recorded chunks
  const audioBlob = new Blob(recordedChunks, { type: "audio/mp3" });

  // Prepare the form data for the upload
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.mp3");

  fetch("https://anhlt-record-api.onrender.com/upload_audio", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      alert("Tải lên thành công!");
      renderItemsFromApi(
        "https://anhlt-record-api.onrender.com/list_files",
        "list_audio"
      );
    })
    .catch((error) => {
      console.error("Error uploading audio file:", error);
      alert("Đã có lỗi!");
      uploadBtn.disabled = false;
    });
}

function clearRecordings() {
  fetch("https://anhlt-record-api.onrender.com/clear_audios", {
    method: "DELETE",
  })
    .then(() => {
      const targetDiv = document.getElementById("list_audio");
      while (targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.firstChild);
      }
      alert("Deleted all audio files!");
    })
    .catch((error) => {
      console.error("Error deleting audio files:", error);
      alert("Failed to delete audio files");
    });
}

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
          const playButtonDiv = document.createElement("div");
          playButtonDiv.classList.add("play-button");

          const playButtonLink = document.createElement("a");
          // when click on link, set url to player
          playButtonLink.addEventListener("click", () => {
            setUrlToPlayer(
              "https://anhlt-record-api.onrender.com/files/" + item
            );
          });
          playButtonLink.classList.add("play-title");
          playButtonLink.textContent = item;
          playButtonDiv.appendChild(playButtonLink);
          targetDiv.appendChild(playButtonDiv);
        });
    })
    .catch((error) => console.error("Error fetching data:", error));
}

function setUrlToPlayer(url) {
  document.getElementById("audioPlayer").src = url;
}
