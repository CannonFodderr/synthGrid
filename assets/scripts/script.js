(()=> {
    let loader = document.getElementById('loader')
    let interval = setInterval(function() {
        if(document.readyState === 'complete') {
            clearInterval(interval);
            loader.style.display = "none";
        }    
    }, 100);
    if('serviceWorker' in navigator){
        window.addEventListener('load', ()=>{
            navigator.serviceWorker.register('../../sw.js').then((registration)=>{
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, (err)=>{
                console.log('Service Worker registration failed', err);
            });
        });

    }
    let canvas = document.querySelector('canvas');
    let c = canvas.getContext('2d');

    // Particles Variables
    let maxParticles = canvas.width / 10;
    let particlesArr = [];
    let cursorParticles = [];
    
    // Hud
    let displayText = "";
    let tutorialArr = [
        "Hello !",
        'Synth with Cats in Space',
        'Under Construction',
        'Please note:',
        'Most desktop features are not supported in Mobile yet',
        'Press "A-K" or Touch to play',
        'Change sounds with 1 - 4 (Not Numeric)',
        "Mouse position will alter the note length",
        "Press M for Mute",
        "Press [ ] to change octaves",
        "Transpose: - +",
        'Press "SPACE" for Sustain',
        "Set Volume with Mouse Wheel"
    ]
    let timerInterval;
    let displayTimer = 3;
    let isMuted = false;
    let touchOn = false;
    // grid Variables
    let gridArr;
    let gridBlockWidth = canvas.width / 11;
    let maxGridRows = 8;
    let gridBlockHeight = innerHeight / maxGridRows;
    let maxGridBlocks = maxGridRows * 11;
    // Global Synth Variables
    let audioCTX;
    let scriptNode;
    // Setup output limiter
    let limiter;
    // Audio to buffer
    let globalGainNode;
    let gainRestore;
    let gainAdjustment;
    // Setup Audio Engine
    setupAudioEngine = () => {
        audioCTX = new (window.AudioContext || window.webkitAudioContext)();
    // Check if audioContext is suspended
        audioCTX.suspend();
        webAudioUnlock = (context) => {
            return new Promise((resolve, reject)=>{
                if(audioCTX.state === 'suspended' && 'ontouchstart' in window || 'onkeydown' in window){
                    let unlock = () => {
                        context.resume().then(()=>{
                            document.body.removeEventListener('touchstart', unlock);
                            document.body.removeEventListener('touchend', unlock);
                            resolve(true);
                        }, (reason)=> {
                            reject(reason);
                        });
                    };
                    document.body.addEventListener('touchstart', unlock, false);
                    document.body.addEventListener('touchend', unlock, false);
                    document.body.addEventListener('keydown', unlock, false);
                    document.body.addEventListener('keyup', unlock, false);
                    
                } else {
                    resolve(false);
                }
            });
        }
        webAudioUnlock(audioCTX);
        scriptNode = audioCTX.createScriptProcessor(4096, 1, 1);
        // Setup output limiter
        limiter = audioCTX.createDynamicsCompressor();
        limiter.threshold = -3;
        limiter.reduction = 60;
        // Audio to buffer
        scriptNode.onaudioprocess = (event) => {
            let inputBuffer = event.inputBuffer;
            let outputBuffer = event.outputBuffer;
            for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                var inputData = inputBuffer.getChannelData(channel);
                var outputData = outputBuffer.getChannelData(channel);
            
                // Loop through the 4096 samples
                for (var sample = 0; sample < inputBuffer.length; sample++) {
                // make output equal to the same as the input
                outputData[sample] = inputData[sample];
                // add noise to each output sample
                //   outputData[sample] += ((Math.random() * 2) - 1) * 0.2;         
                }

            }
        }
        // Setup global gain
        globalGainNode = audioCTX.createGain();
        globalGainNode.gain.value = 0.4;
        gainRestore = 0.3;
        gainAdjustment = 0.01;
        // Synth Connectors
        globalGainNode.connect(limiter);
        // quadFilter.connect(limiter);
        limiter.connect(scriptNode);
        scriptNode.connect(audioCTX.destination);
    }
    
    // Global Notes Variables
    let noteON = false;
    let rootNote = 16.35; 
    let notesTable = [];
    let playedNotes = [];
    let unreleasedKeys = [];
    let isSustain = false;
    let touchNote;
    let currentNote;
    let transpose = 0;
    // let transposeArr = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B", "C"];
    let octave = 0;
    let semiTones = 36;
    let selectedWaveform = "sine";
    let adsr = {
        attackTime: 0.02,
        decayTime: 0.01,
        sustainTime: 0,
        releaseTime: 1
    };
    // Mouse Controller
    let mouse = {};
    setNoteEnvelopes = (event) => {
        // Don't change ADSR if touch is on
        if(!touchOn){
            if(event.clientY <= 1 || adsr.releaseTime <= 0.1){
                adsr.releaseTime = 0.1;
            }
            if(event.clientY >= window.innerHeight - 10 || adsr.releaseTime >= 6){
                adsr.releaseTime = 6;
            }
            if(event.clientX <= 1 || adsr.attackTime <= 0.1){
                adsr.releaseTime = 0.1;
            }
            if(event.clientY >= window.innerWidth - 10 || adsr.attackTime >= 0.1){
                adsr.releaseTime = 6;
            }
            adsr.releaseTime = 0 + event.clientY /canvas.height;
            adsr.attackTime = 0 + event.clientX / (canvas.width * 2);
        }
        
    }
    window.addEventListener('mousemove', (e)=>{
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        setNoteEnvelopes(e);
        
    });
    window.addEventListener('beforeunload', ()=>{
        audioCTX.suspend();
        audioCTX.close();
    });
    window.addEventListener('unload', (e)=>{
        audioCTX.suspend();
        audioCTX.close();
    })
    window.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
    })
    muteSound = () => {
        if(isMuted == false){
            gainRestore = globalGainNode.gain.value;
            globalGainNode.gain.exponentialRampToValueAtTime(0.000001, audioCTX.currentTime + 0.01);
            setDisplayText("globalGain", "OFF");
            isMuted = true;
        } else {
            globalGainNode.gain.exponentialRampToValueAtTime(gainRestore , audioCTX.currentTime + 0.01);
            setDisplayText("globalGain", "ON");
            isMuted = false;
        }
    }
    // HUD Display
    resetDisplayTimer = () => {
        displayTimer = 3;
    }
    runDisplayTimer = () => {
        if(displayTimer > 0){
            return displayTimer--
        }
        if(displayTimer <= 0){
            clearInterval(timerInterval);
            displayText = "";
        }
    }
    setDisplayText = (command, text) => {
        clearInterval(timerInterval);
        resetDisplayTimer();
        if(command == "globalGain"){
            displayText = `Volume: ${text}`;
        }
        if(command == "waveform"){
            displayText = `Waveform: ${text}`;
        }
        if(command == "transpose"){
            displayText = `Transpose: ${text}`;
        }
        if(command == "octave"){
            displayText = `Octave: ${text}`;
        }
        if(command == "tutorial"){
            displayText = `${text}`;
        }
        timerInterval = setInterval(runDisplayTimer, 500);
    }
    
    window.addEventListener('mousewheel', (e)=>{
        isMuted = false;
        if(e.wheelDeltaY < 0 && globalGainNode.gain.value - gainAdjustment > 0){
            globalGainNode.gain.exponentialRampToValueAtTime(globalGainNode.gain.value - gainAdjustment, audioCTX.currentTime + 0.01);
        }
        if(e.wheelDeltaY < 0 && globalGainNode.gain.value - gainAdjustment < 0){
            globalGainNode.gain.exponentialRampToValueAtTime(0.00001, audioCTX.currentTime + 0.01);
        }
        if(e.wheelDeltaY > 0 && globalGainNode.gain.value <= 1){
            globalGainNode.gain.exponentialRampToValueAtTime(globalGainNode.gain.value + gainAdjustment, audioCTX.currentTime + 0.01);
        }
        setDisplayText("globalGain", Math.floor(globalGainNode.gain.value * 100))
        resetDisplayTimer();
    // Keyboard listeners
    })
    window.addEventListener('keydown', (e)=>{
        e.preventDefault();
        if(unreleasedKeys.indexOf(e.code) == -1){
            unreleasedKeys.push(e.code);
            switch(e.code){
                case "Digit1": selectedWaveform = "sine";
                setDisplayText("waveform", "Sine");
                break;
                case "Digit2": selectedWaveform = "square";
                setDisplayText("waveform", "Square");
                break;
                case "Digit3": selectedWaveform = "sawtooth";
                setDisplayText("waveform", "Sawtooth");
                break;
                case "Digit4": selectedWaveform = "triangle";
                setDisplayText("waveform", "Triangle");
                break;
                case "KeyM": muteSound()
                break;
                case "KeyA": currentNote = notesTable[12 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyD": currentNote = notesTable[8 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyE": currentNote = notesTable[9 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyF": currentNote = notesTable[7 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyG": currentNote = notesTable[5 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyH": currentNote = notesTable[3 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyJ": currentNote = notesTable[1 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyK": currentNote = notesTable[0 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyS": currentNote = notesTable[10 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyT": currentNote = notesTable[6 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyU": currentNote = notesTable[2 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyW": currentNote = notesTable[11 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "KeyY": currentNote = notesTable[4 + semiTones];
                noteON = true;
                createNote(currentNote);
                break;
                case "BracketRight": setScale(e);
                break;
                case "BracketLeft": setScale(e);
                break;
                case "Equal": setScale(e);
                break;
                case "Minus": setScale(e);
                break;
                case "Space": isSustain = true;
                break;
            }
        };
    });
    window.addEventListener('keypress', (e)=>{
        noteON = true;
    });
    window.addEventListener('keyup', (e)=>{
        let index = unreleasedKeys.indexOf(e.code);
        unreleasedKeys.splice(index, 1);      
        if(e.code == "Space"){
            isSustain = false;
        }
        noteON = false;
    });
    window.addEventListener('touchstart', (e)=>{
        mouse.x = e.changedTouches[0].clientX;
        mouse.y = e.changedTouches[0].clientY;
        touchOn = true;
        noteON = true;
    });
    window.addEventListener('touchmove', (e)=>{
        mouse.x = e.changedTouches[0].clientX;
        mouse.y = e.changedTouches[0].clientY;
        touchOn = true;
        noteON = false;
        
    });
    window.addEventListener('touchend', (e)=>{
        noteON = false;
        touchOn = false;
        currentNote = "";
    });
    window.addEventListener('mouseover', (e)=>{
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    })
    window.addEventListener('mouseup', (e)=>{
        e.preventDefault();
        noteON = false;
        touchOn = false;
        currentNote = "";
    })
    
    // Transpose and Octaves
    setScale = (e) => {
        if(octave >= -2 && e.code == "BracketRight"){
            semiTones = semiTones - 12;
            octave--;
            setDisplayText("octave", -octave);
        }
        if(octave <= 2 && e.code == "BracketLeft"){
            semiTones = semiTones + 12;
            octave++;
            setDisplayText("octave", -octave);
        }
        if(transpose >= -11 && e.code == "Equal"){
            semiTones--;
            transpose--;
            setDisplayText("transpose", -transpose);
        }
        if(transpose <= 11 && e.code == "Minus"){
            semiTones++;
            transpose++;
            setDisplayText("transpose", -transpose);
        }  
    }
    window.addEventListener('resize', ()=>{
        audioCTX.close();
        init();
    })
    // Synth
    createNote = (freq) => {
        function Note () {
            this.osc = audioCTX.createOscillator();
            this.keyCode;
            this.osc.type = selectedWaveform;
            this.gainNode = audioCTX.createGain();
            this.noteOn = false;
            this.isSustained = false;
            this.sustain = 0.1
            this.freq = freq;
            this.play = () => {
                this.osc.frequency.value = this.freq;
                this.osc.connect(this.gainNode);
                this.gainNode.connect(globalGainNode);
                this.gainNode.gain = 0.01;
                this.osc.start(0);
                if(isSustain == true){
                    this.isSustain = true
                    this.sustain = 5;
                }
                this.gainNode.gain.setValueAtTime(0.001, audioCTX.currentTime)
                // Attack
                this.gainNode.gain.exponentialRampToValueAtTime(0.9 * globalGainNode.gain.value, audioCTX.currentTime + adsr.attackTime);
                // Decay
                this.gainNode.gain.exponentialRampToValueAtTime(0.8 * globalGainNode.gain.value, audioCTX.currentTime + adsr.attackTime + adsr.decayTime);
                // Sustain & release
                if(this.isSustained === true){
                    this.gainNode.gain.setValueAtTime(0.001 * globalGainNode.gain.value, audioCTX.currentTime + adsr.attackTime + adsr.decayTime);
                    this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCTX.currentTime + adsr.attackTime + adsr.decayTime + this.sustain + adsr.releaseTime);
                // Release
                }
                if(this.isSustained == false){
                    let now = audioCTX.currentTime + adsr.attackTime + adsr.decayTime + this.sustain + adsr.releaseTime
                    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCTX.currentTime + adsr.attackTime + adsr.decayTime + this.sustain + adsr.releaseTime);
                    setTimeout(()=>{
                        this.osc.stop(0); 
                    }, 6000);
                }
            }
            this.volumeDrop = () => {
                this.gainNode.gain.exponentialRampToValueAtTime(0.005, audioCTX.currentTime + 0.0001);
            }
            this.stop = () => {
                this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, audioCTX.currentTime); 
                this.gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCTX.currentTime + 0.03);
                this.gainNode.gain.setValueAtTime(0.0001, audioCTX.currentTime);
                setTimeout(()=>{
                    this.osc.stop(0)
                },100);
            }
    }
        let newNote =  new Note;
        if(noteON == true){
            player(newNote);
        }
        return newNote;
    }
        
    
    player = (newNote) => {
        if(newNote != undefined && newNote != playedNotes[0]){
            playedNotes.unshift(newNote);
            for(let i = 0; i < playedNotes.length; i++){
                switch(i){
                    case 0: playedNotes[0].play();
                    break;
                    case 16: playedNotes[8].stop();
                    break;
                }
            }
        }
        // Keep only 16 voices
        if(playedNotes.length > 8){
            playedNotes.pop();
        }
    }
    // Utility Functions
    randomColor = () => {
        let colors = [
            "255, 83 , 13, ",
            "232, 44, 12, ",
            "255, 0, 0, ",
            "232, 12, 122, ",
            "255, 13, 255, "
        ]
        let i = Math.floor(Math.random() * 5);
        return colors[i];
    }
    getCoords = (radius) => {
        let x = Math.random() * canvas.width - (radius * 2);
        let y = Math.random() * canvas.height + (radius * 2);
        return {
            x: x,
            y: y
        }
    }
    clearCanvas = () => {
        c.clearRect(0, 0, canvas.width, canvas.height);
    }
    generateSingleTouchNote = (note) => {
        currentNote = touchNote;
        if(note != playedNotes[1] && touchOn == true){
            createNote(currentNote);
        }
        
    }
    
    gridGenerator = (x, y, w, h, color, index) =>{
        function GridBlock () {
            this.index = index;
            this.noteOn = false;
            this.isPressed = false; 
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.opacity = 0.001;
            this.offset = 0;
            this.fillColor = "rgba(" + color + `${this.opacity}` + ")";
            this.strokeColor = "rgba(0, 0, 0, 0.2)";
            this.draw = () => {
                c.fillStyle = color;
                c.beginPath();
                c.rect(this.x, this.y, this.w, this.h);
                c.save();
                c.fillStyle = this.fillColor;
                c.fill();
                c.restore();
                c.strokeStyle = this.strokeColor;
                c.stroke();
            };
            this.update = () => {
                if(notesTable.indexOf(currentNote) == this.index){
                    this.opacity = globalGainNode.gain.value;
                    this.noteOn = true;
                }
                // check if hovered
                if(this.opacity <= globalGainNode.gain.value && mouse.x > this.x && mouse.x < this.x + this.w && mouse.y > this.y && mouse.y < this.y + this.h){
                    touchNote = notesTable[this.index];
                    if(touchOn == true){
                        generateSingleTouchNote(currentNote);
                        touchOn = false;
                    }
                    this.opacity = this.opacity + 0.05;
                    this.fillColor = "rgba(" + color + `${this.opacity}` + ")";
                }
                
                else if(this.opacity >= 0.01){
                    if(mouse.x <= this.x || mouse.x >= this.x + this.w || mouse.y <= this.y || mouse.y >= this.y + this.h){
                        this.noteOn = false;
                        this.opacity = this.opacity - 0.005;
                        this.fillColor = "rgba(" + color + `${this.opacity}` + ")";
                    }               
                }
                this.draw();
            }
        }
        return new GridBlock;
    }
    drawGrid = () => {
        for(let i = 0; i < gridArr.length; i++){
            gridArr[i].update();
        }
    }
    // Draw Elements from Array
    drawText = () => {
        let text = textGenerator(displayText);
        text.update();
    }
    drawParticles = () => {
        for(let i = 0; i < particlesArr.length; i++){
            particlesArr[i].update();
        }
    }
    drawCursor = () => {
        for(i = 0; i < cursorParticles.length; i++){
            cursorParticles[i].update();
        }
    }
    drawhud = () => {
        setTimeout(()=>{
            tutorialArr.forEach((item)=>{
                setTimeout(()=>{
                    setDisplayText("tutorial", item);
                },3000 * tutorialArr.indexOf(item));
            })
        }, 2000);
        
    }
    // Hud text generator
    textGenerator = (text) => {
        function Text () {
            this.text = text;
            this.opacity = 1;
            this.fillColor = `rgba(255, 255, 255, ${this.opacity})`;
            this.draw = () => {
                this.opacity = 1;
                this.fillColor = `rgba(255, 255, 255, ${this.opacity})`;
                c.beginPath();
                c.fillStyle = this.fillColor;
                c.textAlign = "center";
                c.font = "italic small-caps bold 30px arial";
                c.fillText(this.text, canvas.width / 2, 100, canvas.width - 10);
            }
            this.update = () => {
                this.draw();
            }
        }
        return new Text
    }
    // Cursor Stars Generator
    GenerateCursorParticles = () => {
        function CursorParticle () {
            this.i = 0;
            this.velocity = -Math.random() * 0.1;
            this.r = Math.random() * 0.8 + 1;
            this.x = mouse.x + (Math.random() - 0.5) * 100 + this.r;
            this.y = mouse.y + (Math.random() - 0.5) * 100 + this.r;
            this.color = randomColor();
            this.fillColor = "orange";
            this.draw = () => {
                c.beginPath();
                c.save()
                c.fillStyle = this.fillColor;
                c.arc(this.x, this.y, this.r, 0, this.i * 2, false);
                c.fill();
                c.restore();
            }
            this.update = () => {
                if(this.i <= -180){
                    this.i = 0;
                }
                this.i = this.i + this.velocity;
                // Particles circular movement
                this.x = mouse.x + this.r * canvas.width / 50 * Math.cos(this.i);
                this.y = mouse.y + this.r * canvas.width / 50 * Math.sin(this.i); 
                this.draw();
            }
        }
        return new CursorParticle
    }
    // Stars Particles Generator
    particlesGenerator = (x, y, r) => {
        function Particle () {
            this.x = x;
            this.y = y;
            this.dx = (Math.random() - 0.5) * 0.2;
            this.dy = (Math.random() - 0.5) * 0.2;
            this.r = r;
            this.offsetX = 0;
            this.opacity = Math.random() + 0.01;
            this.stAng = 0;
            this.endAng = Math.PI * 2;
            this.clockwise = false;
            this.fillColor = `rgba(255, 255, 255, 1)`;
            this.draw = () => {
                c.beginPath();
                c.save()
                c.fillStyle = this.fillColor;
                c.arc(this.x, this.y, this.r, this.stAng, this.endAng, this.clockwise);
                c.fill();
                c.restore();
            }
            this.update = () => {
                if(mouse.x > canvas.width / 2 && this.offsetX < 180){
                    this.x = this.x - this.dx;
                    this.offsetX++;
                }
                if(mouse.x < canvas.width / 2 && this.offsetX > -180){
                    this.x = this.x + this.dx;
                    this.offsetX--;
                }

                if(this.x + this.r > canvas.width || this.x - this.r < 0){
                    this.dx = -this.dx;
                }
                if(this.y + this.r > canvas.height || this.y - this.r < 0){
                    this.dy = -this.dy;
                }
                this.x = this.x + this.dx;
                this.y = this.y + this.dy;
                this.draw();
            }
        }
        return new Particle;
    }
    gridArrGenerator = () => {
        let gridRowNum = 0;
        let gridColNum = 0;
        for(let i = 0; i< maxGridBlocks; i++){
            if(i > 10 && i % 11 == 0){
                gridRowNum = gridRowNum + 1;
            }
            if(gridColNum > 10){
                gridColNum = 0;
            }
            let yPosition = gridRowNum * gridBlockHeight;
            let xPosition = gridColNum * gridBlockWidth;
            let color = randomColor();
            let  newGridBlock = gridGenerator(canvas.width - xPosition - gridBlockWidth, yPosition, gridBlockWidth, gridBlockHeight, color, i);
            let freq = rootNote * Math.pow(1.059463, i);
            gridArr.push(newGridBlock);
            notesTable.unshift(freq);
            gridColNum++;
        }
    };
    cursorGenerator = () => {
        for(i = 0; i < 10; i++){
            let newParticle = GenerateCursorParticles();
            cursorParticles.push(newParticle);
        }
    }
    particlesArrGenerator = () => {
        for(let i = 0; i < maxParticles; i++){
            let radius = Math.random() * 2 + 0.1;
            let coords = getCoords(radius);
            let arrItem = particlesGenerator(coords.x, coords.y, radius);
            particlesArr.push(arrItem);
        }
    }
    let nextFrame;
    animate = () => {
        clearCanvas();
        drawGrid();
        drawParticles();
        drawText();
        drawCursor();
        nextFrame = requestAnimationFrame(animate);
    }
    init = () => {
        cancelAnimationFrame(nextFrame);
        clearCanvas();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        maxGridRows = 8;
        maxGridBlocks = maxGridRows * 11;
        gridBlockWidth = canvas.width / 11;
        gridBlockHeight = canvas.height / 8;
        maxParticles = canvas.width / 10;
        cursorParticles = [];
        gridArr = [];
        particlesArr = [];
        notesTable = [];
        playedNotes = [];
        setupAudioEngine();
        gridArrGenerator();
        particlesArrGenerator()
        cursorGenerator();
        animate();    
    } 
    init();
    drawhud();
})();


