import React from 'react';
import { Status } from '../types';
import ReactMarkdown from 'react-markdown';

interface ClinicalSummaryDisplayProps {
    status: Status;
    isSummarizing: boolean;
    summary: string | null;
}

const SummaryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
);


const ClinicalSummaryDisplay: React.FC<ClinicalSummaryDisplayProps> = ({ status, isSummarizing, summary }) => {

    const renderContent = () => {
        if (status === Status.Idle || status === Status.Active) {
             return (
                <div className="w-full h-full min-h-64 flex items-center justify-center bg-gray-300/30 rounded-lg border-2 border-dashed border-gray-300 p-4">
                    <p className="text-gray-400 text-center">The clinical summary will appear here after the session ends.</p>
                </div>
            );
        }

        if (isSummarizing) {
            return (
                <div className="w-full h-full min-h-64 flex flex-col items-center justify-center bg-gray-300/30 rounded-lg border-2 border-dashed border-gray-300 p-4">
                     <div className="w-12 h-12 border-4 border-t-transparent border-blue-400 rounded-full animate-spin"></div>
                     <p className="text-gray-400 mt-4">Generating clinical summary...</p>
                </div>
            );
        }

        if (summary) {
            return (
                <div className="max-w-full overflow-auto bg-gray-200 p-4 rounded-md">
                    <pre className="text-black whitespace-pre-wrap font-sans text-base"><ReactMarkdown>{summary}</ReactMarkdown></pre>
                </div>
            );
        }
        
        return (
             <div className="w-full h-full min-h-64 flex items-center justify-center bg-gray-300/30 rounded-lg border-2 border-dashed border-gray-300 p-4">
                <p className="text-gray-400">Waiting for session to end to generate summary.</p>
            </div>
        );
    };


    return (
        <div className="w-full max-h-[50vh] overflow-y-auto">
             <h2 className="text-xl font-semibold text-gray-600 mb-4 flex items-center"><SummaryIcon /> Clinical Summary</h2>
            {renderContent()}
        </div>
    )
};

export default ClinicalSummaryDisplay;
