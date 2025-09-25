import React, { useState, useCallback, useEffect } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAndDiarize, generateClinicalSummary } from './services/geminiService';
import TranscriptDisplay from './components/TranscriptDisplay';
import ClinicalSummaryDisplay from './components/ClinicalSummaryDisplay';

import TreatmentPlanDisplay from './components/TreatmentPlanDisplay';
import ICDCodeDisplay from './components/ICDCodeDisplay';
import { Status, AppState } from './types';




const PROMPT_OPTIONS = {
  general: {
    label: 'SOAP Note',
    prompt: `You are an AI assistant specializing in medical transcriptions for conversations in Pakistan. The conversation may be in English, Urdu, Punjabi, Pashto, or a mix of these languages. Transcribe the provided audio of a conversation between a doctor and a patient. Your task is to accurately identify who is speaking and label them as "Doctor" or "Patient". Format the entire conversation as a structured JSON array. Each object in the array must represent a single turn in the dialogue and contain two properties: "speaker" (either "Doctor" or "Patient") and "dialogue" (the transcribed text). Ensure the transcription is precise, preserves the original language spoken (do not translate), and the speaker attribution is correct.`
  },
  pediatric: {
    label: 'Initial Human presentation',
    prompt: `You are an AI assistant specializing in pediatric medical transcriptions. The conversation is between a doctor, a child (the patient), and potentially a parent. Transcribe the provided audio. Identify speakers as "Doctor", "Patient" (the child), or "Parent". Format the entire conversation as a structured JSON array. Each object must contain "speaker" and "dialogue" properties. Pay close attention to child-specific vocabulary and parent-provided history.`
  }
};






type PromptKey = keyof typeof PROMPT_OPTIONS;




const App: React.FC = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 900);

  const [appState, setAppState] = useState<AppState>({
    status: Status.Idle,
    transcript: [],
    error: null,
    isSummarizing: false,
    clinicalSummary: null,
  });

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 900);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);




  const [isProcessing, setIsProcessing] = useState(false);
  const [promptKey, setPromptKey] = useState<PromptKey>('general');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);

  const handleTranscription = useCallback(async (audioBlob: Blob) => {
    if (isProcessing || audioBlob.size < 100) return;
    setIsProcessing(true);

    const currentPrompt = promptKey === 'custom' ? customPrompt : PROMPT_OPTIONS[promptKey].prompt;
    if (!currentPrompt) {
      setAppState(prev => ({ ...prev, status: Status.Error, error: 'Cannot transcribe without a prompt. Please select a session type or enter a custom prompt.' }));
      setIsProcessing(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        if (base64Audio) {
          const result = await transcribeAndDiarize(base64Audio, audioBlob.type, currentPrompt);
          setAppState(prev => ({ 
            ...prev, 
            status: Status.Active, 
            transcript: [...prev.transcript, ...result], 
            error: null 
          }));
        } else {
          throw new Error("Failed to convert audio to base64.");
        }
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
        throw new Error("Error reading audio file.");
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during transcription.';
      console.error(errorMessage);
      setAppState(prev => ({ ...prev, status: Status.Error, error: `Transcription failed: ${errorMessage}` }));
      setIsProcessing(false);
    }
  }, [isProcessing, promptKey, customPrompt]);

  // extended hook with pause/resume
  const { isRecording, startRecording, stopRecording, pauseRecording, resumeRecording } = useAudioRecorder(handleTranscription);

  const handleStart = () => {
    setAppState({
      status: Status.Active,
      transcript: [],
      error: null,
      isSummarizing: false,
      clinicalSummary: null,
    });
    setIsPaused(false);
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
    setIsPaused(false);
    setAppState(prev => ({ ...prev, status: Status.Ended }));
  };

  const handlePause = () => {
    pauseRecording();
    setIsPaused(true);
  };

  const handleResume = () => {
    resumeRecording();
    setIsPaused(false);
  };

  const handleReset = () => {
    setAppState({
      status: Status.Idle,
      transcript: [],
      error: null,
      isSummarizing: false,
      clinicalSummary: null,
    });
    setIsPaused(false);
  };

  useEffect(() => {
    const generateSummary = async () => {
      if (appState.status === Status.Ended && appState.transcript.length > 0 && !appState.isSummarizing && !appState.clinicalSummary) {
        setAppState(prev => ({ ...prev, isSummarizing: true, error: null }));
        try {
          const { fullSummary, treatmentPlan, icdCode } = await generateClinicalSummary(appState.transcript, promptKey);
          setAppState(prev => ({
            ...prev,
            clinicalSummary: fullSummary,
            treatmentPlan,
            icdCode,
            isSummarizing: false,
          }));
          
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during summary generation.';
          console.error(errorMessage);
          setAppState(prev => ({ ...prev, status: Status.Error, error: `Summary failed: ${errorMessage}`, isSummarizing: false }));
        }
      }
    };
    generateSummary();
  }, [appState.status, appState.transcript, appState.isSummarizing, appState.clinicalSummary, promptKey]);

  const getStatusMessage = (): string => {
    switch (appState.status) {
      case Status.Idle:
        return 'Select a session type and click Record to Start.';
      case Status.Active:
        return isPaused ? 'Recording paused...' : 'Session in progress... Click stop to end.';
      case Status.Ended:
        if (appState.isSummarizing) return 'Session complete. Generating clinical summary...';
        return `Session complete. Click the refresh icon to start a new session.`;
      case Status.Error:
        return appState.error || 'An unexpected error occurred. Click the refresh icon to restart.';
      default:
        return '';
    }
  };

  return (
<div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
  <div className="w-full max-w-7xl mx-auto">

    {/* Header */}
    <header className="text-center mb-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-2 tracking-tight">
        Medical Scribe
      </h1>
      <p className="text-lg font-medium text-gray-500">
        Shaukat Khanam Memorial & Research Centre
      </p>
    </header>

    <main className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-200">
      
      {/* Note Configuration */}
      {appState.status === Status.Idle && (
        <div className="mb-8 p-6 bg-gray-50/80 rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
          
          <div className="space-y-4">
            {/* Note Type */}
            <div>
              <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-600 mb-1">
                Note Type
              </label>
              <select
                id="prompt-select"
                value={promptKey}
                onChange={(e) => setPromptKey(e.target.value as PromptKey)}
                className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              >
                {Object.entries(PROMPT_OPTIONS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Custom Prompt */}
            {promptKey === 'custom' && (
              <div>
                <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-600 mb-1">
                  Custom Transcription Prompt
                </label>
                <textarea
                  id="custom-prompt"
                  rows={4}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom transcription prompt here..."
                  className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
            )}
          </div>
        </div>
      )}


      {/* Controls */}
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-row space-x-4">
          <button
            onClick={handleStart}
            className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-800 text-white shadow-md transition"
          >
            Record
          </button>

          {isRecording && (
            <>
              {!isPaused ? (
                <button
                  onClick={handlePause}
                  className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-700 text-white shadow-md transition"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-700 text-white shadow-md transition"
                >
                  Resume
                </button>
              )}
            </>
          )}

          <button
            onClick={handleStop}
            disabled={!isRecording}
            className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-800 text-white shadow-md transition"
          >
            Stop
          </button>

          <button
            onClick={handleReset}
            className="px-5 py-2 rounded-xl bg-gray-500 hover:bg-gray-800 text-white shadow-md transition"
          >
            Reset
          </button>
        </div>

        <p className={`text-center transition-opacity duration-300 h-5 ${appState.status === Status.Error ? 'text-red-500' : 'text-gray-600'}`}>
          {getStatusMessage()}
        </p>
      </div>

      {/* Transcript + Summary */}
      <div className="mt-8 grid grid-cols-1 gap-8">
        <TranscriptDisplay
          status={appState.status}
          transcript={appState.transcript}
        />

        {/* Generate Button */}
        <button
          onClick={handleStop}
          disabled={!appState.transcript || String(appState.transcript).trim() === ""}
          className={`px-5 py-2 rounded-xl text-white shadow-md transition
            ${!appState.transcript || String(appState.transcript).trim() === "" 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-500 hover:bg-blue-800"}`}
        >
          Generate
        </button>

        <div
            style={{
              display: 'flex',
              flexDirection: isSmallScreen ? 'column' : 'row',
              gap: '20px',
              padding: '20px',
            }}
          >
          <ClinicalSummaryDisplay
            status={appState.status}
            isSummarizing={appState.isSummarizing}
            summary={appState.clinicalSummary}
          />
          <TreatmentPlanDisplay
            status={appState.status}
            isSummarizing={appState.isSummarizing}
            treatmentPlan={appState.treatmentPlan}
          />
          {/* <ICDCodeDisplay
            status={appState.status}
            isSummarizing={appState.isSummarizing}
            icdCode={appState.icdCode} */}
          {/* /> */}
        </div>
          <ICDCodeDisplay
            status={appState.status}
            isSummarizing={appState.isSummarizing}
            icdCode={appState.icdCode}
          />



      </div>
    </main>

    <footer className="text-center text-lg font-medium text-gray-500 mt-6">
      <p>Powered by SKM</p>
    </footer>
  </div>
</div>
  );
};

export default App;
