/* src/speech-rec.d.ts  ▸  add wherever your sources live */

/* very small subset – just what Round 2 needs */
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart:   ((this: SpeechRecognition, ev: Event)                => any) | null;
  onresult: (e: SpeechRecognitionEvent) => any;
  onend:          ((this: SpeechRecognition, ev: Event)                => any) | null;
  onerror:        ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null; 
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

/* expose constructors on Window */
interface Window {
  webkitSpeechRecognition: { new (): SpeechRecognition };
  SpeechRecognition:       { new (): SpeechRecognition };
}

declare var webkitSpeechRecognition: {
  prototype: WebkitSpeechRecognition;
  new (): WebkitSpeechRecognition;
};