/**
 * AegisVoice AudioWorklet Downsampler
 * Runs off the main thread in the Web Audio rendering pipeline.
 * Downsamples microphone audio from hardware rate (44.1kHz / 48kHz)
 * directly to 16,000 Hz, 16-bit signed Mono Linear PCM for AssemblyAI.
 */

class DownsamplerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = (options && options.processorOptions && options.processorOptions.targetSampleRate) || 16000;
    this.bufferSize = (options && options.processorOptions && options.processorOptions.bufferSize) || 2048; // ~128ms at 16kHz
    this.outputBuffer = new Int16Array(this.bufferSize);
    this.outputIndex = 0;
    this.inputSampleRate = 48000; // default, updated dynamically on first block
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    // Mono channel input
    const channelData = input[0];
    const inputSampleRate = globalThis.sampleRate || 48000;
    const ratio = inputSampleRate / this.targetSampleRate;

    // Linear downsampling
    for (let i = 0; i < channelData.length; i += ratio) {
      const index = Math.floor(i);
      const nextIndex = Math.min(index + 1, channelData.length - 1);
      const fraction = i - index;

      // Interpolated sample between -1.0 and 1.0
      const sample = channelData[index] * (1 - fraction) + channelData[nextIndex] * fraction;

      // Clamp and convert Float32 to 16-bit signed PCM integer
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

      this.outputBuffer[this.outputIndex++] = Math.round(int16);

      // When buffer is full (~128ms chunk), emit binary frame to main thread
      if (this.outputIndex >= this.bufferSize) {
        // Send a copy or transfer the buffer
        const chunkToSend = new Int16Array(this.outputBuffer);
        this.port.postMessage({
          type: "PCM_CHUNK",
          buffer: chunkToSend.buffer,
        }, [chunkToSend.buffer]);

        this.outputIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("downsampler-processor", DownsamplerProcessor);
