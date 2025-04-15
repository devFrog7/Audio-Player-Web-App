// Liste der verfügbaren Tracks mit Metadaten
const tracks = [
  {
    name: "Mekanın Sahibi",
    artist: "Norm Ender",
    cover: "img/1.jpg",
    source: "mp3/1.mp3",
  },
  {
    name: "Sunset Drive",
    artist: "Alone by the Bay",
    cover: "img/2.jpg",
    source: "mp3/2.mp3",
  },
  {
    name: "smooth operator",
    artist: "win32",
    cover: "img/3.jpg",
    source: "mp3/3.mp3",
  },
  {
    name: "Someday",
    artist: "Kl3W",
    cover: "img/4.jpg",
    source: "mp3/4.mp3",
  },
  {
    name: "The Final Victory",
    artist: "Haggard",
    cover: "img/5.jpg",
    source: "mp3/5.mp3",
  },
  {
    name: "Genius ft. Sia, Diplo, Labrinth",
    artist: "LSD",
    cover: "img/6.jpg",
    source: "mp3/6.mp3",
  },
  {
    name: "The Comeback Kid",
    artist: "Lindi Ortega",
    cover: "img/7.jpg",
    source: "mp3/7.mp3",
  },
  {
    name: "Overdose",
    artist: "Grandson",
    cover: "img/8.jpg",
    source: "mp3/8.mp3",
  },
  {
    name: "Rag'n'Bone Man",
    artist: "Human",
    cover: "img/9.jpg",
    source: "mp3/9.mp3",
  }
];

// Audio-Player Hauptvariablen
let audio = new Audio();
let currentTrackIndex = 0;
let isPlaying = false;

// Variablen für die Audio-Analyse und Beat-Visualisierung
let audioContext;
let analyser;
let dataArray;
let source;
let animationFrameId;
const beatSensitivity = 1.0; // Empfindlichkeit der Beat-Erkennung
let beatThreshold = 0;
let lastBeatTime = 0;
let audioContextInitialized = false; // Verhindert mehrfache Initialisierung

// Hauptfunktion - wird ausgeführt, wenn DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
  // UI-Elemente referenzieren
  const playButton = document.querySelector('.play-stop-button input');
  const nextButton = document.querySelector('.next-button');
  const titleElement = document.querySelector('.title');
  const subtitleElement = document.querySelector('.subtitle');
  const coverElement = document.querySelector('.radio-img');
  
  // Zeitleisten-Elemente
  const timelineProgress = document.querySelector('.timeline-progress');
  const currentTimeElement = document.querySelector('.current-time');
  const totalTimeElement = document.querySelector('.total-time');
  const timelineContainer = document.querySelector('.timeline');
  
  // Lautstärkeregler-Elemente
  const volumeSlider = document.querySelector('.volume-slider');
  const volumeIcon = document.querySelector('.volume-icon');
  
  // Initialisiere Lautstärke
  audio.volume = volumeSlider.value / 100;
  
  // Sicherstellen, dass der Play-Button initial angezeigt wird
  playButton.checked = false;
  
  // Ersten Track laden
  loadTrack(currentTrackIndex);
  
  // Event-Handler einrichten
  playButton.addEventListener('change', togglePlay);
  nextButton.addEventListener('click', nextTrack);
  
  // Lautstärkeregler Event-Handling
  volumeSlider.addEventListener('input', function() {
    audio.volume = this.value / 100;
    updateVolumeIcon(this.value);
  });
  
  // Lautstärke-Icon Toggle
  volumeIcon.addEventListener('click', function() {
    if (audio.volume > 0) {
      // Lautstärke speichern, bevor wir muten
      volumeIcon.dataset.lastVolume = audio.volume * 100;
      audio.volume = 0;
      volumeSlider.value = 0;
      updateVolumeIcon(0);
    } else {
      // Letzte Lautstärke wiederherstellen oder Standard verwenden
      const lastVolume = volumeIcon.dataset.lastVolume || 80;
      audio.volume = lastVolume / 100;
      volumeSlider.value = lastVolume;
      updateVolumeIcon(lastVolume);
    }
  });
  
  // Lautstärke-Icon aktualisieren basierend auf Lautstärkewert
  function updateVolumeIcon(value) {
    const volumeIconSVG = volumeIcon.querySelector('svg');
    
    // Lautstärke-Icon SVG aktualisieren basierend auf Lautstärkewert
    if (value == 0) {
      // Mute Icon (nur Lautsprecher ohne Wellen)
      volumeIconSVG.innerHTML = '<path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/>';
    } else if (value < 50) {
      // Niedrige Lautstärke (eine Welle)
      volumeIconSVG.innerHTML = '<path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/><path d="M412.6 181.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5z"/>';
    } else {
      // Hohe Lautstärke (alle Wellen)
      volumeIconSVG.innerHTML = '<path d="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/>';
    }
  }
  
  // Automatisch zum nächsten Track wechseln, wenn aktueller Track endet
  audio.addEventListener('ended', nextTrack);
  
  // Zeitleiste und Zeitanzeige aktualisieren während der Wiedergabe
  audio.addEventListener('timeupdate', updateProgress);
  
  // Gesamtzeit anzeigen, sobald Metadaten geladen sind
  audio.addEventListener('loadedmetadata', function() {
    totalTimeElement.textContent = formatTime(audio.duration);
    currentTimeElement.textContent = formatTime(0);
  });
  
  // Direkte Navigation in der Zeitleiste ermöglichen
  timelineContainer.addEventListener('click', function(e) {
    const timeline = this.getBoundingClientRect();
    const clickPosition = (e.clientX - timeline.left) / timeline.width;
    audio.currentTime = clickPosition * audio.duration;
  });

  // AudioContext und Analyser für die Visualisierung einrichten
  function setupAudioAnalysis() {
    if (audioContextInitialized) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    // Audio mit Analyser verbinden
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    audioContextInitialized = true;
  }
  
  // Beat-Erkennung und visuelle Effekte
  function detectBeat() {
    if (!isPlaying) return;
    
    // Frequenzdaten analysieren
    analyser.getByteFrequencyData(dataArray);
    
    // Durchschnitt der Bass-Frequenzen berechnen
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += dataArray[i];
    }
    const average = sum / 15;
    
    // Dynamische Anpassung der Erkennungsschwelle
    if (beatThreshold === 0) beatThreshold = average * 0.5;
    beatThreshold = beatThreshold * 0.9 + average * 0.1;
    
    // Beat erkennen und visuellen Effekt auslösen
    const currentTime = new Date().getTime();
    if (average > beatThreshold * beatSensitivity && currentTime - lastBeatTime > 200) {
      const coverBefore = document.querySelector('.radio-img');
      coverBefore.style.setProperty('--beat-scale', '1.00');
      coverBefore.style.setProperty('--blur-intensity', '16px');
      
      lastBeatTime = currentTime;
      
      // Effekt zurücksetzen
      setTimeout(() => {
        coverBefore.style.setProperty('--beat-scale', '1.00');
        coverBefore.style.setProperty('--blur-intensity', '12px');
      }, 120);
    }
    
    // Animation kontinuierlich fortsetzen
    animationFrameId = requestAnimationFrame(detectBeat);
  }

  // Neuen Track laden und vorbereiten
  function loadTrack(trackIndex) {
    const track = tracks[trackIndex];
    
    // UI aktualisieren
    titleElement.textContent = track.name;
    subtitleElement.textContent = track.artist;
    coverElement.style.backgroundImage = `url(${track.cover})`;
    
    // Audio-Quelle setzen
    audio.src = track.source;
    audio.load();
    
    // Beat-Erkennung zurücksetzen
    beatThreshold = 0;
    
    // Laufende Animation stoppen
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Zeitleiste zurücksetzen
    timelineProgress.style.width = '0%';
    currentTimeElement.textContent = formatTime(0);
  }
  
  // Wiedergabe starten/pausieren
  function togglePlay() {
    if (playButton.checked) {
      // Audio-Analyse beim ersten Abspielen initialisieren
      setupAudioAnalysis();
      
      // Audio abspielen mit Promise-Handling für moderne Browser
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
            
            // Falls AudioContext pausiert wurde (z.B. bei Browserwechsel)
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
            
            // Beat-Erkennung starten
            detectBeat();
          })
          .catch(error => {
            console.error('Playback error:', error);
            playButton.checked = false;
          });
      }
    } else {
      // Audio pausieren
      audio.pause();
      isPlaying = false;
      
      // Animation pausieren
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }
  }
  
  // Fortschrittsanzeige aktualisieren
  function updateProgress() {
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    
    if (duration) {
      // Fortschrittsbalken aktualisieren
      const progressPercent = (currentTime / duration) * 100;
      timelineProgress.style.width = `${progressPercent}%`;
      
      // Aktuelle Zeit anzeigen
      currentTimeElement.textContent = formatTime(currentTime);
    }
  }
  
  // Zeit von Sekunden in MM:SS Format umwandeln
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  // Zum nächsten Track wechseln
  function nextTrack() {
    // Animation stoppen
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Modulo-Operation sorgt für Endlosschleife durch die Playlist
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    
    // Wiedergabe fortsetzen, falls aktiv
    if (isPlaying) {
      audio.play();
      detectBeat();
    }
  }
});