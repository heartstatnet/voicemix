// /app/client-app.tsx (クライアントサイドコンポーネント)
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"; 
import React, { useState, useRef } from 'react';
import { Container, Box, Typography, IconButton, Paper,Grid } from '@mui/material';
import { Mic, Stop, PlayArrow, Replay, ArrowUpward, ArrowDownward, Share ,Chat, Home } from '@mui/icons-material';
import { GoogleAnalytics } from '@next/third-parties/google';
import GoogleAd from './googlead';

let transcript = "";

export default function ClientApp({ dictionary }: { dictionary: any, lang: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecog, setIsSpeechRecog] = useState(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const [, setReversedAudioURL] = useState<string>('');
  const [, setHighPitchedAudioURL] = useState<string>('');
  const [, setLowPitchedAudioURL] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const handleStartRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSpeechRecog(true);
      }else{
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        transcript = event.results[0][0].transcript;
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        // alert('Speech recognition error');
      };

      recognition.start();
    };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);
        audioChunksRef.current = [];
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNormalPlayback = () => {
    if (audioRef.current) {
      audioRef.current.src = audioURL;
      audioRef.current.play();
    }
  };

  const handleReversePlayback = async () => {
    if (!audioURL) return;

    const response = await fetch(audioURL);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();

    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      const reversedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const reversedChannelData = reversedBuffer.getChannelData(i);

        for (let j = 0, k = channelData.length - 1; j < channelData.length; j++, k--) {
          reversedChannelData[j] = channelData[k];
        }
      }

      const source = audioContext.createBufferSource();
      source.buffer = reversedBuffer;
      source.connect(audioContext.destination);
      source.start();

      const reversedArrayBuffer = audioBufferToWav(reversedBuffer);
      const reversedBlob = new Blob([reversedArrayBuffer], { type: 'audio/wav' });
      const reversedAudioURL = URL.createObjectURL(reversedBlob);
      setReversedAudioURL(reversedAudioURL);
    });
  };

  const handleHighPitchPlayback = async () => {
    if (!audioURL) return;

    const response = await fetch(audioURL);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();

    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = 1.5; // キーを上げる
      source.connect(audioContext.destination);
      source.start();

      const highPitchedArrayBuffer = audioBufferToWav(audioBuffer);
      const highPitchedBlob = new Blob([highPitchedArrayBuffer], { type: 'audio/wav' });
      const highPitchedAudioURL = URL.createObjectURL(highPitchedBlob);
      setHighPitchedAudioURL(highPitchedAudioURL);
    });
  };

  const handleLowPitchPlayback = async () => {
    if (!audioURL) return;

    const response = await fetch(audioURL);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();

    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = 0.75; // キーを下げる
      source.connect(audioContext.destination);
      source.start();

      const lowPitchedArrayBuffer = audioBufferToWav(audioBuffer);
      const lowPitchedBlob = new Blob([lowPitchedArrayBuffer], { type: 'audio/wav' });
      const lowPitchedAudioURL = URL.createObjectURL(lowPitchedBlob);
      setLowPitchedAudioURL(lowPitchedAudioURL);
    });
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let i: number;
    let sample: number;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this demo)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample * 0.5) * 65535.0; // scale to 16-bit unsigned int
        view.setUint16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++;
    }

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    return bufferArray;
  };
  
  const shareURL = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dictionary["server-component"]?.title,
          text: dictionary["server-component"]?.sharetext,
          url: 'https://voice-mix.heartstat.net/'
        });
        console.log('URL shared successfully!');
      } catch (error) {
        console.error('Error sharing URL:', error);
      }
    } else {
      console.log('Share API not supported in this browser.');
    }
  };



  const handleSpeechSynthesis = () => {
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.lang = 'ja-JP';
    window.speechSynthesis.speak(utterance);
  };
  const translateText = async (text: string): Promise<string> => {
    const url = `https://libretranslate.com/translate`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'ja',
        target: 'en',
        format: 'text'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.translatedText;
  };
  const handleSpeechSynthesisEn = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleTranslateAndSpeak = async () => {
    if (!audioURL) return;

    const response = await fetch(audioURL);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();

    audioContext.decodeAudioData(arrayBuffer, async () => {
      const translatedText = await translateText(transcript);
      handleSpeechSynthesisEn(translatedText);
    });
  };
  return ( 
    <>
        <>
        <GoogleAnalytics gaId="G-2Y4V9WLCR0" />
    </>
    <Container maxWidth="md">
      
    <GoogleAd slot="8215874976" />
        <Box my={4} textAlign="center">
          <Typography variant="h3" gutterBottom sx={{ textDecoration: 'underline' }}>
            {dictionary["server-component"]?.maintitle}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {dictionary["server-component"]?.description}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {dictionary["server-component"]?.note}
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12}>
              <Paper elevation={3} style={{ background: "#EF476F" }}>
                <IconButton onClick={isRecording ? handleStopRecording : handleStartRecording} size="large">
                  {isRecording ? <Stop fontSize="large" /> : <Mic fontSize="large" />}
                  {isRecording ? dictionary["server-component"]?.stop : dictionary["server-component"]?.record}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ background: "#F78C6B" }}>
                <IconButton onClick={handleNormalPlayback} disabled={!audioURL} size="large">
                  <PlayArrow fontSize="large" />
                  {dictionary["server-component"]?.play}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ background: "#FFD166" }}>
                <IconButton onClick={handleReversePlayback} disabled={!audioURL} size="large">
                  <Replay fontSize="large" />
                  {dictionary["server-component"]?.reverse}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ background: "#06D6A0" }}>
                <IconButton onClick={handleHighPitchPlayback} disabled={!audioURL} size="large">
                  <ArrowUpward fontSize="large" />
                  {dictionary["server-component"]?.fastForward}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ background: "#118AB2" }}>
                <IconButton onClick={handleLowPitchPlayback} disabled={!audioURL} size="large">
                  <ArrowDownward fontSize="large" />
                  {dictionary["server-component"]?.slowDown}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ background: "#6c78ad" }}>
                <IconButton onClick={handleSpeechSynthesis} disabled={!audioURL || isSpeechRecog} size="large">
                  <Chat fontSize="large" />
                  {dictionary["server-component"]?.synthesize}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ background: "#6c78ad" }}>
                <IconButton onClick={handleTranslateAndSpeak} disabled size="large">
                  <Chat fontSize="large" />
                  {dictionary["server-component"]?.synthesize_en}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} style={{ background: "#687259" }}>
                <IconButton onClick={() => shareURL()} size="large">
                  <Share fontSize="large" />
                  {dictionary["server-component"]?.share}
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} style={{ background: "#949593" }}>
                <IconButton onClick={() => window.open("https://heartstat.net", '_blank')} size="large">
                  <Home fontSize="large" />
                  {dictionary["server-component"]?.authorWebsite}
                </IconButton>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        <GoogleAd slot="8215874976" />
        <audio ref={audioRef} controls style={{ display: 'none' }}>
          <track kind="captions" />
          audio not supported
        </audio>
      </Container></>
);
};

/* eslint-disable @typescript-eslint/no-explicit-any */