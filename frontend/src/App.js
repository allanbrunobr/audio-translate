import React, { useState, useRef } from 'react';
import Recorder from './utils/recorder';
import './App.css';
import axios from 'axios';
import AwsTranscribeImage from './assets/AWS_Transcribe.jpg'; // Atualizar o caminho para o diretório correto


const App = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const [medicalText, setMedicalText] = useState("");
    const [medicalAnalysis, setMedicalAnalysis] = useState("");
    const [activeSection, setActiveSection] = useState(null);
    const audioContextRef = useRef(null);
    const gumStreamRef = useRef(null);
    const recorderRef = useRef(null);

    const startRecording = async () => {
        setIsRecording(true);
        setIsPaused(false);

        const constraints = { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const input = audioContextRef.current.createMediaStreamSource(stream);
        gumStreamRef.current = stream;
        recorderRef.current = new Recorder(input, { numChannels: 1 });
        recorderRef.current.record();
    };

    const pauseRecording = () => {
        if (recorderRef.current.recording) {
            recorderRef.current.stop();
            setIsPaused(true);
        } else {
            recorderRef.current.record();
            setIsPaused(false);
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        setIsPaused(false);
        recorderRef.current.stop();
        gumStreamRef.current.getAudioTracks()[0].stop();

        recorderRef.current.exportWAV(blob => {
            const url = URL.createObjectURL(blob);
            const filename = new Date().toISOString() + '.wav';
            setRecordings(prev => [...prev, { url, filename, blob }]);
        });
    };

    const uploadRecordings = async () => {
        const formData = new FormData();
        recordings.forEach(recording => {
            formData.append('files', recording.blob, recording.filename);
        });

        try {
            const response = await axios.post('http://localhost:8000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Upload successful:', response.data);
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    };

    const handleMedicalAnalysis = async () => {
        try {
            const response = await axios.post('http://localhost:8000/analyze_medical_text', medicalText, {
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            console.log('Response:', response.data); // Verifique a resposta no console
            setMedicalAnalysis(response.data);
        } catch (error) {
            console.error('Error analyzing medical text:', error);
            setMedicalAnalysis('Error analyzing text');
        }
    };

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
    };

    return (
        <div className="App">
            <header className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('vision')}>Vision</button></li>
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('ecosystem')}>Ecosystem</button></li>
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('use-cases')}>Use Cases</button></li>
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('token')}>Token</button></li>
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('impact-report')}>Impact Report</button></li>
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('audio-recorder')}>Audio Recorder</button></li>
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('medical-text-analysis')}>Medical Text Analysis</button></li>
                    </ul>
                </div>
            </header>
            <main>
                <section id="vision" className="partners text-center mt-5">
                    <p>Trusted by</p>
                    <div className="d-flex justify-content-center">
                        <img src="bosch-logo.png" alt="Bosch" className="mx-2" />
                        <img src="mastercard-logo.png" alt="Mastercard" className="mx-2" />
                        <img src="airbus-logo.png" alt="Airbus" className="mx-2" />
                        <img src="continental-logo.png" alt="Continental" className="mx-2" />
                        <img src="ntt-logo.png" alt="NTT" className="mx-2" />
                    </div>
                </section>
                {activeSection === 'audio-recorder' && (
                    <section id="audio-recorder" className="audio-recorder-section">
                        <img src={AwsTranscribeImage} alt="AWS Transcribe" className="avatar"/>
                        <h2>Audio Recorder</h2>
                        <div id="controls">
                        <button className="btn btn-primary" onClick={startRecording} disabled={isRecording}>Record</button>
                            <button className="btn btn-primary" onClick={pauseRecording} disabled={!isRecording}>
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button className="btn btn-primary" onClick={stopRecording} disabled={!isRecording}>Stop</button>
                        </div>
                        <p><strong>Recordings:</strong></p>
                        <ol id="recordingsList">
                            {recordings.map((recording, index) => (
                                <li key={index}>
                                    <audio controls src={recording.url}></audio>
                                    <a href={recording.url} download={recording.filename}>Save to disk</a>
                                </li>
                            ))}
                        </ol>
                        {recordings.length > 0 && (
                            <button className="btn btn-primary" onClick={uploadRecordings}>Transcribe Recording(s) to Text</button>
                        )}
                        <div id="formats">The transcriptions will be stored in the '/transcripts' folder.</div>
                    </section>
                )}
                {activeSection === 'medical-text-analysis' && (
                    <section id="medical-text-analysis" className="text-center mt-5">
                        <h2>Medical Text Analysis</h2>
                        <textarea
                            value={medicalText}
                            onChange={(e) => setMedicalText(e.target.value)}
                            placeholder="Enter medical text here..."
                            rows="4"
                            cols="50"
                        ></textarea>
                        <br />
                        <button className="btn btn-primary" onClick={handleMedicalAnalysis}>Analyze Medical Text</button>
                        <div id="medical-analysis-result">
                            <h3>Analysis Result:</h3>
                            <pre>{medicalAnalysis}</pre>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;
