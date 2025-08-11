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
        this.particles = [];
        
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
            fire: ['#ff5722', '#ff9800', '#ffc107'],
            cyber: ['#00ff41', '#00d4ff', '#ff00d4'],
            galaxy: ['#667eea', '#764ba2', '#f093fb'],
            rainbow: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff'],
            matrix: ['#003300', '#00ff00', '#00cc00'],
            gold: ['#ffd700', '#ffb347', '#ff6b35'],
            ice: ['#a8edea', '#fed6e3', '#d299c2'],
            lava: ['#ff0000', '#ff4500', '#ff8c00'],
            space: ['#0f0f23', '#2d1b69', '#11998e'],
            tropical: ['#ff6b6b', '#feca57', '#48dbfb'],
            midnight: ['#2c3e50', '#34495e', '#7f8c8d'],
            emerald: ['#00c9ff', '#92fe9d', '#00b09b'],
            ruby: ['#cc2b5e', '#753a88', '#8e44ad'],
            sapphire: ['#1e3c72', '#2a5298', '#74b9ff'],
            monochrome: ['#000000', '#434343', '#ffffff'],
            vintage: ['#ddd6f3', '#faaca8', '#f093fb'],
            pastel: ['#ffecd2', '#fcb69f', '#a8edea'],
            neon2: ['#ff0080', '#00ff80', '#8000ff'],
            toxic: ['#8360c3', '#2ebf91', '#f093fb'],
            crystal: ['#667eea', '#764ba2', '#f093fb']
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
        
        this.canvas.width = 1920;
        this.canvas.height = 1080;
        this.canvas.style.width = '800px';
        this.canvas.style.height = '450px';
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
            if (this.isRecording) {
                this.stopRecording();
            }
        });
        
        document.querySelectorAll('input[name="visualMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.visualMode = e.target.value;
                if (this.visualMode === 'particle') {
                    this.initParticles();
                }
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
        
        this.initParticles();
    }
    
    initParticles() {
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                life: 1.0
            });
        }
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
        
        this.analyser.fftSize = 512;
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
            case 'particle':
                this.drawParticles();
                break;
            case 'spectrum':
                this.drawSpectrum();
                break;
            case 'spiral':
                this.drawSpiral();
                break;
            case 'mirror':
                this.drawMirror();
                break;
            case 'dna':
                this.drawDNA();
                break;
            case 'flower':
                this.drawFlower();
                break;
            case 'tunnel':
                this.drawTunnel();
                break;
            case 'grid':
                this.drawGrid();
                break;
            case 'starfield':
                this.drawStarfield();
                break;
            case 'kaleido':
                this.drawKaleido();
                break;
            case 'lightning':
                this.drawLightning();
                break;
            case 'ripple':
                this.drawRipple();
                break;
            case 'cube':
                this.drawCube();
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
        
        this.ctx.lineWidth = this.lineWidth * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const sliceWidth = width / this.bufferLength;
        
        for (let layer = 0; layer < 3; layer++) {
            this.ctx.beginPath();
            let x = 0;
            
            const colorIndex = layer % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            const alpha = 0.8 - (layer * 0.2);
            const offset = (layer - 1) * 40;
            
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            this.ctx.lineWidth = this.lineWidth * 2 + layer;
            
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
        const baseRadius = 200;
        const colors = this.colorThemes[this.colorTheme];
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        for (let ring = 0; ring < 3; ring++) {
            const radius = baseRadius + (ring * 60);
            
            for (let i = 0; i < this.bufferLength; i++) {
                const angle = (i / this.bufferLength) * 2 * Math.PI;
                const barHeight = (this.dataArray[i] / 255) * 300 * this.sensitivity;
                
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
                const ringAlpha = alpha * (1 - ring * 0.2);
                
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
                this.ctx.lineWidth = this.lineWidth * 2 + ring;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                
                if (barHeight > 100) {
                    this.ctx.beginPath();
                    this.ctx.arc(x2, y2, 4 + ring, 0, 2 * Math.PI);
                    this.ctx.fillStyle = `rgba(${r + 100}, ${g + 100}, ${b + 100}, ${alpha})`;
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawParticles() {
        const colors = this.colorThemes[this.colorTheme];
        const avgFreq = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;
        
        this.particles.forEach((particle, index) => {
            const colorIndex = Math.floor((index / this.particles.length) * colors.length);
            const color = this.hexToRgb(colors[colorIndex]);
            
            const intensity = (avgFreq / 255) * this.sensitivity;
            particle.size = Math.max(1, intensity * 8);
            
            particle.x += particle.vx * intensity * 3;
            particle.y += particle.vy * intensity * 3;
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
            this.ctx.fill();
            
            this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawSpectrum() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme];
        
        const barCount = this.bufferLength / 2;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * this.sensitivity;
            
            const colorIndex = Math.floor((i / barCount) * colors.length);
            const color = this.hexToRgb(colors[colorIndex]);
            
            const gradient = this.ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
            
            this.ctx.fillRect((width - i * barWidth - barWidth), height - barHeight, barWidth - 1, barHeight);
        }
    }
    
    drawSpiral() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        
        this.ctx.lineWidth = this.lineWidth * 2;
        this.ctx.lineCap = 'round';
        
        for (let spiral = 0; spiral < 3; spiral++) {
            this.ctx.beginPath();
            
            const colorIndex = spiral % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 - spiral * 0.2})`;
            
            let x = centerX, y = centerY;
            let angle = spiral * (Math.PI * 2 / 3);
            let radius = 0;
            
            this.ctx.moveTo(x, y);
            
            for (let i = 0; i < this.bufferLength; i++) {
                const intensity = (this.dataArray[i] / 255) * this.sensitivity;
                radius += intensity * 2;
                angle += 0.1 + intensity * 0.1;
                
                x = centerX + Math.cos(angle) * radius;
                y = centerY + Math.sin(angle) * radius;
                
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.stroke();
        }
    }
    
    drawMirror() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme];
        
        const barWidth = width / this.bufferLength;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * (height / 2) * this.sensitivity;
            
            const colorIndex = Math.floor((i / this.bufferLength) * colors.length);
            const color = this.hexToRgb(colors[colorIndex]);
            
            const alpha = (this.dataArray[i] / 255) * 0.8 + 0.2;
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            
            this.ctx.fillRect(i * barWidth, height / 2 - barHeight, barWidth - 1, barHeight);
            this.ctx.fillRect(i * barWidth, height / 2, barWidth - 1, barHeight);
        }
    }
    
    drawDNA() {
        const centerX = this.canvas.width / 2;
        const colors = this.colorThemes[this.colorTheme];
        
        this.ctx.lineWidth = this.lineWidth * 3;
        this.ctx.lineCap = 'round';
        
        for (let strand = 0; strand < 2; strand++) {
            this.ctx.beginPath();
            
            const colorIndex = strand % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            
            let prevX = 0, prevY = 0;
            
            for (let i = 0; i < this.bufferLength; i++) {
                const y = (i / this.bufferLength) * this.canvas.height;
                const intensity = (this.dataArray[i] / 255) * this.sensitivity;
                const amplitude = intensity * 200;
                
                const x = centerX + Math.sin(y * 0.01 + strand * Math.PI) * amplitude;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                    
                    if (i % 10 === 0 && strand === 0) {
                        const otherX = centerX + Math.sin(y * 0.01 + Math.PI) * amplitude;
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(otherX, y);
                        this.ctx.moveTo(x, y);
                    }
                }
            }
            
            this.ctx.stroke();
        }
    }
    
    drawFlower() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        
        const petals = 8;
        for (let petal = 0; petal < petals; petal++) {
            this.ctx.beginPath();
            const colorIndex = petal % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            
            for (let i = 0; i < this.bufferLength; i++) {
                const angle = (i / this.bufferLength) * Math.PI * 2;
                const intensity = (this.dataArray[i] / 255) * this.sensitivity;
                const radius = intensity * 300;
                
                const petalAngle = angle + (petal * Math.PI * 2 / petals);
                const petalRadius = radius * Math.sin(angle * 3);
                
                const x = centerX + Math.cos(petalAngle) * Math.abs(petalRadius);
                const y = centerY + Math.sin(petalAngle) * Math.abs(petalRadius);
                
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.stroke();
        }
    }
    
    drawTunnel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        
        const rings = 20;
        for (let ring = 0; ring < rings; ring++) {
            const avgIntensity = this.dataArray.slice(ring * 12, (ring + 1) * 12)
                .reduce((a, b) => a + b, 0) / 12;
            const intensity = (avgIntensity / 255) * this.sensitivity;
            const radius = (ring + 1) * 30 + intensity * 100;
            
            const colorIndex = ring % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            const alpha = Math.max(0.1, 1 - (ring / rings));
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * intensity})`;
            this.ctx.lineWidth = this.lineWidth + intensity * 5;
            this.ctx.stroke();
        }
    }
    
    drawGrid() {
        const colors = this.colorThemes[this.colorTheme];
        const gridSize = 40;
        const cols = Math.floor(this.canvas.width / gridSize);
        const rows = Math.floor(this.canvas.height / gridSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = (row * cols + col) % this.bufferLength;
                const intensity = (this.dataArray[index] / 255) * this.sensitivity;
                
                const x = col * gridSize;
                const y = row * gridSize;
                const size = gridSize * intensity;
                
                const colorIndex = Math.floor((index / this.bufferLength) * colors.length);
                const color = this.hexToRgb(colors[colorIndex]);
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
                this.ctx.fillRect(x + (gridSize - size) / 2, y + (gridSize - size) / 2, size, size);
            }
        }
    }
    
    drawStarfield() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        
        const stars = 200;
        for (let star = 0; star < stars; star++) {
            const dataIndex = star % this.bufferLength;
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            const angle = (star / stars) * Math.PI * 2;
            const distance = (star / stars) * Math.min(this.canvas.width, this.canvas.height) / 2;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = intensity * 10 + 1;
            
            const colorIndex = Math.floor((star / stars) * colors.length);
            const color = this.hexToRgb(colors[colorIndex]);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
            this.ctx.fill();
            
            this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            this.ctx.shadowBlur = size * 2;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawKaleido() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        const segments = 6;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        for (let segment = 0; segment < segments; segment++) {
            this.ctx.save();
            this.ctx.rotate((segment * Math.PI * 2) / segments);
            
            for (let i = 0; i < this.bufferLength / 6; i++) {
                const intensity = (this.dataArray[i] / 255) * this.sensitivity;
                const radius = i * 3;
                const height = intensity * 100;
                
                const colorIndex = Math.floor((i / (this.bufferLength / 6)) * colors.length);
                const color = this.hexToRgb(colors[colorIndex]);
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
                this.ctx.fillRect(radius, -height / 2, 3, height);
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawLightning() {
        const colors = this.colorThemes[this.colorTheme];
        const bolts = 5;
        
        for (let bolt = 0; bolt < bolts; bolt++) {
            const startX = Math.random() * this.canvas.width;
            const endX = Math.random() * this.canvas.width;
            const avgIntensity = this.dataArray.slice(bolt * 50, (bolt + 1) * 50)
                .reduce((a, b) => a + b, 0) / 50;
            const intensity = (avgIntensity / 255) * this.sensitivity;
            
            if (intensity < 0.3) continue;
            
            this.ctx.beginPath();
            this.ctx.lineWidth = this.lineWidth * intensity * 3;
            this.ctx.lineCap = 'round';
            
            const colorIndex = bolt % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
            
            let currentX = startX;
            let currentY = 0;
            this.ctx.moveTo(currentX, currentY);
            
            while (currentY < this.canvas.height) {
                currentY += 20 + Math.random() * 40;
                currentX += (Math.random() - 0.5) * 60 * intensity;
                this.ctx.lineTo(currentX, currentY);
            }
            
            this.ctx.stroke();
            
            this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            this.ctx.shadowBlur = 20;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawRipple() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const intensity = (this.dataArray[i] / 255) * this.sensitivity;
            const radius = (i / this.bufferLength) * maxRadius;
            
            const colorIndex = Math.floor((i / this.bufferLength) * colors.length);
            const color = this.hexToRgb(colors[colorIndex]);
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`;
            this.ctx.lineWidth = this.lineWidth + intensity * 5;
            this.ctx.stroke();
        }
    }
    
    drawCube() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme];
        const size = 200;
        
        const avgIntensity = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;
        const intensity = (avgIntensity / 255) * this.sensitivity;
        const rotation = Date.now() * 0.001 * intensity;
        
        const cubeSize = size + intensity * 100;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
        
        const rotatedVertices = vertices.map(vertex => {
            let [x, y, z] = vertex;
            
            const cosX = Math.cos(rotation);
            const sinX = Math.sin(rotation);
            const cosY = Math.cos(rotation * 0.7);
            const sinY = Math.sin(rotation * 0.7);
            
            [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
            [x, z] = [x * cosY - z * sinY, x * sinY + z * cosY];
            
            return [x * cubeSize / 2, y * cubeSize / 2, z];
        });
        
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        
        edges.forEach((edge, index) => {
            const [start, end] = edge;
            const startVertex = rotatedVertices[start];
            const endVertex = rotatedVertices[end];
            
            const colorIndex = index % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startVertex[0], startVertex[1]);
            this.ctx.lineTo(endVertex[0], endVertex[1]);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity + 0.3})`;
            this.ctx.lineWidth = this.lineWidth * 2 + intensity * 3;
            this.ctx.stroke();
        });
        
        this.ctx.restore();
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
        if (!this.audioFile.files[0]) {
            alert('먼저 음악 파일을 선택해주세요.');
            return;
        }
        
        try {
            this.updateRecordingStatus('녹화 준비 중...');
            
            this.isRecording = true;
            this.audioPlayer.currentTime = 0;
            
            await this.play();
            
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
            
            if (!transparent) {
                try {
                    const audioStream = this.audioPlayer.captureStream();
                    const audioTracks = audioStream.getAudioTracks();
                    
                    if (audioTracks.length > 0) {
                        stream.addTrack(audioTracks[0]);
                    }
                } catch (e) {
                    console.log('오디오 캡처 실패, 비디오만 녹화합니다.');
                }
            }
            
            const mimeType = 'video/webm;codecs=vp9';
            this.mediaRecorder = new MediaRecorder(stream, { 
                mimeType,
                videoBitsPerSecond: 8000000
            });
            
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
                this.isRecording = false;
                
                this.updateRecordingStatus('다운로드 완료');
                setTimeout(() => this.updateRecordingStatus('준비'), 2000);
            };
            
            this.mediaRecorder.start();
            this.updateRecordingStatus('녹화 중...');
            
            const recordFrame = () => {
                if (this.isRecording && this.isPlaying) {
                    this.drawVisualizer(transparent);
                    requestAnimationFrame(recordFrame);
                }
            };
            
            recordFrame();
            
        } catch (error) {
            console.error('영상 생성 오류:', error);
            this.updateRecordingStatus('영상 생성 실패');
            this.isRecording = false;
            setTimeout(() => this.updateRecordingStatus('준비'), 2000);
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MusicVisualizer();
});