import { useState, useRef } from "react";

export default function VoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [res, setRes] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;

  const startRecognition = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speech = new SpeechRecognition();
      speech.continuous = true; 
      speech.interimResults = false;
      speech.lang = "en-US";

      speech.onstart = () => {
        setIsListening(true);
        synth.cancel();
      };
      
    speech.onresult = async (event) => {
    let fintrans = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            fintrans += event.results[i][0].transcript;
        }
    }

    if (fintrans.trim() !== '') {
        const userText = fintrans;
        setTranscript(userText);
        
        recognitionRef.current.stop(); 
        await streamGemini(userText);
    } else {
        console.log("Interim result received, waiting for final transcript.");
    }
};

      speech.onend = () => {
       if (isListening) {
          console.log("speech ended. Restarting.");
          recognitionRef.current.start();
        }
      };

      speech.onerror = (event) => {
        console.error("Speech speech error:", event.error);
        if (event.error === 'no-speech') {
            console.log("No speech detected. The speech will automatically restart due to the `onend` handler.");
        }
      };

      recognitionRef.current = speech;
    }
    recognitionRef.current.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false); 
  };

  const streamGemini = async (text) => {
    setRes("");
    const res = await fetch("http://localhost:5000/api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: text })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const part = line.replace(/^data: /, "");
        if (part === "[DONE]") {
          console.log("End of stream signal received.");
          break;
        }

        try {
          const parsedPart = JSON.parse(part);
          if (parsedPart && parsedPart.text) {
            fullText += parsedPart.text;
          }
        } catch (error) {
          console.error("Skipping non-JSON part:", part);
        }
      }
    }
    setRes(fullText);

    speak(fullText);
  };

  const speak = (text) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => {
      console.log("Speech finished. Restarting speech.");
      recognitionRef.current.start();
    };
    synth.speak(utterance);
  };

  return (
    <div className={`min-h-screen w-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="absolute top-4 right-4">
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full shadow-xl">
          {darkMode ? '🌞' : '🌙'}
        </button>
      </div>
      <img src="https://live.revoltmotors.com/images/Rev.gif" className="w-24 h-24 mb-4" alt="bot" />
      <h1 className="text-3xl font-bold mb-6">Talk to Rev</h1>
      <button onClick={isListening ? stopRecognition : startRecognition} className="w-20 h-20 rounded-full shadow-lg text-2xl flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition">
        {isListening ? '⏹️' : '🎤'}
      </button>
      <div className="mt-6 text-center space-y-2 max-w-xl">
        {transcript && <p className="italic">You: {transcript}</p>}
        {res && <p>Rev: {res}</p>}
      </div>
    </div>
  );
}