import React, { useState, useRef, useEffect } from 'react';
import Recorder from './utils/recorder';
import './App.css';
import axios from 'axios';
import AwsTranscribeImage from './assets/AWS_Transcribe.jpg';

const App = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const audioContextRef = useRef(null);
    const gumStreamRef = useRef(null);
    const recorderRef = useRef(null);
    const removeRecording = (index) => {
        setRecordings(prevRecordings => prevRecordings.filter((_, i) => i !== index));
    };

    useEffect(() => {
        let interval;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording, isPaused]);

    const startRecording = async () => {
        setIsRecording(true);
        setIsPaused(false);
        setRecordingTime(0);

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


    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
    };

    return (
        <div className="App">
            <header className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item"><button className="nav-link btn-link" onClick={() => scrollToSection('audio-recorder')}>Audio Recorder</button></li>
                    </ul>
                </div>
            </header>
            <main>
                <section id="vision" className="partners text-center mt-5">
                </section>
                {activeSection === 'audio-recorder' && (
                    <section id="audio-recorder" className="audio-recorder-section">
                        <img src={AwsTranscribeImage} alt="AWS Transcribe" className="avatar"/>
                        <h2>Audio Recorder</h2>
                        <div id="controls">
                            <button
                                className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                                onClick={startRecording}
                                disabled={isRecording}
                            >
                                {isRecording ? 'Recording...' : 'Record'}
                            </button>
                            <button className="btn btn-primary" onClick={pauseRecording} disabled={!isRecording}>
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button className="btn btn-primary" onClick={stopRecording} disabled={!isRecording}>Stop</button>
                        </div>
                        {isRecording && !isPaused && (
                            <div className="recording-indicator">
                                <span className="pulse"></span> Recording...
                            </div>
                        )}
                        {isRecording && (
                            <div className="recording-time">
                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                        <p><strong>Recordings:</strong></p>
                        <ol id="recordingsList">
                            {recordings.map((recording, index) => (
                                <li key={index}>
                                    <audio controls src={recording.url}></audio>
                                    <button className="btn btn-danger btn-sm"
                                            onClick={() => removeRecording(index)}>Remove
                                    </button>

                                </li>
                            ))}
                        </ol>
                        {recordings.length > 0 && (
                            <button className="btn btn-primary" onClick={uploadRecordings}>Transcribe Recording(s) to Text</button>
                        )}
                        <div id="formats">The transcriptions will be stored in the '/transcripts' folder.</div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;