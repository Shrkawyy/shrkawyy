class ScreenRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.stream = null;
        this.isStarting = false; 
        
        
        this.isEnabled = false;
        this.startKey = 'KeyK';
        this.stopKey = 'KeyL';
        
        this.init();
    }
    
    init() {
        
        this.hideTimer();
        
        
        this.loadSettings();
        
        
        this.setupEventListeners();
        
        
        this.setupKeyboardControls();
    }
    
    loadSettings() {
        try {
            const enabled = localStorage.getItem('screenRecordingEnabled');
            const startKey = localStorage.getItem('startRecordingKey');
            const stopKey = localStorage.getItem('stopRecordingKey');
            
            this.isEnabled = enabled === 'true';
            this.startKey = startKey || 'KeyK';
            this.stopKey = stopKey || 'KeyL';
        } catch (e) {
            console.warn('Failed to load screen recording settings:', e);
        }
    }
    
    setupEventListeners() {
        
        const enabledCheckbox = document.getElementById('screenRecordingEnabled');
        const startKeyInput = document.getElementById('startRecordingKey');
        const stopKeyInput = document.getElementById('stopRecordingKey');
        
        if (enabledCheckbox) {
            enabledCheckbox.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                localStorage.setItem('screenRecordingEnabled', this.isEnabled);
                
                
                if (this.isEnabled) {
                    this.showTimer();
                    this.updateTimerDisplay();
                } else {
                    this.hideTimer();
                }
            });
            enabledCheckbox.checked = this.isEnabled;
            
            
            if (this.isEnabled) {
                this.showTimer();
                this.updateTimerDisplay();
            } else {
                this.hideTimer();
            }
        }
        
        if (startKeyInput) {
            startKeyInput.addEventListener('change', (e) => {
                this.startKey = e.target.value;
                localStorage.setItem('startRecordingKey', this.startKey);
            });
            startKeyInput.value = this.startKey;
        }
        
        if (stopKeyInput) {
            stopKeyInput.addEventListener('change', (e) => {
                this.stopKey = e.target.value;
                localStorage.setItem('stopRecordingKey', this.stopKey);
            });
            stopKeyInput.value = this.stopKey;
        }
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;
            
            if (e.code === this.startKey && !this.isRecording && !this.isStarting) {
                e.preventDefault();
                this.startRecording();
            } else if (e.code === this.stopKey && this.isRecording) {
                e.preventDefault();
                this.stopRecording();
            }
        });
    }
    
    async startRecording() {
        if (!this.isEnabled) {
            console.warn('Screen recording is disabled in settings');
            return;
        }
        
        if (this.isRecording || this.isStarting) {
            console.warn('Recording is already in progress or starting');
            return;
        }
        
        this.isStarting = true; 
        
        try {
            
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor',
                    width: { ideal: 1280, max: 1280 }, 
                    height: { ideal: 720, max: 720 },
                    frameRate: { ideal: 25, max: 25 } 
                },
                audio: false,
                logicalSurface: true
            });
            
            
            this.stream.getVideoTracks()[0].addEventListener('ended', () => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            });
            
            
            this.recordedChunks = [];
            const options = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 1000000 
            };
            
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'video/webm';
                }
            }
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            
            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };
            
            
            this.mediaRecorder.start(3000); 
            this.isRecording = true;
            this.startTime = Date.now();
            this.isStarting = false; 
            
            
            this.updateTimerDisplay();
            this.updateTimer();
            
            console.log('Screen recording started');
            
        } catch (error) {
            console.error('Error starting screen recording:', error);
            this.isStarting = false; 
            alert('Failed to start screen recording. Please make sure you grant the necessary permissions.');
        }
    }
    
    stopRecording() {
        if (!this.isRecording) {
            console.warn('No recording in progress');
            return;
        }
        
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        this.isRecording = false;
        
        
        this.updateTimerDisplay();
        
        console.log('Screen recording stopped');
    }
    
    handleRecordingStop() {
        
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        
        
        const url = URL.createObjectURL(blob);
        
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `zynx-recording-${timestamp}.webm`;
        
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        console.log(`Recording saved as ${filename}`);
    }
    
    showTimer() {
        const timerElement = document.getElementById('recording-timer');
        if (timerElement) {
            timerElement.classList.remove('hidden');
        }
    }
    
    hideTimer() {
        const timerElement = document.getElementById('recording-timer');
        if (timerElement) {
            timerElement.classList.add('hidden');
            
            timerElement.style.display = 'none';
        }
    }
    
    showTimer() {
        const timerElement = document.getElementById('recording-timer');
        if (timerElement) {
            timerElement.classList.remove('hidden');
            
            timerElement.style.display = 'flex';
        }
    }
    
    updateTimerDisplay() {
        const timeElement = document.getElementById('recording-time');
        const indicatorElement = document.getElementById('recording-indicator');
        
        if (timeElement && indicatorElement) {
            if (this.isRecording) {
                const elapsed = Date.now() - this.startTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                timeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                indicatorElement.style.background = '#ff4444';
                indicatorElement.style.animation = 'pulse 1s infinite';
            } else {
                timeElement.textContent = '00:00:00';
                indicatorElement.style.background = '#666666';
                indicatorElement.style.animation = 'none';
            }
        }
    }
    
    updateTimer() {
        if (!this.isRecording) return;
        
        this.updateTimerDisplay();
        
        
        this.timerInterval = setTimeout(() => this.updateTimer(), 1000);
    }
    
    
    destroy() {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        if (this.timerInterval) {
            clearTimeout(this.timerInterval);
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        this.isStarting = false; 
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.screenRecorder = new ScreenRecorder();
    });
} else {
    window.screenRecorder = new ScreenRecorder();
}


window.addEventListener('beforeunload', () => {
    if (window.screenRecorder) {
        window.screenRecorder.destroy();
    }
});
