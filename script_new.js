class MusicVisualizer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = null;
        this.isPlaying = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.animationId = null;
        
        this.visualMode = 'bar';
        this.colorTheme = 'neon';
        this.lineWidth = 2;
        this.sensitivity = 1.0;
        this.smoothing = 0.8;
        
        this.colorThemes = {
            neon: ['#ff006e', '#8338ec', '#3a86ff'],
            sunset: ['#ff9500', '#ff5722', '#e91e63'],
            ocean: ['#00bcd4', '#2196f3', '#3f51b5'],
            forest: ['#4caf50', '#8bc34a', '#cddc39'],
            aurora: ['#e91e63', '#9c27b0', '#673ab7'],
            fire: ['#ff5722', '#ff9800', '#ffc107']
        };
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.audioFile = document.getElementById('audioFile');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.downloadVideoBtn = document.getElementById('downloadVideoBtn');
        this.downloadTransparentBtn = document.getElementById('downloadTransparentBtn');
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.status = document.getElementById('status');
        this.recordingStatus = document.getElementById('recordingStatus');
        
        this.lineWidthSlider = document.getElementById('lineWidth');
        this.lineWidthValue = document.getElementById('lineWidthValue');
        this.sensitivitySlider = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.smoothingSlider = document.getElementById('smoothing');
        this.smoothingValue = document.getElementById('smoothingValue');
        
        this.canvas.width = 800;
        this.canvas.height = 400;
    }
    
    setupEventListeners() {
        this.audioFile.addEventListener('change', (e) => this.loadAudioFile(e));
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.downloadVideoBtn.addEventListener('click', () => this.downloadVideo(false));
        this.downloadTransparentBtn.addEventListener('click', () => this.downloadVideo(true));
        
        this.audioPlayer.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updateStatus('재생 완료');
            this.enableButtons();
        });
        
        document.querySelectorAll('input[name="visualMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.visualMode = e.target.value;
            });
        });
        
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
                this.colorTheme = e.target.dataset.theme;
            });
        });
        
        this.lineWidthSlider.addEventListener('input', (e) => {
            this.lineWidth = parseFloat(e.target.value);
            this.lineWidthValue.textContent = this.lineWidth;
        });
        
        this.sensitivitySlider.addEventListener('input', (e) => {
            this.sensitivity = parseFloat(e.target.value);
            this.sensitivityValue.textContent = this.sensitivity.toFixed(1);
        });
        
        this.smoothingSlider.addEventListener('input', (e) => {
            this.smoothing = parseFloat(e.target.value);
            this.smoothingValue.textContent = this.smoothing.toFixed(1);
            if (this.analyser) {
                this.analyser.smoothingTimeConstant = this.smoothing;
            }
        });
        
        document.querySelector('.color-option[data-theme="neon"]').classList.add('active');
    }
    
    async loadAudioFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.updateStatus('파일 로딩 중...');
        
        try {
            const audioUrl = URL.createObjectURL(file);
            this.audioPlayer.src = audioUrl;
            
            await this.initializeAudioContext();
            this.enableButtons();
            this.updateStatus('파일 로드 완료');
        } catch (error) {
            console.error('오디오 파일 로드 오류:', error);
            this.updateStatus('파일 로드 실패');
        }
    }
    
    async initializeAudioContext() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaElementSource(this.audioPlayer);
        
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = this.smoothing;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }
    
    enableButtons() {
        this.playBtn.disabled = false;
        this.pauseBtn.disabled = false;
        this.stopBtn.disabled = false;
        this.downloadVideoBtn.disabled = false;
        this.downloadTransparentBtn.disabled = false;
    }
    
    updateStatus(message) {
        this.status.textContent = message;
    }
    
    updateRecordingStatus(message) {
        this.recordingStatus.textContent = message;
    }
    
    async play() {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audioPlayer.play();
            this.isPlaying = true;
            this.updateStatus('재생 중');
            this.startVisualization();
        } catch (error) {
            console.error('재생 오류:', error);
            this.updateStatus('재생 실패');
        }
    }
    
    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.updateStatus('일시정지');
        this.stopVisualization();
    }
    
    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.isPlaying = false;
        this.updateStatus('정지');
        this.stopVisualization();
        this.clearCanvas();
    }
    
    startVisualization() {
        const draw = () => {
            if (!this.isPlaying) return;
            
            this.animationId = requestAnimationFrame(draw);
            
            this.drawVisualizer();
        };
        draw();
    }
    
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    drawVisualizer(transparent = false) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        if (transparent) {
            this.ctx.clearRect(0, 0, width, height);
        } else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.fillRect(0, 0, width, height);
        }
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        switch(this.visualMode) {
            case 'bar':
                this.drawBars();
                break;
            case 'wave':
                this.drawWaveform();
                break;
            case 'circle':
                this.drawCircularVisualizer();
                break;
        }
    }
    
    drawBars() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme];
        
        const barWidth = (width / this.bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * this.sensitivity;
            
            const colorIndex = Math.floor((i / this.bufferLength) * colors.length);
            const nextColorIndex = (colorIndex + 1) % colors.length;
            const ratio = ((i / this.bufferLength) * colors.length) % 1;
            
            const color1 = this.hexToRgb(colors[colorIndex]);
            const color2 = this.hexToRgb(colors[nextColorIndex]);
            
            const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
            const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
            const b = Math.round(color1.b + (color2.b - color1.b) * ratio);
            
            const alpha = (this.dataArray[i] / 255) * 0.8 + 0.2;
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            this.ctx.fillStyle = `rgba(${r + 50}, ${g + 50}, ${b + 50}, 0.3)`;
            this.ctx.fillRect(x, height - barHeight, barWidth, Math.min(barHeight * 0.3, 20));
            
            x += barWidth + 1;
        }
    }
    
    drawWaveform() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme];
        
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const sliceWidth = width / this.bufferLength;
        
        for (let layer = 0; layer < 3; layer++) {
            this.ctx.beginPath();
            let x = 0;
            
            const colorIndex = layer % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            const alpha = 0.8 - (layer * 0.2);
            const offset = (layer - 1) * 20;
            
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            this.ctx.lineWidth = this.lineWidth + layer;
            
            for (let i = 0; i < this.bufferLength; i++) {
                const v = (this.dataArray[i] / 255) * this.sensitivity;
                const y = (v * height / 3) + (height / 2) + offset;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            this.ctx.stroke();
        }
    }
    
    drawCircularVisualizer() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const baseRadius = 80;
        const colors = this.colorThemes[this.colorTheme];
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        for (let ring = 0; ring < 2; ring++) {
            const radius = baseRadius + (ring * 30);
            
            for (let i = 0; i < this.bufferLength; i++) {
                const angle = (i / this.bufferLength) * 2 * Math.PI;
                const barHeight = (this.dataArray[i] / 255) * 120 * this.sensitivity;
                
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius + barHeight);
                
                const colorIndex = Math.floor((i / this.bufferLength) * colors.length);
                const nextColorIndex = (colorIndex + 1) % colors.length;
                const ratio = ((i / this.bufferLength) * colors.length) % 1;
                
                const color1 = this.hexToRgb(colors[colorIndex]);
                const color2 = this.hexToRgb(colors[nextColorIndex]);
                
                const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
                const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
                const b = Math.round(color1.b + (color2.b - color1.b) * ratio);
                
                const alpha = (this.dataArray[i] / 255) * 0.8 + 0.3;
                const ringAlpha = alpha * (1 - ring * 0.3);
                
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
                this.ctx.lineWidth = this.lineWidth + ring;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                
                if (barHeight > 50) {
                    this.ctx.beginPath();
                    this.ctx.arc(x2, y2, 2 + ring, 0, 2 * Math.PI);
                    this.ctx.fillStyle = `rgba(${r + 100}, ${g + 100}, ${b + 100}, ${alpha})`;
                    this.ctx.fill();
                }
            }
        }
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 255, b: 255};
    }
    
    clearCanvas() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    async downloadVideo(transparent = false) {
        if (!this.isPlaying) {
            alert('음악을 재생 중일 때만 영상을 다운로드할 수 있습니다.');
            return;
        }
        
        try {
            this.updateRecordingStatus('녹화 중...');
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d', {
                alpha: transparent
            });
            
            const originalCanvas = this.canvas;
            const originalCtx = this.ctx;
            
            this.canvas = tempCanvas;
            this.ctx = tempCtx;
            
            const stream = tempCanvas.captureStream(60);
            
            if (!transparent && this.audioPlayer.captureStream) {
                const audioStream = this.audioPlayer.captureStream();
                const audioTracks = audioStream.getAudioTracks();
                
                if (audioTracks.length > 0) {
                    stream.addTrack(audioTracks[0]);
                }
            }
            
            const mimeType = 'video/webm;codecs=vp9';
            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `music-visualizer-${transparent ? 'transparent-' : ''}${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                URL.revokeObjectURL(url);
                
                this.canvas = originalCanvas;
                this.ctx = originalCtx;
                
                this.updateRecordingStatus('다운로드 완료');
                setTimeout(() => this.updateRecordingStatus('준비'), 2000);
            };
            
            this.mediaRecorder.start();
            
            const recordDuration = 5000;
            const startTime = Date.now();
            
            const recordFrame = () => {
                if (Date.now() - startTime < recordDuration && this.isPlaying) {
                    this.drawVisualizer(transparent);
                    requestAnimationFrame(recordFrame);
                } else {
                    this.mediaRecorder.stop();
                }
            };
            
            recordFrame();
            
        } catch (error) {
            console.error('영상 생성 오류:', error);
            this.updateRecordingStatus('영상 생성 실패');
            setTimeout(() => this.updateRecordingStatus('준비'), 2000);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MusicVisualizer();
});