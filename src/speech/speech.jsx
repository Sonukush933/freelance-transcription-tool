import axios from 'axios';
import { jsPDF } from 'jspdf';
import React, { useEffect, useRef, useState } from 'react';
import './style.css';

const Speech = () => {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [transcription, setTranscription] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [speakerWordCount, setSpeakerWordCount] = useState({});
  const audioRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [clearButtonVisible, setClearButtonVisible] = useState(false);
  const [sentenceSentiments, setSentenceSentiments] = useState([]);
  const [showSentiment, setShowSentiment] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState(null);
  const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false);

  const API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

  // Handle file upload
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;

    setHighlightedWords([]);
    setFile(selectedFile);
    setProgress(0);
    setProgressMessage('Uploading...');
    setLoading(true);

    const localBlobUrl = URL.createObjectURL(selectedFile);
    setAudioUrl(localBlobUrl);

    let progressInterval; // Variable for smooth progress interval

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 95 ? prev + 1 : prev)); // Increment progress smoothly till 95%
      }, 50); // Adjust speed as needed

      const response = await axios.post(
        'https://api.assemblyai.com/v2/upload',
        formData,
        {
          headers: { authorization: API_KEY },
          onUploadProgress: (progressEvent) => {
            const percentComplete = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setProgress(percentComplete);
          },
        }
      );

      clearInterval(progressInterval);
      setAudioUrl(response.data.upload_url);
      setIsFileUploaded(true);
      setProgress(100);
      setProgressMessage('Upload Complete!');
    } catch (error) {
      console.error('Audio upload failed:', error);
      setProgressMessage('Upload Failed. Using Local Playback.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileUpload(selectedFile);
  };

  const handleToggleTimestamps = () => {
    setIncludeTimestamps((prev) => !prev); // Toggle state
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer?.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    } else {
      console.error('No File found drag and drop.');
    }
  };

  // Handle transcription
  const handleTranscription = async () => {
    if (!audioUrl) {
      alert('Please upload an audio file first.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressMessage('Converting...');

    let progressInterval; // Variable for smooth progress interval

    try {
      const response = await axios.post(
        'https://api.assemblyai.com/v2/transcript',
        {
          audio_url: audioUrl,
          language_code: 'en',
          speaker_labels: true, // Enable speaker labeling
        },
        {
          headers: {
            authorization: API_KEY,
            'content-type': 'application/json',
          },
        }
      );

      const transcriptId = response.data.id;

      progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 95 ? prev + 1 : prev)); // Increment till 95%
      }, 50); // Adjust speed for smooth animation

      const checkTranscriptionStatus = async () => {
        const result = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: { authorization: API_KEY },
          }
        );
        // console.log("API Response:", result.data); // Log API response for debugging

        if (result.data.status === 'completed') {
          clearInterval(progressInterval);
          if (result.data.words && result.data.words.length > 0) {
            const words = result.data.words.map((word) => ({
              text: word.text,
              startTime: word.start ? word.start / 1000 : null, // Ensure start is valid
              endTime: word.end ? word.end / 1000 : null, // Ensure end is valid
              speaker: word.speaker || 'Unknown',
              timestamp: null, // Initialize with null
            }));

            setTranscription(words); // Save transcription without timestamps
            calculateSpeakerWordCount(words);
            setProgress(100);
            setProgressMessage('Conversion Complete!');
            setIsTranscriptionComplete(true);
            localStorage.setItem('transcription', JSON.stringify(words));
          } else {
            console.error('Transcription completed but no words found.');
            setProgressMessage(
              'Transcription completed, but no words were found.'
            );
          }
        } else if (result.data.status === 'failed') {
          clearInterval(progressInterval);
          console.error('Transcription failed:', result.data.error);
          setProgressMessage('Transcription failed. Try again.');
        } else {
          // Increment the smooth progress bar only if status is not completed or failed
          if (!progressInterval) {
            progressInterval = setInterval(() => {
              setProgress((prev) => (prev < 95 ? prev + 1 : prev)); // Smooth increment to 95%
            }, 50); // Adjust the speed as needed
          }
          setTimeout(checkTranscriptionStatus, 3000); // Recheck transcription status
        }
      };

      checkTranscriptionStatus();
    } catch (error) {
      console.error('Error starting transcription:', error);
      setProgressMessage('Error during conversion. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate word count by speaker
  const calculateSpeakerWordCount = (words) => {
    const count = words.reduce((acc, word) => {
      acc[word.speaker] = (acc[word.speaker] || 0) + 1;
      return acc;
    }, {});
    setSpeakerWordCount(count);
  };

  // Format time for timestamps
  const formatTime = (time) => {
    // Validate the input time
    if (isNaN(time) || time === null || time === undefined || time < 0) {
      return 'N/A'; // Fallback value for invalid time
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${seconds}`;
  };

  const handleAddTimestamp = () => {
    if (audioRef.current && transcription.length > 0) {
      const currentTime = audioRef.current.currentTime;

      // Add timestamp to transcription words within the current audio time
      const updatedTranscription = transcription.map((word) => {
        if (currentTime >= word.startTime && currentTime <= word.endTime) {
          return {
            ...word,
            timestamp: word.timestamp || currentTime, // Add timestamp if not already present
          };
        }
        return word; // Leave other words unchanged
      });

      setTranscription(updatedTranscription); // Update transcription state
    } else {
      console.error('Audio is not playing or transcription is empty.');
    }
  };

  // UseEffect to handle any state changes and re-render UI properly
  useEffect(() => {
    if (transcription.length > 0) {
      // console.log("Transcription Updated:", transcription);
    }
  }, [transcription]);

  // This will trigger whenever `transcription` changes
  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      const handleTimeUpdate = () => {
        const currentTime = audio.currentTime;

        // Find the active word index (only one word at a time)
        const activeIndex = transcription.findIndex(
          (word) => currentTime >= word.startTime && currentTime <= word.endTime
        );

        // Update the active word index
        setActiveWordIndex(activeIndex);
      };

      // Attach the event listener
      audio.addEventListener('timeupdate', handleTimeUpdate);

      // Cleanup on unmount
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [transcription]);

  const handleSeekAudio = (timestamp) => {
    if (audioRef.current && timestamp) {
      audioRef.current.currentTime = timestamp; // Seek audio
      audioRef.current.play(); // Play audio
    }
  };

  // Function to clear local storage, audio file, and reset state
  const handleClear = () => {
    // Clear local storage
    localStorage.removeItem('transcription');

    // Reset state
    setFile(null);
    setAudioUrl('');
    setTranscription([]);
    setProgress(0);
    setProgressMessage('');
    setIsFileUploaded(false);
    setSearchTerm('');
    setSpeakerWordCount({});
    setHighlightedWords([]);
    setIncludeTimestamps(true);
    setActiveWordIndex(null);
    setIsTranscriptionComplete(false);
    setShowSentiment(false);
  };

  // Analyze sentiment for a sentence
  const analyzeSentiment = (text) => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'positive'];
    const negativeWords = ['bad', 'poor', 'negative', 'terrible', 'worst'];
    let score = 0;

    text.split(' ').forEach((word) => {
      if (positiveWords.includes(word.toLowerCase())) score++;
      if (negativeWords.includes(word.toLowerCase())) score--;
    });

    return score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
  };

  // Function to group words into sentences and analyze sentiment
  const getSentenceSentiments = (transcription) => {
    let sentences = [];
    let currentSentence = '';

    transcription.forEach((word, index) => {
      currentSentence += word.text + ' '; // Add word to the current sentence
      if (/[.!?]/.test(word.text) || index === transcription.length - 1) {
        // End of a sentence or last word
        sentences.push(currentSentence.trim());
        currentSentence = '';
      }
    });

    // Analyze each sentence's sentiment
    return sentences.map((sentence) => ({
      sentence,
      sentiment: analyzeSentiment(sentence),
    }));
  };

  // Analyze transcription for sentiment when transcription updates
  useEffect(() => {
    if (transcription.length > 0) {
      const sentiments = getSentenceSentiments(transcription);
      setSentenceSentiments(sentiments);
    }
  }, [transcription]);

  // Toggle sentiment view
  const toggleSentiment = () => {
    setShowSentiment((prev) => !prev);
  };

  useEffect(() => {
    const activeWordElement = document.querySelector('.active-word');

    if (activeWordElement) {
      const rect = activeWordElement.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight);

      if (!isVisible) {
        activeWordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeWordIndex]);

  const handleEdit = (groupIndex, updatedText) => {
    // Validate groupIndex and updatedText
    if (!updatedText || groupIndex < 0 || groupIndex >= transcription.length) {
      console.error('Invalid groupIndex or updatedText:', {
        groupIndex,
        updatedText,
      });
      return;
    }

    // Clone the transcription state
    const updatedTranscription = [...transcription];

    // Get the group at groupIndex
    const group = updatedTranscription[groupIndex];
    if (!group || !Array.isArray(group.words)) {
      // console.error("Invalid group or missing words:", groupIndex, group);
      return;
    }

    // Safely update words in the group
    const updatedWords = updatedText.trim() ? updatedText.split(' ') : [];

    // Map updated words to the group's words
    const newWords = group.words.map((word, index) => ({
      ...word,
      text: updatedWords[index] || word.text || '', // Keep existing text if no updated word
    }));

    // Add extra words if any
    if (updatedWords.length > group.words.length) {
      for (let i = group.words.length; i < updatedWords.length; i++) {
        newWords.push({
          text: updatedWords[i], // New word
          startTime: null, // Default for new words
          endTime: null,
          speaker: group.speaker || 'Unknown',
          timestamp: null,
        });
      }
    }

    // Log to debug
    console.log('Updated words:', newWords);

    // Update the group's words
    group.words = newWords;

    // Update the transcription state
    updatedTranscription[groupIndex] = group;
    setTranscription(updatedTranscription);
  };

  // Load saved transcription from localStorage on mount
  useEffect(() => {
    const savedTranscription = localStorage.getItem('transcription');
    if (savedTranscription) {
      const words = JSON.parse(savedTranscription);
      setTranscription(words);
      calculateSpeakerWordCount(words);
      setIsFileUploaded(true); // Ensure upload state is set
      setClearButtonVisible(true); // Make sure Clear button is visible
    } else {
      setClearButtonVisible(false); // Hide Clear button if no transcription
    }
  }, []);

  // Search and highlight keywords in the transcription
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim()) {
      const matches = transcription.filter((word) =>
        word.text.toLowerCase().includes(term.toLowerCase())
      );

      // Ensure matched words have proper timestamps using fallback
      const updatedMatches = matches.map((word) => ({
        ...word,
        timestamp: word.timestamp || word.startTime || word.endTime || null, // Fallback to startTime or endTime
      }));

      setHighlightedWords(updatedMatches);
    } else {
      setHighlightedWords([]);
    }
  };

  const handleExportToTxt = () => {
    if (transcription.length === 0) return;

    const groupedTranscription = transcription.reduce((acc, word) => {
      if (acc.length === 0 || acc[acc.length - 1].speaker !== word.speaker) {
        acc.push({
          speaker: word.speaker || 'Unknown Speaker',
          text: `${word.text} ${
            includeTimestamps && word.timestamp
              ? `[${formatTime(word.timestamp)}]`
              : ''
          }`,
        });
      } else {
        acc[acc.length - 1].text += ` ${word.text} ${
          includeTimestamps && word.timestamp
            ? `[${formatTime(word.timestamp)}]`
            : ''
        }`;
      }
      return acc;
    }, []);

    const textContent = groupedTranscription
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join('\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'transcription.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToPdf = () => {
    if (transcription.length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width - 20; // Account for margins
    const lineHeight = 10;

    let yOffset = 10;
    const groupedTranscription = transcription.reduce((acc, word) => {
      if (acc.length === 0 || acc[acc.length - 1].speaker !== word.speaker) {
        acc.push({
          speaker: word.speaker || 'Unknown Speaker',
          text: `${word.text} ${
            includeTimestamps && word.timestamp
              ? `[${formatTime(word.timestamp)}]`
              : ''
          }`,
        });
      } else {
        acc[acc.length - 1].text += ` ${word.text} ${
          includeTimestamps && word.timestamp
            ? `[${formatTime(word.timestamp)}]`
            : ''
        }`;
      }
      return acc;
    }, []);

    groupedTranscription.forEach((entry) => {
      const textLine = `${entry.speaker}: ${entry.text}`;
      const wrappedText = pdf.splitTextToSize(textLine, pageWidth);

      wrappedText.forEach((line) => {
        if (yOffset + lineHeight > pdf.internal.pageSize.height - 10) {
          pdf.addPage();
          yOffset = 10;
        }
        pdf.text(line, 10, yOffset);
        yOffset += lineHeight;
      });
    });

    pdf.save('transcription.pdf');
  };

  return (
    <div className="wrapper-main">
      <div className="transcription-description">
        <h1>Paste Your Audio</h1>
        <div
          className={`upload-section ${dragging ? 'dragging' : ''}
           ${isTranscriptionComplete ? 'hidden' : ''}
          `}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleDrop(e);
          }}
        >
          {!file && !isTranscriptionComplete && (
            <div>
              <label htmlFor="file-upload" className="upload-label">
                Drag and Drop or Click to Upload
              </label>
              <input
                id="file-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileInputChange}
                className="upload-input"
              />
            </div>
          )}
          {progress > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}>
                <span className="progress-text">{`${progress}%`}</span>
              </div>
              <p className="progress-message">{progressMessage}</p>
            </div>
          )}
        </div>

        {isFileUploaded && transcription.length === 0 && (
          <>
            <button onClick={handleTranscription} className="action-button">
              Convert to Text
            </button>
          </>
        )}
        {transcription.length > 0 && (
          <button onClick={handleClear} className="clear-button">
            Clear All
          </button>
        )}

        {audioUrl && (
          <div className="audio-player">
            <h3>Your Audio You can Play</h3>
            <audio controls ref={audioRef}>
              <source src={audioUrl} type={file?.type || 'audio/mpeg'} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {transcription.length > 0 && (
          <div className="search-bar-all">
            <h3>Search Area</h3>
            <input
              type="text"
              placeholder="Search Keywords..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-bar"
            />
          </div>
        )}
        {highlightedWords.length > 0 && (
          <div className="highlighted-keywords">
            <h3>Highlighted Keywords</h3>
            <ul>
              {highlightedWords.map((word, index) => (
                <li key={index} className="highlighted-keyword-item">
                  {word.text} {/* Always display the timestamp if available */}[
                  {word.timestamp ? formatTime(word.timestamp) : 'N/A'}]
                </li>
              ))}
            </ul>
          </div>
        )}

        {transcription.length > 0 && (
          <div className="word-count-and-transcription">
            {Object.keys(speakerWordCount).length > 0 && (
              <div className="speaker-word-count">
                <h3>Total Words Single And Multi Audio</h3>
                {Object.entries(speakerWordCount).map(([speaker, count]) => (
                  <p key={speaker}>
                    {speaker}: {count} words
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {transcription.length > 0 && (
          <div>
            <div className="three-control-btn">
              <button onClick={handleAddTimestamp} className="control-btn">
                Add Timestamp
              </button>
              <button onClick={toggleSentiment} className="control-btn">
                Sentiment
              </button>
              {/* <button
                onClick={handleClear}
                className="clear-button"
              >
                Clear All
              </button> */}
            </div>
          </div>
        )}

        {transcription.length > 0 && (
          <div className="export-buttons">
            <div className="toggle-timestamp">
              <label>
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={handleToggleTimestamps}
                />
                Include Timestamps in Export
              </label>
            </div>

            <div className="exports-button">
              <button
                onClick={handleExportToTxt}
                className="control-btn export-button"
              >
                Export to .TXT
              </button>
              <button
                onClick={handleExportToPdf}
                className="control-btn export-button"
              >
                Export to .PDF
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="transcription-tool">
        <div className="transcription-result">
          <h3>Transcription Result</h3>
          <hr />
          {transcription.length > 0 && (
            <div className="transcription-content">
              {transcription
                .reduce((acc, word) => {
                  if (
                    acc.length === 0 ||
                    acc[acc.length - 1].speaker !== word.speaker
                  ) {
                    acc.push({ speaker: word.speaker, words: [word] });
                  } else {
                    acc[acc.length - 1].words.push(word);
                  }
                  return acc;
                }, [])
                .map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className={`speaker-${group.speaker.replace(/\s+/g, '-')}`}
                  >
                    <p>
                      <strong>{group.speaker || 'Unknown'}:</strong>{' '}
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="editable-text"
                      >
                        {group.words.map((word, index) => (
                          <span
                            key={index}
                            className={`transcription-word ${
                              index === activeWordIndex ? 'active-word' : '' // Highlight the active word
                            } ${
                              searchTerm &&
                              word.text
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                                ? 'highlight' // Highlight searched words separately
                                : ''
                            }`}
                          >
                            {word.text}
                            {/* Show timestamp if available */}
                            {word.timestamp && (
                              <span
                                onClick={() => handleSeekAudio(word.timestamp)}
                                className="timestamp"
                              >
                                [{formatTime(word.timestamp)}]
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    </p>
                  </div>
                ))}
            </div>
          )}

          {transcription.length > 0 && (
            <div className="sentiment-analysis">
              {showSentiment && (
                <div className="sentiment-analysis">
                  <h3>Sentiment Analysis</h3>
                  {sentenceSentiments.map((item, index) => (
                    <p key={index}>
                      <strong>Sentence:</strong> {item.sentence}
                      <br />
                      <strong>Sentiment:</strong> {item.sentiment}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-indicator">Processing... Please wait.</div>
        )}
      </div>
    </div>
  );
};

export default Speech;
