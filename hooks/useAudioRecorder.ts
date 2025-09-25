import { useState, useRef, useCallback } from 'react';

type AudioCallback = (audioBlob: Blob) => void;
const UPDATE_INTERVAL = 3000; // Process audio every 3 seconds

export const useAudioRecorder = (onAudioUpdate: AudioCallback) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const processAudio = useCallback(() => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onAudioUpdate(audioBlob);
      audioChunksRef.current = []; // Clear chunks after processing for live updates
    }
  }, [onAudioUpdate]);

  const startRecording = useCallback(async () => {
    try {
      if (isRecording) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Set up interval to process audio
      intervalRef.current = window.setInterval(processAudio, UPDATE_INTERVAL);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
      setIsRecording(false);
    }
  }, [processAudio, isRecording]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    setIsRecording(false);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        processAudio(); // Final processing for any leftover audio
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current.stop();
    } else {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording, processAudio]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Restart interval for processing
      intervalRef.current = window.setInterval(processAudio, UPDATE_INTERVAL);
    }
  }, [processAudio]);

  return { 
    isRecording, 
    isPaused,
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording 
  };
};
