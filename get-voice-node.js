class GetVoiceNode extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputList, outputList, parameters) {
    if (inputList.length > 0 && inputList[0].length > 0) {
      this.port.postMessage(inputList[0]);
    }
    return true;
  }
}
registerProcessor("get-voice-node", GetVoiceNode);
