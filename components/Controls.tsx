import React from 'react';
import { Status } from '../types';

interface ControlsProps {
  status: Status;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const MicrophoneIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM11 5a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V5Z"></path>
    <path d="M19 10a1 1 0 0 0-2 0v1a5 5 0 0 1-10 0v-1a1 1 0 0 0-2 0v1a7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-2.08A7 7 0 0 0 19 11v-1Z"></path>
  </svg>
);

const StopIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 7h10v10H7z"></path>
  </svg>
);

const ResetIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4a8 8 0 0 0-8 8h3a5 5 0 0 1 5-5v3l4-4-4-4v3Zm6 10a5 5 0 0 1-5 5v-3l-4 4 4 4v-3a8 8 0 0 0 8-8h-3Z"/>
    </svg>
);


const Controls: React.FC<ControlsProps> = ({ status, onStart, onStop, onReset }) => {
  switch (status) {
    case Status.Active:
      return (
        <button
          onClick={onStop}
          className="relative flex items-center justify-center w-24 h-24 bg-red-600 text-white rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-opacity-50"
          aria-label="End session"
        >
          <span className="absolute h-full w-full bg-red-500 rounded-full animate-ping opacity-75"></span>
          <StopIcon className="w-10 h-10" />
        </button>
      );
    case Status.Ended:
    case Status.Error:
       return (
         <button
          onClick={onReset}
          className="flex items-center justify-center w-24 h-24 bg-gray-600 text-white rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-50"
          aria-label="Start New Session"
        >
          <ResetIcon className="w-10 h-10" />
        </button>
      );
    case Status.Idle:
    default:
      return (
        <button
          onClick={onStart}
          className="flex items-center justify-center w-24 h-24 bg-blue-600 text-white rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50"
          aria-label="Start session"
        >
          <MicrophoneIcon className="w-10 h-10" />
        </button>
      );
  }
};

export default Controls;
