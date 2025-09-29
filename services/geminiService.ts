import { GoogleGenAI, Type } from "@google/genai";
import type { DialogueTurn } from "../types";

const API_KEY = "AIzaSyBcY0xeQVf44CAUYaF0WBh4-rRuTDAatIo";

// if (!API_KEY) {
//   throw new Error("API_KEY environment variable not set");
// }

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = "gemini-2.5-flash";


const transcriptionPrompt = `
You are an AI assistant specializing in medical transcriptions for conversations in Pakistan.
The conversation may be in English, Urdu, Punjabi (pakistani), Pashto, or a mix of these languages.
the response script must be in Roman English/Urdu. 
Transcribe the provided audio of a conversation between a doctor and a patient. Your task is to accurately identify who is speaking and label them as "Doctor" or "Patient".
Remove any work or sometthing that is considered as identifier (such as Name , City , profession )
Each object in the array must represent a single turn in the dialogue and contain two properties: "speaker" (either "Doctor" or "Patient") and "dialogue" (the transcribed text).
Ensure the transcription is precise, preserves the original language spoken (do not translate), and the speaker attribution is correct.
`;







const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      speaker: {
        type: Type.STRING,
        description: "The identified speaker, e.g., 'Doctor', 'Patient', 'Parent'."
      },
      dialogue: {
        type: Type.STRING,
        description: "The transcribed text for this speaker's turn."
      },
    },
    required: ["speaker", "dialogue"],
  },
};

export const transcribeAndDiarize = async (audioBase64: string, mimeType: string): Promise<DialogueTurn[]> => {
  try {
    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: transcriptionPrompt // Use the dynamically passed prompt from the UI
    };
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [audioPart, textPart] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      // Return empty array for silent audio, not an error
      return [];
    }

    const parsedResult = JSON.parse(jsonText);
    
    if (!Array.isArray(parsedResult)) {
      console.error("Parsed result is not an array:", parsedResult);
      throw new Error("The transcribed data is not in the expected format.");
    }
    
    return parsedResult as DialogueTurn[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};

const generalSummaryPrompt = `
You are a clinical summarizer. Read the transcript below and output must ve in this followed format:

'''
  (A) Clinical Summary (SOAP format):
  **(B) Treatment Plan (Based on UpToDate Clinical Guidelines):**
  **(C) ICD-10 Code:**
  '''






  The Documented Language is Just English. So it must translate it into english. 

  (A) Clinical Summary (SOAP format)
    S: (Subjective):
    O: (Objective):
    A: (Assessment):
    P: (Plan):

**(B) Treatment Plan (Based on UpToDate Clinical Guidelines):**

    Diagnosis Confirmation:

    Obtain comprehensive history and physical examination.

    Order relevant diagnostic tests, including [list labs/imaging if applicable], to confirm diagnosis and rule out differential diagnoses.

    Initial Management:

    Begin with [conservative therapy/medications/observation] depending on severity.

    For mild cases, initiate [first-line therapy] such as [example: NSAIDs, physical therapy, hydration, etc.].

    Pharmacologic Therapy:

    First-line: [drug name, dose, frequency] for [duration].

    Consider adjunctive therapy with [supportive medications or supplements] as clinically indicated. (Must consider the British Standards)

    Monitor for side effects and therapeutic efficacy.

    Non-Pharmacologic Management:

    Recommend lifestyle modifications: [e.g., dietary changes, weight management, exercise].

    Refer to [e.g., physical therapy, behavioral counseling, dietary consultation] as needed.

    Follow-Up Plan:

    Reassess patient in [time frame] to monitor response to therapy.

    Adjust treatment based on symptom progression and test results.

    Provide education on [condition, medication adherence, red flag symptoms].

    Escalation of Care:

    If no improvement or condition worsens, consider [second-line therapy, referral to specialist, surgical options if applicable].

    Preventive Measures:

    Recommend appropriate vaccinations, screenings, or prophylactic measures per guideline.



**(C) ICD-10 Code:**
 - Primary Diagnosis: [Insert Condition] — ICD-10: [e.g., M54.5 for Low Back Pain]
 - make sure to specify exactly each disease with their respected ICD 10 code. 
 - it must not forget the accuracy and look for UpToDate.com Resource to find


Rules:
- You write only in documented english Style. Do not use any Word in any diffeent langauage. 
- The conversation may be Urdu, Punjabi, Pashto, or English mixed. For (A), write in clear English medical style.
- Normalize medication dose/frequency/duration when stated; if unsure, use null.
- Extract only what is supported by the conversation (no hallucinations). Add "confidence" fields where useful.
- If doctor vs patient role is unclear, say so.
- Remove any word or sometthing that is considered as identifier (such as Name , City , profession )
`;

const pediatricSummaryPrompt = `
   The Documented Language is Just English. So it must translate it into english. 
Follow this output format:
'''

  **(A) Initial Presentation of Patient:**:
  **(B) Treatment Plan (Based on UpToDate Clinical Guidelines):**
  **(C) ICD-10 Code:** '''


**(A) Initial Presentation of Patient:**
   You are a clinical summarizer specializing in pediatrics. Read the transcript between a doctor, child, and/or parent:

  "Please write a comprehensive initial H&P (History & Physical) note for a new patient encounter. The note should include the following sections:**

  Chief Complaint (CC):

  A brief statement in the patient’s own words explaining why they are seeking care.

  History of Present Illness (HPI):

  A detailed chronological description of the patient's current symptoms, including onset, location, duration, characteristics, aggravating/relieving factors, associated symptoms, and any treatments tried.

  Past Medical History (PMH):

  Chronic illnesses, hospitalizations, surgeries, injuries, and past treatments.

  Medications:

  All current medications with dosages and frequency, including over-the-counter and herbal supplements.

  Allergies:

  Medication, food, or environmental allergies with reactions described.

  Family History:

  Relevant medical history of immediate family members (parents, siblings, children).

  Social History:

  Smoking, alcohol, drug use, occupation, living situation, sexual history, and other lifestyle factors.

  Review of Systems (ROS):

  A system-by-system inventory of symptoms reported by the patient.

  Physical Examination:

  Objective findings from head-to-toe exam, including vital signs.

  Assessment:

  Summary of key findings and differential diagnosis.

  Plan:

  Proposed diagnostic workup, treatments, referrals, and follow-up.

  Make sure the note is written in a formal, clinical style appropriate for use in a medical record.



**(B) Treatment Plan (Based on UpToDate Clinical Guidelines):**

  Diagnosis Confirmation:

  Obtain comprehensive history and physical examination.

  Order relevant diagnostic tests, including [list labs/imaging if applicable], to confirm diagnosis and rule out differential diagnoses.

  Initial Management:

  Begin with [conservative therapy/medications/observation] depending on severity.

  For mild cases, initiate [first-line therapy] such as [example: NSAIDs, physical therapy, hydration, etc.].

  Pharmacologic Therapy:

  First-line: [drug name, dose, frequency] for [duration]. (Must consider the British Standards)

  Consider adjunctive therapy with [supportive medications or supplements] as clinically indicated.

  Monitor for side effects and therapeutic efficacy.

  Non-Pharmacologic Management:

  Recommend lifestyle modifications: [e.g., dietary changes, weight management, exercise].

  Refer to [e.g., physical therapy, behavioral counseling, dietary consultation] as needed.

  Follow-Up Plan:

  Reassess patient in [time frame] to monitor response to therapy.

  Adjust treatment based on symptom progression and test results.

  Provide education on [condition, medication adherence, red flag symptoms].

  Escalation of Care:

  If no improvement or condition worsens, consider [second-line therapy, referral to specialist, surgical options if applicable].

  Preventive Measures:

  Recommend appropriate vaccinations, screenings, or prophylactic measures per guideline.

**(C) ICD-10 Code:**
 - Primary Diagnosis: [Insert Condition] — ICD-10: [e.g., M54.5 for Low Back Pain]
 - make sure to specify exactly each disease with their respected ICD 10 code. 
 - it must not forget the accuracy and look for UpToDate.com Resource to find






Rules:
- You write only in documented english Style. Do not use any Word in any diffeent langauage.  
- The conversation may be in mixed languages. For (A), write in clear English medical style.
- Extract only what is supported by the conversation.
- Remove any word or sometthing that is considered as identifier (such as Name , City , profession )
`;

const cardiologySummaryPrompt = `
You are a clinical summarizer specializing in cardiology. Read the transcript of a cardiology consultation and output TWO things:

(A) Clinical Summary (Cardiology SOAP format)
S: (Subjective) - Chief complaint (e.g., chest pain, palpitations, dyspnea), HPI, relevant cardiac risk factors (smoking, hypertension, diabetes, hyperlipidemia), and family history of cardiac disease.
O: (Objective) - Document any mentioned vitals (BP, HR), and physical exam findings (e.g., heart murmurs, edema).
A: (Assessment) - List diagnoses such as CAD, arrhythmia, heart failure.
P: (Plan) - Detail prescribed cardiovascular medications, planned diagnostic tests (ECG, echo, stress test), lifestyle modifications, and follow-up instructions.


Rules:
- Write in clear English medical style.
- Extract only what is supported by the conversation.
`;

const mentalHealthSummaryPrompt = `
You are a clinical summarizer specializing in mental health. Read the transcript of a therapy session and output TWO things, formatted for a clinical record.

(A) Session Summary (DAP Note format)
D: (Data) - Subjective reports from the client about their mood, feelings, recent events, and progress towards goals. Include objective observations of affect, appearance, and behavior.
A: (Assessment) - Your clinical assessment of the client's presentation, including themes discussed, potential progress, and challenges.
P: (Plan) - The plan for the next session, any homework or skills practice assigned, and long-term treatment goals.


Rules:
- Maintain a neutral, professional, and empathetic tone.
- Protect client privacy; focus on clinical information.
- Extract only what is supported by the conversation.
`;

const postOpSummaryPrompt = `
You are a clinical summarizer specializing in post-operative care. Read the transcript of a follow-up consultation and output TWO things:

(A) Clinical Summary (Post-Op SOAP format)
S: (Subjective) - Patient's report of pain levels (e.g., on a 1-10 scale), status of surgical site, functional ability, and any complications (e.g., fever, drainage).
O: (Objective) - Document any described observations of the wound (e.g., "clean, dry, intact"), mobility, or drain output.
A: (Assessment) - Assessment of recovery progress (e.g., "healing well," "signs of infection").
P: (Plan) - Instructions for wound care, medication adjustments (especially pain management), activity restrictions, and schedule for next follow-up.


Rules:
- Write in clear English medical style.
- Extract only what is supported by the conversation.
`;

const customSummaryPrompt = `
You are an expert at summarizing conversations. Read the transcript below, where the speakers and context have been defined by a user. Your task is to produce a concise and accurate clinical summary in a standard SOAP format.

(A) Clinical Summary (SOAP format)
S: (Subjective) - What the patient, client, or primary speaker reports.
O: (Objective) - Factual, observable information mentioned in the dialogue.
A: (Assessment) - Your analysis of the situation based on the subjective and objective information.
P: (Plan) - The proposed next steps, treatments, or actions discussed.

Rules:
- Adapt the summary to the roles and context implied in the transcript.
- Extract only information that is directly supported by the conversation. Do not invent or infer information.
- Write in clear, professional English.
`;


const SUMMARY_PROMPTS: Record<string, string> = {
  'general': generalSummaryPrompt,
  'pediatric': pediatricSummaryPrompt,
  // 'cardiology': cardiologySummaryPrompt,
  // 'mental_health': mentalHealthSummaryPrompt,
  // 'post_op': postOpSummaryPrompt,
  // 'custom': customSummaryPrompt, // Use the dedicated prompt for custom session types.
};


export const generateClinicalSummary = async (transcript: DialogueTurn[], promptKey: string): Promise<{
  fullSummary: string;
  treatmentPlan: string | null;
  icdCode: string | null;
}> => {
  try {
    const formattedTranscript = transcript
      .map(turn => `${turn.speaker}: ${turn.dialogue}`)
      .join('\n');

    const summaryPrompt = SUMMARY_PROMPTS[promptKey] || SUMMARY_PROMPTS['general'];

    const fullPrompt = `${summaryPrompt}\n\n--- TRANSCRIPT ---\n${formattedTranscript}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });

    const Summary = response.text.trim();

    const startIndex = Summary.indexOf("**(B) Treatment Plan (Based on UpToDate Clinical Guidelines):**");
    const fullSummary = startIndex !== -1 ? Summary.slice(0, startIndex).trim() : Summary;
    
    // Extract treatment plan content AFTER the header
    const treatmentPlanMatch = Summary.match(/\*\*\(B\)\s+Treatment Plan \(Based on UpToDate Clinical Guidelines\):\*\*([\s\S]*?)(?=\*\*\(C\)\s+ICD-10 Code:\*\*|$)/
    );
    
    const treatmentPlan = treatmentPlanMatch ? treatmentPlanMatch[1].trim() : "";
    
    // Extract ICD code content AFTER the header
    const icdCodeMatch = Summary.match(/\*\*\(C\)\s+ICD-10 Code:\*\*([\s\S]*)/);
    
    const icdCode = icdCodeMatch ? icdCodeMatch[1].trim() : "";

    return {
      fullSummary,
      treatmentPlan,
      icdCode,
    };

  } catch (error) {
    console.error('Error generating clinical summary:', error);
    throw error;
  }
};
