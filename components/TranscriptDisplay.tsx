import React from 'react';
import type { DialogueTurn } from '../types';
import { Status } from '../types';

interface TranscriptDisplayProps {
  status: Status;
  transcript: DialogueTurn[];
}

const TranscriptIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 4a1 1 0 100 2h10a1 1 0 100-2H5zm0 4a1 1 0 100 2h4a1 1 0 100-2H5z" clipRule="evenodd" />
        <path d="M3 18a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
);


const DoctorIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);

const PatientIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center text-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ status, transcript }) => {

    const renderContent = () => {
        if (status === Status.Idle) {
            return (
                <div className="w-full h-full min-h-64 flex items-center justify-center bg-gray-300/30 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-400">Your transcript will appear here...</p>
                </div>
            );
        }

        if (status === Status.Active && transcript.length === 0) {
            return (
                <div className="w-full h-full min-h-64 flex flex-col items-center justify-center bg-gray-400/30 rounded-lg border-2 border-dashed border-gray-400">
                     <div className="w-12 h-12 border-4 border-t-transparent border-blue-400 rounded-full animate-spin"></div>
                     <p className="text-gray-400 mt-4">Listening for conversation...</p>
                </div>
            );
        }
        
        if ((status === Status.Ended || status === Status.Active) && transcript.length === 0) {
            return (
                 <div className="w-full h-full min-h-64 flex items-center justify-center bg-gray-300/30 rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="animate-spin h-10 w-10 mr-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <p>Loading transcription...</p>
                </div>
            );
        }

        return (
            <div className="w-full bg-gray-300/50 rounded-lg p-4 space-y-4 border border-gray-300">
                {transcript.map((turn, index) => (
                    <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                        turn.speaker.toLowerCase() === 'doctor' ? 'bg-sky-900/50' : 'bg-teal-900/50'
                    }`}>
                        {turn.speaker.toLowerCase() === 'doctor' ? <DoctorIcon /> : <PatientIcon />}
                        <div>
                            <p className={`font-bold ${
                                turn.speaker.toLowerCase() === 'doctor' ? 'text-blue-300' : 'text-teal-200'
                            }`}>{turn.speaker}</p>
                            <p className="text-gray-200 whitespace-pre-wrap">{turn.dialogue}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
            <div className="w-full max-h-[50vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-600 mb-4 flex items-center">
                    <TranscriptIcon /> Live Transcript
                </h2>
                {renderContent()}
            </div>

    );
};

export default TranscriptDisplay;