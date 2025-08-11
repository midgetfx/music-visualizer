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
        this.backgroundType = 'transparent';
        this.customBackgroundColor = '#000000';
        
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
            crystal: ['#667eea', '#764ba2', '#f093fb'],
            cherry: ['#eb3349', '#f45c43', '#ff6b35'],
            electric: ['#00d2ff', '#3a7bd5', '#00d4aa'],
            cosmic: ['#667db6', '#0082c8', '#0078ff'],
            volcano: ['#ff416c', '#ff4b2b', '#ff5722'],
            dream: ['#a8caba', '#5d4e75', '#667db6'],
            neon3: ['#ff0099', '#493240', '#f093fb'],
            gradient: ['#667eea', '#764ba2', '#a8edea', '#fed6e3'],
            royal: ['#667db6', '#0082c8', '#667eea']
        };
        
        this.initializeElements();
        this.setupEventListeners();
        
        // 초기 색상 테마 확인
        console.log('Initial color theme:', this.colorTheme);
        console.log('Available color themes:', Object.keys(this.colorThemes));
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
        
        this.canvas.width = 1280;
        this.canvas.height = 720;
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
        
        // 색상 테마 이벤트 리스너 설정 - 더 강력한 디버깅
        const colorOptions = document.querySelectorAll('.color-option');
        console.log('Found color options:', colorOptions.length);
        
        colorOptions.forEach((option, index) => {
            console.log(`Color option ${index}:`, option.textContent, 'data-theme:', option.dataset.theme);
            
            option.addEventListener('click', (e) => {
                console.log('Color option clicked:', e.target.textContent, e.target.dataset.theme);
                
                // 활성 클래스 제거/추가
                colorOptions.forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
                
                // 이전 테마와 새 테마 비교
                const oldTheme = this.colorTheme;
                this.colorTheme = e.target.dataset.theme;
                
                console.log('Theme changed from', oldTheme, 'to', this.colorTheme);
                console.log('New colors:', this.colorThemes[this.colorTheme]);
                
                // 색상 테마 변경 즉시 테스트 그리기
                this.testColorTheme();
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
        
        // 배경 설정 이벤트 리스너
        const backgroundOptions = document.querySelectorAll('.background-option');
        const customBackgroundControls = document.querySelector('.custom-background-controls');
        const customBackgroundColor = document.getElementById('customBackgroundColor');
        
        backgroundOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                backgroundOptions.forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
                this.backgroundType = e.target.dataset.background;
                
                if (this.backgroundType === 'custom') {
                    customBackgroundControls.style.display = 'flex';
                } else {
                    customBackgroundControls.style.display = 'none';
                }
            });
        });
        
        customBackgroundColor.addEventListener('input', (e) => {
            this.customBackgroundColor = e.target.value;
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
            // 오디오 파일 형식 확인
            if (!file.type.startsWith('audio/')) {
                throw new Error('지원되지 않는 파일 형식입니다. 오디오 파일을 선택해주세요.');
            }
            
            // 기존 URL 정리
            if (this.audioPlayer.src && this.audioPlayer.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.audioPlayer.src);
            }
            
            const audioUrl = URL.createObjectURL(file);
            this.audioPlayer.src = audioUrl;
            
            // 오디오 로드 완료 대기
            await new Promise((resolve, reject) => {
                const onLoad = () => {
                    this.audioPlayer.removeEventListener('loadeddata', onLoad);
                    this.audioPlayer.removeEventListener('error', onError);
                    resolve();
                };
                const onError = (e) => {
                    this.audioPlayer.removeEventListener('loadeddata', onLoad);
                    this.audioPlayer.removeEventListener('error', onError);
                    reject(new Error('오디오 파일 로드 실패: ' + (e.message || 'Unknown error')));
                };
                
                this.audioPlayer.addEventListener('loadeddata', onLoad, { once: true });
                this.audioPlayer.addEventListener('error', onError, { once: true });
            });
            
            await this.initializeAudioContext();
            this.enableButtons();
            this.updateStatus('파일 로드 완료');
        } catch (error) {
            console.error('오디오 파일 로드 오류:', error);
            this.updateStatus('파일 로드 실패: ' + error.message);
            alert('오류: ' + error.message);
        }
    }
    
    async initializeAudioContext() {
        // 기존 연결 정리
        if (this.source) {
            try {
                this.source.disconnect();
            } catch (e) {
                console.log('Source disconnect error (expected):', e);
            }
            this.source = null;
        }
        
        if (this.audioContext) {
            try {
                await this.audioContext.close();
            } catch (e) {
                console.log('AudioContext close error:', e);
            }
        }
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.source = this.audioContext.createMediaElementSource(this.audioPlayer);
        } catch (error) {
            console.error('AudioContext 초기화 오류:', error);
            throw error;
        }
        
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
            // 투명 배경을 위해 완전히 지우기
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.clearRect(0, 0, width, height);
            this.ctx.restore();
        } else {
            // 배경 설정에 따른 배경 그리기
            this.drawBackground();
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
            case 'wormhole':
                this.drawWormhole();
                break;
            case 'matrixrain':
                this.drawMatrixRain();
                break;
            case 'soundwave':
                this.drawSoundwave();
                break;
            case 'planet':
                this.drawPlanet();
                break;
            case 'neural':
                this.drawNeural();
                break;
            case 'prism':
                this.drawPrism();
                break;
            case 'voronoi':
                this.drawVoronoi();
                break;
            case 'crystal':
                this.drawCrystal();
                break;
            case 'fluid':
                this.drawFluid();
                break;
            case 'galaxyspiral':
                this.drawGalaxySpiral();
                break;
            case 'membrane':
                this.drawMembrane();
                break;
            case 'quantum':
                this.drawQuantum();
                break;
            case 'fractals':
                this.drawFractals();
                break;
            case 'waveinterference':
                this.drawWaveInterference();
                break;
            case 'fireworks':
                this.drawFireworks();
                break;
            case 'aurora2':
                this.drawAurora2();
                break;
            case 'atom':
                this.drawAtom();
                break;
            case 'flock':
                this.drawFlock();
                break;
            case 'tesla':
                this.drawTesla();
                break;
            case 'hexagon':
                this.drawHexagon();
                break;
        }
    }
    
    drawBars() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme];
        
        // 폴백 색상 테마 사용
        if (!colors) {
            colors = this.colorThemes.neon;
        }
        
        // 첫 번째 프레임에서만 디버깅 출력
        if (Math.random() < 0.01) { // 1% 확률로 디버깅 출력
            console.log('drawBars - theme:', this.colorTheme, 'colors:', colors);
            console.log('First color conversion:', colors[0], '->', this.hexToRgb(colors[0]));
        }
        
        const barWidth = (width / this.bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * this.sensitivity;
            
            // 시그널 강도에 따른 색상 선택
            const intensity = this.dataArray[i] / 255;
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            
            // hex 색상을 rgba로 변환
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 상하 그라디언트 생성 (바닥에서 위로)
            const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
            
            // 바닥 색상 (어두운 색상)
            const bottomColor = `rgba(${Math.floor(color.r * 0.3)}, ${Math.floor(color.g * 0.3)}, ${Math.floor(color.b * 0.3)}, ${intensity * 0.9 + 0.1})`;
            
            // 중간 색상 (기본 색상)
            const middleColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8 + 0.2})`;
            
            // 상단 색상 (밝은 색상)
            const topColor = `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${intensity * 0.7 + 0.3})`;
            
            gradient.addColorStop(0, bottomColor);   // 바닥 (어둠)
            gradient.addColorStop(0.5, middleColor); // 중간 (기본)
            gradient.addColorStop(1, topColor);      // 상단 (밝음)
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            // 반사 효과 (글로우 효과로 변경)
            if (barHeight > 10) {
                const glowGradient = this.ctx.createLinearGradient(0, height - barHeight - 5, 0, height - barHeight + 5);
                glowGradient.addColorStop(0, `rgba(${Math.min(255, color.r + 150)}, ${Math.min(255, color.g + 150)}, ${Math.min(255, color.b + 150)}, 0)`);
                glowGradient.addColorStop(1, `rgba(${Math.min(255, color.r + 150)}, ${Math.min(255, color.g + 150)}, ${Math.min(255, color.b + 150)}, ${intensity * 0.3})`);
                
                this.ctx.fillStyle = glowGradient;
                this.ctx.fillRect(x - 2, height - barHeight - 5, barWidth + 4, 10);
            }
            
            x += barWidth + 1;
        }
    }
    
    drawWaveform() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        const barCount = this.bufferLength / 2;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * this.sensitivity;
            
            // 시그널 강도에 따라 색상 선택 (낮은 주파수 = 첫 번째 색상, 높은 주파수 = 마지막 색상)
            const intensity = this.dataArray[i] / 255;
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 강도에 따른 색상 밝기 조절
            const brightnessMultiplier = 0.3 + (intensity * 0.7);
            const r = Math.floor(color.r * brightnessMultiplier);
            const g = Math.floor(color.g * brightnessMultiplier);
            const b = Math.floor(color.b * brightnessMultiplier);
            
            const gradient = this.ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`);
            gradient.addColorStop(1, `rgba(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)}, 0.3)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
            
            // 대칭 효과
            this.ctx.fillRect((width - i * barWidth - barWidth), height - barHeight, barWidth - 1, barHeight);
        }
    }
    
    drawSpiral() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        const barWidth = width / this.bufferLength;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * (height / 2) * this.sensitivity;
            const intensity = this.dataArray[i] / 255;
            
            // 시그널 강도에 따른 색상 선택
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
            const ratio = (intensity * (colors.length - 1)) % 1;
            
            const color1 = this.hexToRgb(colors[colorIndex]);
            const color2 = this.hexToRgb(colors[nextColorIndex]);
            
            // 색상 블렌딩
            const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
            const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
            const b = Math.round(color1.b + (color2.b - color1.b) * ratio);
            
            const alpha = intensity * 0.8 + 0.2;
            
            // 상단 (원본)
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.fillRect(i * barWidth, height / 2 - barHeight, barWidth - 1, barHeight);
            
            // 하단 (미러) - 약간 어둡게
            const mirrorAlpha = alpha * 0.6;
            this.ctx.fillStyle = `rgba(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)}, ${mirrorAlpha})`;
            this.ctx.fillRect(i * barWidth, height / 2, barWidth - 1, barHeight);
        }
    }
    
    drawDNA() {
        const centerX = this.canvas.width / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        // 더 복잡한 별자리 패턴
        const constellations = 5;
        const starsPerConstellation = 8;
        const time = Date.now() * 0.001;
        
        for (let constellation = 0; constellation < constellations; constellation++) {
            const baseAngle = (constellation / constellations) * Math.PI * 2;
            const avgIntensity = this.dataArray.slice(
                constellation * 50, 
                (constellation + 1) * 50
            ).reduce((a, b) => a + b, 0) / 50;
            const intensity = (avgIntensity / 255) * this.sensitivity;
            
            if (intensity < 0.1) continue;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 별자리 중심점
            const constellationRadius = 150 + intensity * 200;
            const constellationX = centerX + Math.cos(baseAngle) * constellationRadius;
            const constellationY = centerY + Math.sin(baseAngle) * constellationRadius;
            
            for (let star = 0; star < starsPerConstellation; star++) {
                const dataIndex = (constellation * starsPerConstellation + star) % this.bufferLength;
                const starIntensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                const starAngle = (star / starsPerConstellation) * Math.PI * 2 + time * 0.5;
                const starDistance = 30 + starIntensity * 80;
                
                const x = constellationX + Math.cos(starAngle) * starDistance;
                const y = constellationY + Math.sin(starAngle) * starDistance;
                const size = starIntensity * 15 + 2;
                
                // 별 그리기
                this.ctx.save();
                this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
                this.ctx.shadowBlur = size * 3;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${starIntensity + 0.3})`;
                this.ctx.fill();
                
                // 별 반짝임 효과
                if (starIntensity > 0.5) {
                    this.drawStar(x, y, size * 2, `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${starIntensity * 0.5})`);
                }
                
                this.ctx.restore();
            }
            
            // 별자리 연결선
            if (intensity > 0.3) {
                this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.3})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                for (let i = 0; i < starsPerConstellation; i++) {
                    const angle1 = (i / starsPerConstellation) * Math.PI * 2 + time * 0.5;
                    const angle2 = ((i + 1) % starsPerConstellation / starsPerConstellation) * Math.PI * 2 + time * 0.5;
                    const x1 = constellationX + Math.cos(angle1) * 50;
                    const y1 = constellationY + Math.sin(angle1) * 50;
                    const x2 = constellationX + Math.cos(angle2) * 50;
                    const y2 = constellationY + Math.sin(angle2) * 50;
                    
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                }
                this.ctx.stroke();
            }
        }
    }
    
    drawStar(x, y, size, color) {
        const spikes = 6;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const posX = x + Math.cos(angle) * radius;
            const posY = y + Math.sin(angle) * radius;
            
            if (i === 0) this.ctx.moveTo(posX, posY);
            else this.ctx.lineTo(posX, posY);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    
    drawKaleido() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const segments = 8; // 더 많은 세그먼트
        const time = Date.now() * 0.002;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(time); // 전체 회전
        
        for (let segment = 0; segment < segments; segment++) {
            this.ctx.save();
            this.ctx.rotate((segment * Math.PI * 2) / segments);
            
            // 더 복잡한 패턴
            for (let ring = 0; ring < 5; ring++) {
                const dataSlice = this.bufferLength / (segments * 5);
                const startIndex = Math.floor((segment * 5 + ring) * dataSlice);
                const avgIntensity = this.dataArray.slice(startIndex, startIndex + dataSlice)
                    .reduce((a, b) => a + b, 0) / dataSlice;
                const intensity = (avgIntensity / 255) * this.sensitivity;
                
                if (intensity < 0.1) continue;
                
                const colorIndex = Math.floor(intensity * (colors.length - 1));
                const color = this.hexToRgb(colors[colorIndex]);
                
                const innerRadius = ring * 40 + 20;
                const outerRadius = innerRadius + intensity * 60;
                const angleSpread = (Math.PI / segments) * 0.8;
                
                // 내부 그라데이션
                const gradient = this.ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
                gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
                gradient.addColorStop(0.7, `rgba(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)}, ${intensity * 0.7})`);
                gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`);
                
                // 부채꼴 모양 그리기
                this.ctx.beginPath();
                this.ctx.arc(0, 0, outerRadius, -angleSpread / 2, angleSpread / 2);
                this.ctx.arc(0, 0, innerRadius, angleSpread / 2, -angleSpread / 2, true);
                this.ctx.closePath();
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
                
                // 세비 효과
                this.ctx.strokeStyle = `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${intensity * 0.5})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // 점처리 효과
                if (intensity > 0.6) {
                    for (let dot = 0; dot < 5; dot++) {
                        const dotAngle = (-angleSpread / 2) + (angleSpread * dot / 4);
                        const dotRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const dotX = Math.cos(dotAngle) * dotRadius;
                        const dotY = Math.sin(dotAngle) * dotRadius;
                        
                        this.ctx.beginPath();
                        this.ctx.arc(dotX, dotY, intensity * 3, 0, Math.PI * 2);
                        this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
                        this.ctx.fill();
                    }
                }
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawLightning() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
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
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2 * 0.8;
        
        // 성능 최적화: 매 프레임마다 모든 원을 그리지 않고 간격을 둠
        const step = Math.max(1, Math.floor(this.bufferLength / 30)); // 최대 30개 원만 그리기
        
        for (let i = 0; i < this.bufferLength; i += step) {
            const intensity = (this.dataArray[i] / 255) * this.sensitivity;
            
            // 강도가 낮으면 건너뛰기 (시각적 정리)
            if (intensity < 0.1) continue;
            
            const radius = (i / this.bufferLength) * maxRadius;
            if (radius > maxRadius) continue;
            
            // 시그널 강도에 따른 색상 선택
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 강도에 따른 동적 투명도와 선 두께
            const dynamicAlpha = intensity * 0.6 + 0.1;
            const dynamicLineWidth = this.lineWidth + intensity * 4;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${dynamicAlpha})`;
            this.ctx.lineWidth = dynamicLineWidth;
            this.ctx.stroke();
            
            // 내부 글로우 효과
            if (intensity > 0.5) {
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${intensity * 0.3})`;
                this.ctx.lineWidth = dynamicLineWidth * 0.5;
                this.ctx.stroke();
            }
        }
    }
    
    drawCube() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
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
    
    drawWormhole() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.003;
        
        const rings = 40;
        const avgIntensity = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;
        const masterIntensity = (avgIntensity / 255) * this.sensitivity;
        
        // 배경 중력장 효과
        const backgroundGradient = this.ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 400);
        backgroundGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        backgroundGradient.addColorStop(0.5, 'rgba(20, 20, 40, 0.4)');
        backgroundGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = backgroundGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 메인 웜홀 링들
        for (let ring = 0; ring < rings; ring++) {
            const dataIndex = Math.floor((ring / rings) * this.bufferLength);
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            if (intensity < 0.05) continue; // 너무 약한 시그널은 건너뛰기
            
            const progress = ring / rings;
            const baseRadius = 20 + progress * 450;
            const waveOffset = Math.sin(time * 2 + progress * 8) * 15 * intensity;
            const radius = baseRadius + waveOffset;
            const rotation = time * 3 + progress * 7;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 다중 레이어 세그먼트
            const layers = 3;
            for (let layer = 0; layer < layers; layer++) {
                const layerRadius = radius + layer * 8;
                const layerAlpha = (1 - layer * 0.3) * intensity;
                
                const segments = 12 + Math.floor(intensity * 8); // 강도에 따라 세그먼트 수 변화
                for (let segment = 0; segment < segments; segment++) {
                    const angle = (segment / segments) * Math.PI * 2 + rotation + layer * 0.3;
                    const segmentIntensity = layerAlpha * (0.6 + Math.sin(time * 4 + segment + layer) * 0.4);
                    
                    this.ctx.save();
                    this.ctx.translate(centerX, centerY);
                    this.ctx.rotate(angle);
                    
                    // 복잡한 그라데이션
                    const gradient = this.ctx.createRadialGradient(0, 0, layerRadius * 0.7, 0, 0, layerRadius * 1.3);
                    gradient.addColorStop(0, `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${segmentIntensity})`);
                    gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${segmentIntensity * 0.8})`);
                    gradient.addColorStop(1, `rgba(${Math.floor(color.r * 0.5)}, ${Math.floor(color.g * 0.5)}, ${Math.floor(color.b * 0.5)}, 0)`);
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    const angleSpan = Math.PI / segments * 0.8;
                    
                    // 외부 호
                    this.ctx.arc(0, 0, layerRadius, -angleSpan, angleSpan);
                    // 내부 호
                    this.ctx.arc(0, 0, layerRadius * 0.5, angleSpan, -angleSpan, true);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // 광선 효과
                    if (intensity > 0.7 && layer === 0) {
                        this.ctx.strokeStyle = `rgba(${Math.min(255, color.r + 150)}, ${Math.min(255, color.g + 150)}, ${Math.min(255, color.b + 150)}, ${intensity * 0.6})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(layerRadius * 0.5, 0);
                        this.ctx.lineTo(layerRadius * 1.5, 0);
                        this.ctx.stroke();
                    }
                    
                    this.ctx.restore();
                }
            }
            
            // 중심부 파티클 효과
            if (intensity > 0.5 && ring % 5 === 0) {
                const particleCount = 6;
                for (let p = 0; p < particleCount; p++) {
                    const particleAngle = (p / particleCount) * Math.PI * 2 + time * 5;
                    const particleRadius = 10 + intensity * 30;
                    const px = centerX + Math.cos(particleAngle) * particleRadius;
                    const py = centerY + Math.sin(particleAngle) * particleRadius;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, intensity * 4 + 1, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${intensity})`;
                    this.ctx.fill();
                    
                    // 파티클 글로우
                    this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
                    this.ctx.shadowBlur = intensity * 10;
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }
        
        // 중앙 특이점
        const singularityGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
        const singularityColor = this.hexToRgb(colors[Math.floor(masterIntensity * (colors.length - 1))]);
        singularityGradient.addColorStop(0, `rgba(${Math.min(255, singularityColor.r + 200)}, ${Math.min(255, singularityColor.g + 200)}, ${Math.min(255, singularityColor.b + 200)}, 1)`);
        singularityGradient.addColorStop(0.6, `rgba(${singularityColor.r}, ${singularityColor.g}, ${singularityColor.b}, ${masterIntensity})`);
        singularityGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        
        this.ctx.fillStyle = singularityGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15 + masterIntensity * 10, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawMatrixRain() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const columns = 60;
        const columnWidth = this.canvas.width / columns;
        
        if (!this.matrixDrops) {
            this.matrixDrops = Array(columns).fill(0).map(() => ({
                y: Math.random() * this.canvas.height,
                speed: 2 + Math.random() * 8,
                chars: []
            }));
        }
        
        for (let col = 0; col < columns; col++) {
            const dataIndex = Math.floor((col / columns) * this.bufferLength);
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            const drop = this.matrixDrops[col];
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 문자 업데이트
            drop.speed = 2 + intensity * 15;
            drop.y += drop.speed;
            
            if (drop.y > this.canvas.height + 50) {
                drop.y = -50;
                drop.chars = [];
            }
            
            // 새 문자 추가
            if (Math.random() < intensity * 0.3) {
                const start = 0xAC00; // '가'
                const end = 0xD7A3;   // '힣'
                const code = Math.floor(Math.random() * (end - start + 1)) + start;

                drop.chars.push({
                    char: String.fromCharCode(code),
                    y: drop.y,
                    age: 0
                });
            }
            
            // 문자 그리기
            drop.chars.forEach((charObj, index) => {
                charObj.age++;
                const alpha = Math.max(0, 1 - (charObj.age / 60));
                const size = 12 + intensity * 10;
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                this.ctx.font = `${size}px monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(charObj.char, col * columnWidth + columnWidth / 2, charObj.y);
                
                // 글로우 효과
                if (index === drop.chars.length - 1 && intensity > 0.5) {
                    this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
                    this.ctx.shadowBlur = 10;
                    this.ctx.fillText(charObj.char, col * columnWidth + columnWidth / 2, charObj.y);
                    this.ctx.shadowBlur = 0;
                }
            });
            
            // 오래된 문자 제거
            drop.chars = drop.chars.filter(char => char.age < 60);
        }
    }
    
    drawSoundwave() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const centerY = height / 2;
        
        // 3D 파형 효과
        const layers = 5;
        for (let layer = 0; layer < layers; layer++) {
            this.ctx.save();
            
            const layerOffset = (layer - 2) * 50;
            const layerScale = 1 - (Math.abs(layer - 2) * 0.15);
            const layerAlpha = 1 - (Math.abs(layer - 2) * 0.2);
            
            this.ctx.translate(0, layerOffset);
            this.ctx.scale(layerScale, layerScale);
            
            const colorIndex = layer % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            
            this.ctx.lineWidth = this.lineWidth * 3;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${layerAlpha})`;
            
            this.ctx.beginPath();
            for (let i = 0; i < this.bufferLength; i++) {
                const x = (i / this.bufferLength) * width;
                const intensity = (this.dataArray[i] / 255) * this.sensitivity;
                const y = centerY + Math.sin((i / this.bufferLength) * Math.PI * 8 + Date.now() * 0.01) * intensity * 200;
                
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    drawPlanet() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.002;
        
        const planets = 5;
        for (let planet = 0; planet < planets; planet++) {
            const dataSlice = this.bufferLength / planets;
            const avgIntensity = this.dataArray.slice(planet * dataSlice, (planet + 1) * dataSlice)
                .reduce((a, b) => a + b, 0) / dataSlice;
            const intensity = (avgIntensity / 255) * this.sensitivity;
            
            if (intensity < 0.1) continue;
            
            const angle = time + (planet * Math.PI * 2 / planets);
            const orbitRadius = 100 + planet * 80;
            const planetRadius = 20 + intensity * 40;
            
            const x = centerX + Math.cos(angle) * orbitRadius;
            const y = centerY + Math.sin(angle) * orbitRadius;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 궤도 그리기
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 행성 그리기
            const gradient = this.ctx.createRadialGradient(x - planetRadius * 0.3, y - planetRadius * 0.3, 0, x, y, planetRadius);
            gradient.addColorStop(0, `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, 1)`);
            gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
            gradient.addColorStop(1, `rgba(${Math.floor(color.r * 0.3)}, ${Math.floor(color.g * 0.3)}, ${Math.floor(color.b * 0.3)}, 0.6)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, planetRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 위성들
            const satellites = Math.floor(intensity * 3) + 1;
            for (let sat = 0; sat < satellites; sat++) {
                const satAngle = time * 3 + (sat * Math.PI * 2 / satellites);
                const satDistance = planetRadius + 15 + sat * 10;
                const satX = x + Math.cos(satAngle) * satDistance;
                const satY = y + Math.sin(satAngle) * satDistance;
                const satRadius = 2 + intensity * 5;
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
                this.ctx.beginPath();
                this.ctx.arc(satX, satY, satRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawNeural() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const nodes = 20;
        
        if (!this.neuralNodes) {
            this.neuralNodes = Array(nodes).fill(0).map(() => ({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                connections: []
            }));
            
            // 연결 생성
            for (let i = 0; i < nodes; i++) {
                for (let j = i + 1; j < nodes; j++) {
                    if (Math.random() < 0.3) {
                        this.neuralNodes[i].connections.push(j);
                    }
                }
            }
        }
        
        // 노드와 연결 그리기
        this.neuralNodes.forEach((node, index) => {
            const dataIndex = Math.floor((index / nodes) * this.bufferLength);
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 연결선 그리기
            node.connections.forEach(targetIndex => {
                const target = this.neuralNodes[targetIndex];
                const connectionIntensity = (intensity + (this.dataArray[Math.floor((targetIndex / nodes) * this.bufferLength)] / 255)) / 2;
                
                this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${connectionIntensity * 0.5})`;
                this.ctx.lineWidth = connectionIntensity * 3;
                this.ctx.beginPath();
                this.ctx.moveTo(node.x, node.y);
                this.ctx.lineTo(target.x, target.y);
                this.ctx.stroke();
            });
            
            // 노드 그리기
            const nodeRadius = 5 + intensity * 15;
            const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeRadius);
            gradient.addColorStop(0, `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, 1)`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawPrism() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.003;
        
        // 프리즘을 통과하는 빛의 스펙트럼 효과
        const rays = this.bufferLength / 4;
        for (let i = 0; i < rays; i++) {
            const intensity = (this.dataArray[i] / 255) * this.sensitivity;
            if (intensity < 0.1) continue;
            
            const angle = (i / rays) * Math.PI * 2 + time;
            const startRadius = 50;
            const endRadius = 300 + intensity * 200;
            
            // 색상 분산 효과
            colors.forEach((colorHex, colorIndex) => {
                const color = this.hexToRgb(colorHex);
                const offsetAngle = angle + (colorIndex - colors.length / 2) * 0.02;
                
                const startX = centerX + Math.cos(offsetAngle) * startRadius;
                const startY = centerY + Math.sin(offsetAngle) * startRadius;
                const endX = centerX + Math.cos(offsetAngle) * endRadius;
                const endY = centerY + Math.sin(offsetAngle) * endRadius;
                
                const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
                gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
                gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
                
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = intensity * 5 + 1;
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            });
        }
        
        // 중앙 프리즘
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(time);
        
        const prismSize = 40;
        this.ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const x = Math.cos(angle) * prismSize;
            const y = Math.sin(angle) * prismSize;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawVoronoi() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const sites = 15;
        
        if (!this.voronoiSites) {
            this.voronoiSites = Array(sites).fill(0).map(() => ({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height
            }));
        }
        
        // 간단한 보로노이 다이어그램 시뮬레이션
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let y = 0; y < this.canvas.height; y += 4) {
            for (let x = 0; x < this.canvas.width; x += 4) {
                let minDist = Infinity;
                let closestSite = 0;
                
                // 가장 가까운 사이트 찾기
                this.voronoiSites.forEach((site, index) => {
                    const dist = Math.sqrt((x - site.x) ** 2 + (y - site.y) ** 2);
                    if (dist < minDist) {
                        minDist = dist;
                        closestSite = index;
                    }
                });
                
                const dataIndex = Math.floor((closestSite / sites) * this.bufferLength);
                const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                const colorIndex = Math.floor(intensity * (colors.length - 1));
                const color = this.hexToRgb(colors[colorIndex]);
                
                // 4x4 블록 채우기
                for (let dy = 0; dy < 4 && y + dy < this.canvas.height; dy++) {
                    for (let dx = 0; dx < 4 && x + dx < this.canvas.width; dx++) {
                        const pixelIndex = ((y + dy) * this.canvas.width + (x + dx)) * 4;
                        data[pixelIndex] = color.r * intensity;
                        data[pixelIndex + 1] = color.g * intensity;
                        data[pixelIndex + 2] = color.b * intensity;
                        data[pixelIndex + 3] = intensity * 255;
                    }
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        // 사이트 포인트 그리기
        this.voronoiSites.forEach((site, index) => {
            const dataIndex = Math.floor((index / sites) * this.bufferLength);
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            if (intensity > 0.3) {
                const colorIndex = Math.floor(intensity * (colors.length - 1));
                const color = this.hexToRgb(colors[colorIndex]);
                
                this.ctx.fillStyle = `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, 1)`;
                this.ctx.beginPath();
                this.ctx.arc(site.x, site.y, 5 + intensity * 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawCrystal() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.002;
        
        const crystals = 8;
        for (let crystal = 0; crystal < crystals; crystal++) {
            const dataSlice = this.bufferLength / crystals;
            const avgIntensity = this.dataArray.slice(crystal * dataSlice, (crystal + 1) * dataSlice)
                .reduce((a, b) => a + b, 0) / dataSlice;
            const intensity = (avgIntensity / 255) * this.sensitivity;
            
            if (intensity < 0.1) continue;
            
            const angle = (crystal / crystals) * Math.PI * 2 + time;
            const distance = 150 + intensity * 200;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 크리스탈 면들
            const faces = 6;
            const size = 30 + intensity * 50;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(time + crystal * 0.5);
            
            for (let face = 0; face < faces; face++) {
                const faceAngle = (face / faces) * Math.PI * 2;
                const nextAngle = ((face + 1) / faces) * Math.PI * 2;
                
                // 그라데이션으로 3D 효과
                const gradient = this.ctx.createLinearGradient(-size, -size, size, size);
                gradient.addColorStop(0, `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${intensity})`);
                gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`);
                gradient.addColorStop(1, `rgba(${Math.floor(color.r * 0.3)}, ${Math.floor(color.g * 0.3)}, ${Math.floor(color.b * 0.3)}, ${intensity * 0.6})`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(Math.cos(faceAngle) * size, Math.sin(faceAngle) * size);
                this.ctx.lineTo(Math.cos(nextAngle) * size, Math.sin(nextAngle) * size);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 경계선
                this.ctx.strokeStyle = `rgba(${Math.min(255, color.r + 150)}, ${Math.min(255, color.g + 150)}, ${Math.min(255, color.b + 150)}, ${intensity * 0.7})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }
    
    drawFluid() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.003;
        
        if (!this.fluidParticles) {
            this.fluidParticles = Array(150).fill(0).map(() => ({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 8 + 2
            }));
        }
        
        // 유체 시뮬레이션
        this.fluidParticles.forEach((particle, index) => {
            const dataIndex = index % this.bufferLength;
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            // 음악에 따른 힘 적용
            const forceX = Math.sin(time + index * 0.1) * intensity * 5;
            const forceY = Math.cos(time + index * 0.1) * intensity * 5;
            
            particle.vx += forceX * 0.1;
            particle.vy += forceY * 0.1;
            
            // 감쇠
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // 위치 업데이트
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 경계 처리
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -0.8;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -0.8;
            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            
            // 색상 및 크기
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            const size = particle.size * (0.5 + intensity);
            
            // 파티클 그리기
            const gradient = this.ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 연결선 (점성 효과)
        for (let i = 0; i < this.fluidParticles.length; i++) {
            for (let j = i + 1; j < this.fluidParticles.length; j++) {
                const p1 = this.fluidParticles[i];
                const p2 = this.fluidParticles[j];
                const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
                
                if (dist < 80) {
                    const intensity1 = (this.dataArray[i % this.bufferLength] / 255) * this.sensitivity;
                    const intensity2 = (this.dataArray[j % this.bufferLength] / 255) * this.sensitivity;
                    const avgIntensity = (intensity1 + intensity2) / 2;
                    
                    const alpha = (1 - dist / 80) * avgIntensity * 0.3;
                    if (alpha > 0.05) {
                        const colorIndex = Math.floor(avgIntensity * (colors.length - 1));
                        const color = this.hexToRgb(colors[colorIndex]);
                        
                        this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }
    
    drawGalaxySpiral() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.001;
        
        const arms = 4;
        
        for (let arm = 0; arm < arms; arm++) {
            const armAngle = (arm / arms) * Math.PI * 2;
            
            for (let i = 0; i < this.bufferLength / 4; i++) {
                const dataIndex = Math.floor((arm * this.bufferLength / 4) + i);
                const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                if (intensity < 0.1) continue;
                
                const progress = i / (this.bufferLength / 4);
                const radius = progress * 300;
                const spiralAngle = armAngle + progress * Math.PI * 6 + time;
                
                const x = centerX + Math.cos(spiralAngle) * radius;
                const y = centerY + Math.sin(spiralAngle) * radius;
                
                const colorIndex = Math.floor(intensity * (colors.length - 1));
                const color = this.hexToRgb(colors[colorIndex]);
                
                // 별과 먼지 효과
                const starSize = intensity * 8 + 1;
                
                // 글로우 효과
                this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
                this.ctx.shadowBlur = starSize * 3;
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 먼지 구름
                if (intensity > 0.3) {
                    this.ctx.shadowBlur = starSize * 8;
                    this.ctx.shadowColor = `rgba(${Math.floor(color.r * 0.7)}, ${Math.floor(color.g * 0.7)}, ${Math.floor(color.b * 0.7)}, 0.3)`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, starSize * 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.shadowBlur = 0;
            }
        }
        
        // 중앙 블랙홀
        const coreGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
        coreGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        coreGradient.addColorStop(0.7, 'rgba(50, 30, 100, 0.5)');
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawMembrane() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.002;
        const gridSize = 40;
        const cols = Math.floor(this.canvas.width / gridSize);
        const rows = Math.floor(this.canvas.height / gridSize);
        
        // 3D 멤브레인 그리기
        for (let row = 0; row < rows - 1; row++) {
            for (let col = 0; col < cols - 1; col++) {
                const dataIndex = (row * cols + col) % this.bufferLength;
                const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                const x = col * gridSize;
                const y = row * gridSize;
                
                // 높이 계산 (Z축)
                const height = Math.sin(time + x * 0.01 + y * 0.01) * intensity * 50;
                const nextHeight = Math.sin(time + (x + gridSize) * 0.01 + y * 0.01) * intensity * 50;
                const downHeight = Math.sin(time + x * 0.01 + (y + gridSize) * 0.01) * intensity * 50;
                const diagHeight = Math.sin(time + (x + gridSize) * 0.01 + (y + gridSize) * 0.01) * intensity * 50;
                
                const colorIndex = Math.floor(intensity * (colors.length - 1));
                const color = this.hexToRgb(colors[colorIndex]);
                
                // 사각형 면을 두 개의 삼각형으로 나누어 그리기
                // 첫 번째 삼각형
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.7})`;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - height * 0.5);
                this.ctx.lineTo(x + gridSize, y - nextHeight * 0.5);
                this.ctx.lineTo(x, y + gridSize - downHeight * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 두 번째 삼각형
                this.ctx.beginPath();
                this.ctx.moveTo(x + gridSize, y - nextHeight * 0.5);
                this.ctx.lineTo(x + gridSize, y + gridSize - diagHeight * 0.5);
                this.ctx.lineTo(x, y + gridSize - downHeight * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 와이어프레임 효과
                if (intensity > 0.3) {
                    this.ctx.strokeStyle = `rgba(${Math.min(255, color.r + 100)}, ${Math.min(255, color.g + 100)}, ${Math.min(255, color.b + 100)}, ${intensity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawQuantum() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.005;
        
        // 양자 필드 효과
        const fieldPoints = 100;
        for (let point = 0; point < fieldPoints; point++) {
            const dataIndex = point % this.bufferLength;
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            if (intensity < 0.2) continue;
            
            const angle = (point / fieldPoints) * Math.PI * 2;
            const radius = 100 + Math.sin(time * 3 + angle * 5) * 150;
            
            // 양자 터널링 효과 (확률적 위치)
            const quantumX = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * intensity * 100;
            const quantumY = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * intensity * 100;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 파동 함수 시각화
            const waveSize = intensity * 20 + 5;
            const phase = time * 2 + point * 0.3;
            const alpha = (Math.sin(phase) + 1) * 0.5 * intensity;
            
            // 입자
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(quantumX, quantumY, waveSize * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 확률 구름
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.2})`;
            this.ctx.beginPath();
            this.ctx.arc(quantumX, quantumY, waveSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 간섭 패턴
            if (Math.random() < intensity * 0.5) {
                for (let ring = 1; ring <= 3; ring++) {
                    this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3 / ring})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(quantumX, quantumY, waveSize * ring, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
        
        // 얽힌 입자들
        for (let pair = 0; pair < 5; pair++) {
            const dataIndex1 = pair * 2;
            const dataIndex2 = pair * 2 + 1;
            const intensity1 = (this.dataArray[dataIndex1] / 255) * this.sensitivity;
            const intensity2 = (this.dataArray[dataIndex2] / 255) * this.sensitivity;
            
            if (intensity1 > 0.5 && intensity2 > 0.5) {
                const angle1 = time + pair * Math.PI / 3;
                const angle2 = angle1 + Math.PI; // 반대 방향
                
                const x1 = centerX + Math.cos(angle1) * 200;
                const y1 = centerY + Math.sin(angle1) * 200;
                const x2 = centerX + Math.cos(angle2) * 200;
                const y2 = centerY + Math.sin(angle2) * 200;
                
                const avgIntensity = (intensity1 + intensity2) / 2;
                const colorIndex = Math.floor(avgIntensity * (colors.length - 1));
                const color = this.hexToRgb(colors[colorIndex]);
                
                // 얽힘 연결선
                this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${avgIntensity * 0.5})`;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    }
    
    drawFractals() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.001;
        
        const drawMandelbrotLike = (centerX, centerY, zoom, intensity, color) => {
            const size = 100 * zoom;
            const detail = Math.floor(intensity * 30) + 10;
            
            for (let px = 0; px < detail; px++) {
                for (let py = 0; py < detail; py++) {
                    const x = centerX + (px - detail / 2) * (size / detail);
                    const y = centerY + (py - detail / 2) * (size / detail);
                    
                    // 간단한 프랙탈 계산
                    let zx = (x - centerX) / size * 4;
                    let zy = (y - centerY) / size * 4;
                    let cx = zx + Math.sin(time) * 0.5;
                    let cy = zy + Math.cos(time) * 0.5;
                    
                    let iterations = 0;
                    const maxIterations = Math.floor(intensity * 20) + 10;
                    
                    while (zx * zx + zy * zy < 4 && iterations < maxIterations) {
                        const tmp = zx * zx - zy * zy + cx;
                        zy = 2 * zx * zy + cy;
                        zx = tmp;
                        iterations++;
                    }
                    
                    const normalizedIterations = iterations / maxIterations;
                    const alpha = normalizedIterations * intensity * 0.8;
                    
                    if (alpha > 0.1) {
                        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                        this.ctx.fillRect(x, y, size / detail + 1, size / detail + 1);
                    }
                }
            }
        };
        
        // 여러 프랙탈 중심점
        const centers = 4;
        for (let center = 0; center < centers; center++) {
            const dataSlice = this.bufferLength / centers;
            const avgIntensity = this.dataArray.slice(center * dataSlice, (center + 1) * dataSlice)
                .reduce((a, b) => a + b, 0) / dataSlice;
            const intensity = (avgIntensity / 255) * this.sensitivity;
            
            if (intensity < 0.2) continue;
            
            const angle = (center / centers) * Math.PI * 2 + time * 0.5;
            const distance = 150 + intensity * 100;
            const centerX = this.canvas.width / 2 + Math.cos(angle) * distance;
            const centerY = this.canvas.height / 2 + Math.sin(angle) * distance;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            const zoom = 0.5 + intensity;
            
            drawMandelbrotLike(centerX, centerY, zoom, intensity, color);
        }
    }
    
    drawWaveInterference() {
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        const time = Date.now() * 0.003;
        
        // 파동 소스들
        const sources = 6;
        const waveData = [];
        
        for (let source = 0; source < sources; source++) {
            const dataIndex = Math.floor((source / sources) * this.bufferLength);
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            if (intensity > 0.1) {
                const angle = (source / sources) * Math.PI * 2 + time * 0.5;
                const x = this.canvas.width / 2 + Math.cos(angle) * (100 + intensity * 150);
                const y = this.canvas.height / 2 + Math.sin(angle) * (100 + intensity * 150);
                
                waveData.push({
                    x, y, intensity,
                    frequency: 0.02 + intensity * 0.05,
                    phase: time * 2 + source * Math.PI / 3,
                    color: this.hexToRgb(colors[Math.floor(intensity * (colors.length - 1))])
                });
            }
        }
        
        // 간섭 패턴 계산 및 그리기
        const resolution = 4;
        for (let x = 0; x < this.canvas.width; x += resolution) {
            for (let y = 0; y < this.canvas.height; y += resolution) {
                let totalAmplitude = 0;
                let weightedColor = { r: 0, g: 0, b: 0 };
                let totalWeight = 0;
                
                waveData.forEach(wave => {
                    const distance = Math.sqrt((x - wave.x) ** 2 + (y - wave.y) ** 2);
                    const amplitude = wave.intensity * Math.sin(distance * wave.frequency + wave.phase) * 
                                    Math.exp(-distance * 0.003); // 거리에 따른 감쇠
                    
                    totalAmplitude += amplitude;
                    
                    const weight = Math.abs(amplitude);
                    weightedColor.r += wave.color.r * weight;
                    weightedColor.g += wave.color.g * weight;
                    weightedColor.b += wave.color.b * weight;
                    totalWeight += weight;
                });
                
                if (totalWeight > 0) {
                    weightedColor.r /= totalWeight;
                    weightedColor.g /= totalWeight;
                    weightedColor.b /= totalWeight;
                    
                    const normalizedAmplitude = Math.abs(totalAmplitude);
                    const alpha = Math.min(1, normalizedAmplitude * 2);
                    
                    if (alpha > 0.05) {
                        this.ctx.fillStyle = `rgba(${Math.floor(weightedColor.r)}, ${Math.floor(weightedColor.g)}, ${Math.floor(weightedColor.b)}, ${alpha})`;
                        this.ctx.fillRect(x, y, resolution, resolution);
                    }
                }
            }
        }
        
        // 파동 소스 표시
        waveData.forEach(wave => {
            this.ctx.strokeStyle = `rgba(${wave.color.r}, ${wave.color.g}, ${wave.color.b}, ${wave.intensity})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, 10 + wave.intensity * 20, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 글로우 효과
            this.ctx.shadowColor = `rgba(${wave.color.r}, ${wave.color.g}, ${wave.color.b}, 0.8)`;
            this.ctx.shadowBlur = wave.intensity * 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        const rgb = result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 255, b: 255};
        
        // 디버깅: 색상 변환 결과 확인
        if (Math.random() < 0.001) {
            console.log('hexToRgb:', hex, '->', rgb);
        }
        
        return rgb;
    }
    
    clearCanvas() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    testColorTheme() {
        // 색상 테마 즉시 테스트를 위한 함수
        const colors = this.colorThemes[this.colorTheme];
        if (!colors) {
            console.error('Test failed - no colors for theme:', this.colorTheme);
            return;
        }
        
        console.log('Testing color theme:', this.colorTheme, 'Colors:', colors);
        
        // 캔버스 지우기 (검은색 배경)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 색상 테마의 모든 색상을 세로 줄무늬로 표시
        const stripWidth = this.canvas.width / colors.length;
        colors.forEach((color, index) => {
            // hexToRgb로 변환해서 실제 적용되는 색상 확인
            const rgb = this.hexToRgb(color);
            console.log(`Testing color ${index}: ${color} -> RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`);
            
            // 원본 hex 색상 직접 사용
            this.ctx.fillStyle = color;
            this.ctx.fillRect(index * stripWidth, 0, stripWidth, this.canvas.height);
            
            // 중앙에 색상 정보 텍스트 표시
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(color, (index + 0.5) * stripWidth, this.canvas.height / 2);
        });
        
        // 1초 후에 캔버스 다시 지우기 (번쩍임 방지)
        setTimeout(() => {
            this.clearCanvas();
        }, 1000);
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
                alpha: transparent,
                preserveDrawingBuffer: true,
                premultipliedAlpha: false
            });
            
            const originalCanvas = this.canvas;
            const originalCtx = this.ctx;
            
            this.canvas = tempCanvas;
            this.ctx = tempCtx;
            
            const stream = tempCanvas.captureStream(30);  // 안정적인 30fps로 고정
            
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
            
            // 브라우저에서 지원하는 최적 코덱 확인 및 선택
            let mimeType = '';
            let fileExtension = '';
            
            if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
                mimeType = 'video/mp4;codecs=h264';
                fileExtension = 'mp4';
                console.log('H.264 MP4 사용');
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                mimeType = 'video/webm;codecs=h264';
                fileExtension = 'webm';
                console.log('H.264 WebM 사용');
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                mimeType = 'video/webm;codecs=vp9,opus';
                fileExtension = 'webm';
                console.log('VP9 WebM 사용');
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mimeType = 'video/webm;codecs=vp8';
                fileExtension = 'webm';
                console.log('VP8 WebM 사용');
            } else {
                mimeType = 'video/webm';
                fileExtension = 'webm';
                console.log('기본 WebM 사용');
            }
            
            const recordingOptions = { 
                mimeType,
                videoBitsPerSecond: transparent ? 10000000 : 8000000  // 더 높은 비트레이트로 화질 개선
            };
            
            // 추가 품질 옵션
            if (transparent) {
                recordingOptions.bitsPerSecond = 10000000;
            }
            
            this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
            
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
                a.download = `music-visualizer-${transparent ? 'transparent-' : ''}${Date.now()}.${fileExtension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                URL.revokeObjectURL(url);
                
                this.canvas = originalCanvas;
                this.ctx = originalCtx;
                this.isRecording = false;
                
                // 다운로드 정보 표시
                const qualityInfo = `다운로드 완료 (${fileExtension.toUpperCase()}, ${transparent ? '10' : '8'}Mbps, 720p)`;
                this.updateRecordingStatus(qualityInfo);
                
                // AVI 변환 안내 (필요시)
                if (fileExtension === 'webm') {
                    console.log('더 나은 호환성을 위해 온라인 변환 도구를 사용하여 MP4나 AVI로 변환할 수 있습니다.');
                    console.log('추천 도구: https://cloudconvert.com 또는 FFmpeg');
                }
                
                setTimeout(() => this.updateRecordingStatus('준비'), 3000);
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
    
    drawBackground() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        switch(this.backgroundType) {
            case 'transparent':
                this.ctx.clearRect(0, 0, width, height);
                break;
            case 'black':
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                this.ctx.fillRect(0, 0, width, height);
                break;
            case 'white':
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                this.ctx.fillRect(0, 0, width, height);
                break;
            case 'green':
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
                this.ctx.fillRect(0, 0, width, height);
                break;
            case 'custom':
                const rgb = this.hexToRgb(this.customBackgroundColor);
                this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
                this.ctx.fillRect(0, 0, width, height);
                break;
            default:
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                this.ctx.fillRect(0, 0, width, height);
        }
    }
    
    drawFireworks() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        
        for (let i = 0; i < this.bufferLength; i += 8) {
            const intensity = (this.dataArray[i] / 255) * this.sensitivity;
            if (intensity < 0.3) continue;
            
            const colorIndex = Math.floor(intensity * (colors.length - 1));
            const color = this.hexToRgb(colors[colorIndex]);
            
            // 폭죽 폭발 효과
            const explosionX = (Math.random() - 0.5) * width * 0.8;
            const explosionY = (Math.random() - 0.5) * height * 0.8;
            
            const particles = Math.floor(intensity * 20) + 10;
            
            for (let p = 0; p < particles; p++) {
                const angle = (Math.PI * 2 * p) / particles;
                const radius = intensity * 100 * (0.5 + Math.random() * 0.5);
                
                const x = explosionX + Math.cos(angle) * radius;
                const y = explosionY + Math.sin(angle) * radius;
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, intensity * 3 + 1, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 꼬리 효과
                const tailLength = intensity * 30;
                this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.4})`;
                this.ctx.lineWidth = intensity * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(explosionX, explosionY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    drawAurora2() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        this.ctx.save();
        
        // 오로라 파도 효과
        for (let layer = 0; layer < 5; layer++) {
            const layerOffset = layer * 50;
            const amplitude = 150 - layer * 20;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, height / 2 + layerOffset);
            
            for (let x = 0; x < width; x += 10) {
                const dataIndex = Math.floor((x / width) * this.bufferLength);
                const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                const waveY = height / 2 + layerOffset + 
                    Math.sin(x * 0.02 + Date.now() * 0.003) * amplitude * intensity +
                    Math.sin(x * 0.005 + Date.now() * 0.001) * amplitude * 0.3;
                
                this.ctx.lineTo(x, waveY);
            }
            
            this.ctx.lineTo(width, height);
            this.ctx.lineTo(0, height);
            this.ctx.closePath();
            
            const colorIndex = layer % colors.length;
            const color = this.hexToRgb(colors[colorIndex]);
            const gradient = this.ctx.createLinearGradient(0, height / 2, 0, height);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawAtom() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        
        // 원자핵
        const coreIntensity = (this.dataArray[0] / 255) * this.sensitivity;
        const coreColor = this.hexToRgb(colors[0]);
        this.ctx.fillStyle = `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${coreIntensity * 0.8 + 0.2})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coreIntensity * 30 + 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 전자 궤도
        const orbits = 6;
        for (let orbit = 0; orbit < orbits; orbit++) {
            const orbitRadius = 80 + orbit * 60;
            const orbitSpeed = 0.01 + orbit * 0.005;
            
            // 궤도 경로
            this.ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 전자들
            const electrons = 2 + orbit;
            for (let e = 0; e < electrons; e++) {
                const dataIndex = Math.floor((orbit * electrons + e) % this.bufferLength);
                const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                const angle = (Date.now() * orbitSpeed) + (e * Math.PI * 2) / electrons;
                const x = Math.cos(angle) * orbitRadius;
                const y = Math.sin(angle) * orbitRadius * 0.3; // 타원형 궤도
                
                const colorIndex = (orbit + e) % colors.length;
                const color = this.hexToRgb(colors[colorIndex]);
                
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8 + 0.2})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, intensity * 8 + 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 전자 궤적
                if (intensity > 0.5) {
                    this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.3})`;
                    this.ctx.lineWidth = intensity * 2;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, orbitRadius, angle - 0.5, angle);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawFlock() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        if (!this.flockParticles) {
            this.flockParticles = [];
            for (let i = 0; i < 80; i++) {
                this.flockParticles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 4 + 2,
                    colorIndex: Math.floor(Math.random() * colors.length)
                });
            }
        }
        
        // 무리 행동 업데이트
        this.flockParticles.forEach((particle, i) => {
            const dataIndex = i % this.bufferLength;
            const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
            
            // 이웃 찾기
            let avgX = 0, avgY = 0, avgVx = 0, avgVy = 0;
            let neighbors = 0;
            let separateX = 0, separateY = 0;
            
            this.flockParticles.forEach((other, j) => {
                if (i === j) return;
                
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    avgX += other.x;
                    avgY += other.y;
                    avgVx += other.vx;
                    avgVy += other.vy;
                    neighbors++;
                    
                    if (distance < 30) {
                        separateX -= dx / distance;
                        separateY -= dy / distance;
                    }
                }
            });
            
            if (neighbors > 0) {
                avgX /= neighbors;
                avgY /= neighbors;
                avgVx /= neighbors;
                avgVy /= neighbors;
                
                // 무리 중심으로 이동
                particle.vx += (avgX - particle.x) * 0.0005;
                particle.vy += (avgY - particle.y) * 0.0005;
                
                // 속도 정렬
                particle.vx += (avgVx - particle.vx) * 0.02;
                particle.vy += (avgVy - particle.vy) * 0.02;
                
                // 분리
                particle.vx += separateX * 0.05;
                particle.vy += separateY * 0.05;
            }
            
            // 음악에 반응
            particle.vx += (Math.random() - 0.5) * intensity * 0.5;
            particle.vy += (Math.random() - 0.5) * intensity * 0.5;
            
            // 속도 제한
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const maxSpeed = 3 + intensity * 2;
            if (speed > maxSpeed) {
                particle.vx = (particle.vx / speed) * maxSpeed;
                particle.vy = (particle.vy / speed) * maxSpeed;
            }
            
            // 위치 업데이트
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 경계 처리
            if (particle.x < 0) { particle.x = width; particle.vx *= -0.5; }
            if (particle.x > width) { particle.x = 0; particle.vx *= -0.5; }
            if (particle.y < 0) { particle.y = height; particle.vy *= -0.5; }
            if (particle.y > height) { particle.y = 0; particle.vy *= -0.5; }
            
            // 그리기
            const color = this.hexToRgb(colors[particle.colorIndex]);
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.6 + 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 방향 표시
            const angle = Math.atan2(particle.vy, particle.vx);
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(
                particle.x + Math.cos(angle) * (particle.size + 10),
                particle.y + Math.sin(angle) * (particle.size + 10)
            );
            this.ctx.stroke();
        });
    }
    
    drawTesla() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        
        // 테슬라 코일 효과
        const coils = 4;
        for (let coil = 0; coil < coils; coil++) {
            const coilAngle = (coil * Math.PI * 2) / coils;
            const coilX = Math.cos(coilAngle) * 200;
            const coilY = Math.sin(coilAngle) * 200;
            
            // 코일 베이스
            const baseIntensity = (this.dataArray[coil * 32] / 255) * this.sensitivity;
            const baseColor = this.hexToRgb(colors[coil % colors.length]);
            
            this.ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.6)`;
            this.ctx.beginPath();
            this.ctx.arc(coilX, coilY, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 전기 방전 효과
            if (baseIntensity > 0.4) {
                const bolts = Math.floor(baseIntensity * 8) + 3;
                
                for (let bolt = 0; bolt < bolts; bolt++) {
                    const targetAngle = Math.random() * Math.PI * 2;
                    const distance = baseIntensity * 300 + 50;
                    
                    this.ctx.strokeStyle = `rgba(${baseColor.r + 100}, ${baseColor.g + 100}, ${baseColor.b + 100}, ${baseIntensity})`;
                    this.ctx.lineWidth = Math.random() * 3 + 1;
                    this.ctx.beginPath();
                    
                    let currentX = coilX;
                    let currentY = coilY;
                    
                    // 지그재그 번개 효과
                    const segments = 10;
                    for (let seg = 0; seg < segments; seg++) {
                        const progress = seg / segments;
                        const targetX = coilX + Math.cos(targetAngle) * distance * progress;
                        const targetY = coilY + Math.sin(targetAngle) * distance * progress;
                        
                        // 랜덤한 지그재그
                        const zigX = targetX + (Math.random() - 0.5) * 40;
                        const zigY = targetY + (Math.random() - 0.5) * 40;
                        
                        this.ctx.lineTo(zigX, zigY);
                        currentX = zigX;
                        currentY = zigY;
                    }
                    
                    this.ctx.stroke();
                    
                    // 방전 끝점 효과
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${baseIntensity * 0.8})`;
                    this.ctx.beginPath();
                    this.ctx.arc(currentX, currentY, baseIntensity * 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // 코일 간 방전
                for (let otherCoil = coil + 1; otherCoil < coils; otherCoil++) {
                    const otherAngle = (otherCoil * Math.PI * 2) / coils;
                    const otherX = Math.cos(otherAngle) * 200;
                    const otherY = Math.sin(otherAngle) * 200;
                    
                    const otherIntensity = (this.dataArray[otherCoil * 32] / 255) * this.sensitivity;
                    
                    if (baseIntensity > 0.6 && otherIntensity > 0.6 && Math.random() < 0.3) {
                        this.ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${(baseIntensity + otherIntensity) * 0.4})`;
                        this.ctx.lineWidth = (baseIntensity + otherIntensity) * 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(coilX, coilY);
                        
                        // 곡선 방전
                        const midX = (coilX + otherX) / 2 + (Math.random() - 0.5) * 100;
                        const midY = (coilY + otherY) / 2 + (Math.random() - 0.5) * 100;
                        
                        this.ctx.quadraticCurveTo(midX, midY, otherX, otherY);
                        this.ctx.stroke();
                    }
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawHexagon() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.colorThemes[this.colorTheme] || this.colorThemes.neon;
        
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        
        // 육각형 패턴
        const hexSize = 40;
        const rows = Math.ceil(height / (hexSize * 1.5)) + 2;
        const cols = Math.ceil(width / (hexSize * 1.8)) + 2;
        
        for (let row = -rows/2; row < rows/2; row++) {
            for (let col = -cols/2; col < cols/2; col++) {
                const x = col * hexSize * 1.8 + (row % 2) * hexSize * 0.9;
                const y = row * hexSize * 1.5;
                
                const distance = Math.sqrt(x * x + y * y);
                const dataIndex = Math.floor((distance / 300) * this.bufferLength) % this.bufferLength;
                const intensity = (this.dataArray[dataIndex] / 255) * this.sensitivity;
                
                if (intensity < 0.2) continue;
                
                const colorIndex = Math.floor((distance + Date.now() * 0.001) * 0.01) % colors.length;
                const color = this.hexToRgb(colors[colorIndex]);
                
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(Date.now() * 0.001 + distance * 0.01);
                
                // 육각형 그리기
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const hexX = Math.cos(angle) * hexSize * intensity;
                    const hexY = Math.sin(angle) * hexSize * intensity;
                    
                    if (i === 0) this.ctx.moveTo(hexX, hexY);
                    else this.ctx.lineTo(hexX, hexY);
                }
                this.ctx.closePath();
                
                // 채우기
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.3})`;
                this.ctx.fill();
                
                // 경계선
                this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`;
                this.ctx.lineWidth = intensity * 2;
                this.ctx.stroke();
                
                // 중심점
                if (intensity > 0.7) {
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, intensity * 8, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            }
        }
        
        this.ctx.restore();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MusicVisualizer();
});