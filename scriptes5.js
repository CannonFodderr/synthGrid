'use strict';

(function () {
    var loader = document.getElementById('loader');
    var interval = setInterval(function () {
        if (document.readyState === 'complete') {
            clearInterval(interval);
            loader.style.display = "none";
        }
    }, 100);
    var canvas = document.querySelector('canvas');
    var c = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Particles Variables
    var maxParticles = canvas.width / 10;
    var particlesArr = [];
    var cursorParticles = [];

    // Hud
    var displayText = "";
    var tutorialArr = ["Hello !", 'Synth with Cats in Space', 'Under Construction', 'Please note:', 'Most desktop features are not supported in Mobile yet', 'Press "A-K" or Touch to play', 'Change sounds with 1 - 4 (Not Numeric)', "Mouse position will alter the note length", "Press M for Mute", "Press [ ] to change octaves", "Transpose: - +", 'Press "SPACE" for Sustain', "Set Volume with Mouse Wheel"];
    var timerInterval = void 0;
    var displayTimer = 3;
    var isMuted = false;
    var touchOn = false;
    // grid Variables
    var gridArr = void 0;
    var gridBlockWidth = canvas.width / 11;
    var maxGridRows = 8;
    var gridBlockHeight = innerHeight / maxGridRows;
    var maxGridBlocks = maxGridRows * 11;
    // Global Synth Variables
    var audioCTX = void 0;
    var scriptNode = void 0;
    // Setup output limiter
    var limiter = void 0;
    // Audio to buffer
    var globalGainNode = void 0;
    var gainRestore = void 0;
    var gainAdjustment = void 0;
    // Setup Audio Engine
    function setupAudioEngine() {
        audioCTX = new (window.AudioContext || window.webkitAudioContext)();
        // Check if audioContext is suspended
        audioCTX.suspend();
        function webAudioUnlock(context) {
            return new Promise(function (resolve, reject) {
                if (audioCTX.state === 'suspended' && 'ontouchstart' in window || 'onkeydown' in window) {
                    var unlock = function unlock() {
                        context.resume().then(function () {
                            document.body.removeEventListener('touchstart', unlock);
                            document.body.removeEventListener('touchend', unlock);
                            resolve(true);
                        }, function (reason) {
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
        };
        webAudioUnlock(audioCTX);
        scriptNode = audioCTX.createScriptProcessor(4096, 1, 1);
        // Setup output limiter
        limiter = audioCTX.createDynamicsCompressor();
        limiter.threshold.setValueAtTime(-3, audioCTX.currentTime);
        limiter.ratio.setValueAtTime(20, audioCTX.currentTime);
        // Audio to buffer
        scriptNode.onaudioprocess = function (event) {
            var inputBuffer = event.inputBuffer;
            var outputBuffer = event.outputBuffer;
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
        };
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
    };

    // Global Notes Variables
    var noteON = false;
    var rootNote = 16.35;
    var notesTable = [];
    var playedNotes = [];
    var unreleasedKeys = [];
    var isSustain = false;
    var touchNote = void 0;
    var currentNote = void 0;
    var transpose = 0;
    // let transposeArr = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B", "C"];
    var octave = 0;
    var semiTones = 36;
    var selectedWaveform = "sine";
    var adsr = {
        attackTime: 0.02,
        decayTime: 0.01,
        sustainTime: 0,
        releaseTime: 1
    };
    // Mouse Controller
    var mouse = {};
    function setNoteEnvelopes(event) {
        // Don't change ADSR if touch is on
        if (!touchOn) {
            if (event.clientY <= 1 || adsr.releaseTime <= 0.1) {
                adsr.releaseTime = 0.1;
            }
            if (event.clientY >= window.innerHeight - 10 || adsr.releaseTime >= 6) {
                adsr.releaseTime = 6;
            }
            if (event.clientX <= 1 || adsr.attackTime <= 0.1) {
                adsr.releaseTime = 0.1;
            }
            if (event.clientY >= window.innerWidth - 10 || adsr.attackTime >= 0.1) {
                adsr.releaseTime = 6;
            }
            adsr.releaseTime = 0 + event.clientY / canvas.height;
            adsr.attackTime = 0 + event.clientX / (canvas.width * 2);
        }
    };
    window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        setNoteEnvelopes(e);
    });
    window.addEventListener('beforeunload', function () {
        audioCTX.suspend();
        audioCTX.close();
    });
    window.addEventListener('unload', function (e) {
        audioCTX.suspend();
        audioCTX.close();
    });
    window.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });
    function muteSound() {
        if (isMuted == false) {
            gainRestore = globalGainNode.gain.value;
            globalGainNode.gain.exponentialRampToValueAtTime(0.000001, audioCTX.currentTime + 0.01);
            setDisplayText("globalGain", "OFF");
            isMuted = true;
        } else {
            globalGainNode.gain.exponentialRampToValueAtTime(gainRestore, audioCTX.currentTime + 0.01);
            setDisplayText("globalGain", "ON");
            isMuted = false;
        }
    };
    // HUD Display
    function resetDisplayTimer() {
        displayTimer = 3;
    };
    function runDisplayTimer() {
        if (displayTimer > 0) {
            return displayTimer--;
        }
        if (displayTimer <= 0) {
            clearInterval(timerInterval);
            displayText = "";
        }
    };
    function setDisplayText(command, text) {
        clearInterval(timerInterval);
        resetDisplayTimer();
        if (command == "globalGain") {
            displayText = 'Volume: ' + text;
        }
        if (command == "waveform") {
            displayText = 'Waveform: ' + text;
        }
        if (command == "transpose") {
            displayText = 'Transpose: ' + text;
        }
        if (command == "octave") {
            displayText = 'Octave: ' + text;
        }
        if (command == "tutorial") {
            displayText = '' + text;
        }
        timerInterval = setInterval(runDisplayTimer, 500);
    };

    window.addEventListener('mousewheel', function (e) {
        isMuted = false;
        if (e.wheelDeltaY < 0 && globalGainNode.gain.value - gainAdjustment > 0) {
            globalGainNode.gain.exponentialRampToValueAtTime(globalGainNode.gain.value - gainAdjustment, audioCTX.currentTime + 0.01);
        }
        if (e.wheelDeltaY < 0 && globalGainNode.gain.value - gainAdjustment < 0) {
            globalGainNode.gain.exponentialRampToValueAtTime(0.00001, audioCTX.currentTime + 0.01);
        }
        if (e.wheelDeltaY > 0 && globalGainNode.gain.value <= 1) {
            globalGainNode.gain.exponentialRampToValueAtTime(globalGainNode.gain.value + gainAdjustment, audioCTX.currentTime + 0.01);
        }
        setDisplayText("globalGain", Math.floor(globalGainNode.gain.value * 100));
        resetDisplayTimer();
        // Keyboard listeners
    });
    window.addEventListener('keydown', function (e) {
        e.preventDefault();
        if (unreleasedKeys.indexOf(e.code) == -1) {
            unreleasedKeys.push(e.code);
            switch (e.code) {
                case "Digit1":
                    selectedWaveform = "sine";
                    setDisplayText("waveform", "Sine");
                    break;
                case "Digit2":
                    selectedWaveform = "square";
                    setDisplayText("waveform", "Square");
                    break;
                case "Digit3":
                    selectedWaveform = "sawtooth";
                    setDisplayText("waveform", "Sawtooth");
                    break;
                case "Digit4":
                    selectedWaveform = "triangle";
                    setDisplayText("waveform", "Triangle");
                    break;
                case "KeyM":
                    muteSound();
                    break;
                case "KeyA":
                    currentNote = notesTable[12 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyD":
                    currentNote = notesTable[8 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyE":
                    currentNote = notesTable[9 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyF":
                    currentNote = notesTable[7 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyG":
                    currentNote = notesTable[5 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyH":
                    currentNote = notesTable[3 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyJ":
                    currentNote = notesTable[1 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyK":
                    currentNote = notesTable[0 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyS":
                    currentNote = notesTable[10 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyT":
                    currentNote = notesTable[6 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyU":
                    currentNote = notesTable[2 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyW":
                    currentNote = notesTable[11 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "KeyY":
                    currentNote = notesTable[4 + semiTones];
                    noteON = true;
                    createNote(currentNote);
                    break;
                case "BracketRight":
                    setScale(e);
                    break;
                case "BracketLeft":
                    setScale(e);
                    break;
                case "Equal":
                    setScale(e);
                    break;
                case "Minus":
                    setScale(e);
                    break;
                case "Space":
                    isSustain = true;
                    break;
            }
        };
    });
    window.addEventListener('keypress', function (e) {
        noteON = true;
    });
    window.addEventListener('keyup', function (e) {
        var index = unreleasedKeys.indexOf(e.code);
        unreleasedKeys.splice(index, 1);
        if (e.code == "Space") {
            isSustain = false;
        }
        noteON = false;
    });
    window.addEventListener('touchstart', function (e) {
        mouse.x = e.changedTouches[0].clientX;
        mouse.y = e.changedTouches[0].clientY;
        touchOn = true;
        noteON = true;
    });
    window.addEventListener('touchmove', function (e) {
        mouse.x = e.changedTouches[0].clientX;
        mouse.y = e.changedTouches[0].clientY;
        touchOn = true;
        noteON = false;
    });
    window.addEventListener('touchend', function (e) {
        noteON = false;
        touchOn = false;
        currentNote = "";
    });
    window.addEventListener('mouseover', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseup', function (e) {
        e.preventDefault();
        noteON = false;
        touchOn = false;
        currentNote = "";
    });

    // Transpose and Octaves
    function setScale(e) {
        if (octave >= -2 && e.code == "BracketRight") {
            semiTones = semiTones - 12;
            octave--;
            setDisplayText("octave", -octave);
        }
        if (octave <= 2 && e.code == "BracketLeft") {
            semiTones = semiTones + 12;
            octave++;
            setDisplayText("octave", -octave);
        }
        if (transpose >= -11 && e.code == "Equal") {
            semiTones--;
            transpose--;
            setDisplayText("transpose", -transpose);
        }
        if (transpose <= 11 && e.code == "Minus") {
            semiTones++;
            transpose++;
            setDisplayText("transpose", -transpose);
        }
    };
    window.addEventListener('resize', function () {
        init();
    });
    // Synth
    function createNote(freq) {
        function Note() {
            var _this = this;

            this.osc = audioCTX.createOscillator();
            this.keyCode;
            this.osc.type = selectedWaveform;
            this.gainNode = audioCTX.createGain();
            this.noteOn = false;
            this.isSustained = false;
            this.sustain = 0.1;
            this.freq = freq;
            this.play = function () {
                _this.osc.frequency.value = _this.freq;
                _this.osc.connect(_this.gainNode);
                _this.gainNode.connect(globalGainNode);
                _this.gainNode.gain.value = 0.01;
                _this.osc.start(0);
                if (isSustain == true) {
                    _this.isSustain = true;
                    _this.sustain = 5;
                }
                _this.gainNode.gain.setValueAtTime(0.001, audioCTX.currentTime);
                // Attack
                _this.gainNode.gain.exponentialRampToValueAtTime(0.9 * globalGainNode.gain.value, audioCTX.currentTime + adsr.attackTime);
                // Decay
                _this.gainNode.gain.exponentialRampToValueAtTime(0.8 * globalGainNode.gain.value, audioCTX.currentTime + adsr.attackTime + adsr.decayTime);
                // Sustain & release
                if (_this.isSustained === true) {
                    _this.gainNode.gain.setValueAtTime(0.001 * globalGainNode.gain.value, audioCTX.currentTime + adsr.attackTime + adsr.decayTime);
                    _this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCTX.currentTime + adsr.attackTime + adsr.decayTime + _this.sustain + adsr.releaseTime);
                    // Release
                }
                if (_this.isSustained == false) {
                    var now = audioCTX.currentTime + adsr.attackTime + adsr.decayTime + _this.sustain + adsr.releaseTime;
                    _this.gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCTX.currentTime + adsr.attackTime + adsr.decayTime + _this.sustain + adsr.releaseTime);
                    setTimeout(function () {
                        _this.osc.stop(0);
                    }, 6000);
                }
            };
            this.volumeDrop = function () {
                _this.gainNode.gain.exponentialRampToValueAtTime(0.005, audioCTX.currentTime + 0.0001);
            };
            this.stop = function () {
                _this.gainNode.gain.setValueAtTime(_this.gainNode.gain.value, audioCTX.currentTime);
                _this.gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCTX.currentTime + 0.03);
                _this.gainNode.gain.setValueAtTime(0.0001, audioCTX.currentTime);
                setTimeout(function () {
                    _this.osc.stop(0);
                }, 100);
            };
        }
        var newNote = new Note();
        if (noteON == true) {
            player(newNote);
        }
        return newNote;
    };

    function player(newNote) {
        if (newNote != undefined && newNote != playedNotes[0]) {
            playedNotes.unshift(newNote);
            for (var _i = 0; _i < playedNotes.length; _i++) {
                switch (_i) {
                    case 0:
                        playedNotes[0].play();
                        break;
                    case 16:
                        playedNotes[8].stop();
                        break;
                }
            }
        }
        // Keep only 16 voices
        if (playedNotes.length > 8) {
            playedNotes.pop();
        }
    };
    // Utility Functions
    function randomColor() {
        var colors = ["255, 83 , 13, ", "232, 44, 12, ", "255, 0, 0, ", "232, 12, 122, ", "255, 13, 255, "];
        var i = Math.floor(Math.random() * 5);
        return colors[i];
    };
    function getCoords(radius) {
        var x = Math.random() * canvas.width - radius * 2;
        var y = Math.random() * canvas.height + radius * 2;
        return {
            x: x,
            y: y
        };
    };
    function clearCanvas() {
        c.clearRect(0, 0, canvas.width, canvas.height);
    };
    function generateSingleTouchNote(note) {
        currentNote = touchNote;
        if (note != playedNotes[1] && touchOn == true) {
            createNote(currentNote);
        }
    };

    function gridGenerator(x, y, w, h, color, index) {
        function GridBlock() {
            var _this2 = this;

            this.index = index;
            this.noteOn = false;
            this.isPressed = false;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.opacity = 0.001;
            this.offset = 0;
            this.fillColor = "rgba(" + color + ('' + this.opacity) + ")";
            this.strokeColor = "rgba(0, 0, 0, 0.2)";
            this.draw = function () {
                c.fillStyle = color;
                c.beginPath();
                c.rect(_this2.x, _this2.y, _this2.w, _this2.h);
                c.save();
                c.fillStyle = _this2.fillColor;
                c.fill();
                c.restore();
                c.strokeStyle = _this2.strokeColor;
                c.stroke();
            };
            this.update = function () {
                if (notesTable.indexOf(currentNote) == _this2.index) {
                    _this2.opacity = globalGainNode.gain.value;
                    _this2.noteOn = true;
                }
                // check if hovered
                if (_this2.opacity <= globalGainNode.gain.value && mouse.x > _this2.x && mouse.x < _this2.x + _this2.w && mouse.y > _this2.y && mouse.y < _this2.y + _this2.h) {
                    touchNote = notesTable[_this2.index];
                    if (touchOn == true) {
                        generateSingleTouchNote(currentNote);
                        touchOn = false;
                    }
                    _this2.opacity = _this2.opacity + 0.05;
                    _this2.fillColor = "rgba(" + color + ('' + _this2.opacity) + ")";
                } else if (_this2.opacity >= 0.01) {
                    if (mouse.x <= _this2.x || mouse.x >= _this2.x + _this2.w || mouse.y <= _this2.y || mouse.y >= _this2.y + _this2.h) {
                        _this2.noteOn = false;
                        _this2.opacity = _this2.opacity - 0.005;
                        _this2.fillColor = "rgba(" + color + ('' + _this2.opacity) + ")";
                    }
                }
                _this2.draw();
            };
        }
        return new GridBlock();
    };
    function drawGrid() {
        for (var _i2 = 0; _i2 < gridArr.length; _i2++) {
            gridArr[_i2].update();
        }
    };
    // Draw Elements from Array
    function drawText() {
        var text = textGenerator(displayText);
        text.update();
    };
    function drawParticles() {
        for (var _i3 = 0; _i3 < particlesArr.length; _i3++) {
            particlesArr[_i3].update();
        }
    };
    function drawCursor() {
        for (var i = 0; i < cursorParticles.length; i++) {
            cursorParticles[i].update();
        }
    };
    function drawhud() {
        setTimeout(function () {
            tutorialArr.forEach(function (item) {
                setTimeout(function () {
                    setDisplayText("tutorial", item);
                }, 3000 * tutorialArr.indexOf(item));
            });
        }, 2000);
    };
    // Hud text generator
    function textGenerator(text) {
        function Text() {
            var _this3 = this;

            this.text = text;
            this.opacity = 1;
            this.fillColor = 'rgba(255, 255, 255, ' + this.opacity + ')';
            this.draw = function () {
                _this3.opacity = 1;
                _this3.fillColor = 'rgba(255, 255, 255, ' + _this3.opacity + ')';
                c.beginPath();
                c.fillStyle = _this3.fillColor;
                c.textAlign = "center";
                c.font = "italic small-caps bold 30px arial";
                c.fillText(_this3.text, canvas.width / 2, 100, canvas.width - 10);
            };
            this.update = function () {
                _this3.draw();
            };
        }
        return new Text();
    };
    // Cursor Stars Generator
    function GenerateCursorParticles() {
        function CursorParticle() {
            var _this4 = this;

            this.i = 0;
            this.velocity = -Math.random() * 0.1;
            this.r = Math.random() * 0.8 + 1;
            this.x = mouse.x + (Math.random() - 0.5) * 100 + this.r;
            this.y = mouse.y + (Math.random() - 0.5) * 100 + this.r;
            this.color = randomColor();
            this.fillColor = "orange";
            this.draw = function () {
                c.beginPath();
                c.save();
                c.fillStyle = _this4.fillColor;
                c.arc(_this4.x, _this4.y, _this4.r, 0, _this4.i * 2, false);
                c.fill();
                c.restore();
            };
            this.update = function () {
                if (_this4.i <= -180) {
                    _this4.i = 0;
                }
                _this4.i = _this4.i + _this4.velocity;
                // Particles circular movement
                _this4.x = mouse.x + _this4.r * canvas.width / 50 * Math.cos(_this4.i);
                _this4.y = mouse.y + _this4.r * canvas.width / 50 * Math.sin(_this4.i);
                _this4.draw();
            };
        }
        return new CursorParticle();
    };
    // Stars Particles Generator
    function particlesGenerator(x, y, r) {
        function Particle() {
            var _this5 = this;

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
            this.fillColor = 'rgba(255, 255, 255. ' + this.opacity + ')';
            this.draw = function () {
                c.beginPath();
                c.save();
                c.fillStyle = _this5.fillColor;
                c.arc(_this5.x, _this5.y, _this5.r, _this5.stAng, _this5.endAng, _this5.clockwise);
                c.fill();
                c.restore();
            };
            this.update = function () {
                if (mouse.x > canvas.width / 2 && _this5.offsetX < 180) {
                    _this5.x = _this5.x - Math.floor(globalGainNode.gain.value * 4) * (_this5.dx * 2);
                    _this5.offsetX++;
                }
                if (mouse.x < canvas.width / 2 && _this5.offsetX > -180) {
                    _this5.x = _this5.x + Math.floor(globalGainNode.gain.value * 4) * (_this5.dx * 2);
                    _this5.offsetX--;
                }

                if (_this5.x + _this5.r > canvas.width || _this5.x - _this5.r < 0) {
                    _this5.dx = -_this5.dx;
                }
                if (_this5.y + _this5.r > canvas.height || _this5.y - _this5.r < 0) {
                    _this5.dy = -_this5.dy;
                }
                _this5.x = _this5.x + _this5.dx;
                _this5.y = _this5.y + _this5.dy;
                _this5.draw();
            };
        }
        return new Particle();
    };
    function gridArrGenerator() {
        var gridRowNum = 0;
        var gridColNum = 0;
        for (var _i4 = 0; _i4 < maxGridBlocks; _i4++) {
            if (_i4 > 10 && _i4 % 11 == 0) {
                gridRowNum = gridRowNum + 1;
            }
            if (gridColNum > 10) {
                gridColNum = 0;
            }
            var yPosition = gridRowNum * gridBlockHeight;
            var xPosition = gridColNum * gridBlockWidth;
            var color = randomColor();
            var newGridBlock = gridGenerator(canvas.width - xPosition - gridBlockWidth, yPosition, gridBlockWidth, gridBlockHeight, color, _i4);
            var freq = rootNote * Math.pow(1.059463, _i4);
            gridArr.push(newGridBlock);
            notesTable.unshift(freq);
            gridColNum++;
        }
    };
    function cursorGenerator() {
        for (var i = 0; i < 20; i++) {
            var newParticle = GenerateCursorParticles();
            cursorParticles.push(newParticle);
        }
    };
    function particlesArrGenerator() {
        for (var _i5 = 0; _i5 < maxParticles; _i5++) {
            var radius = Math.random() * 2 + 0.1;
            var coords = getCoords(radius);
            var arrItem = particlesGenerator(coords.x, coords.y, radius);
            particlesArr.push(arrItem);
        }
    };
    let animate = function (_animate) {
        function animate() {
            return _animate.apply(this, arguments);
        }

        animate.toString = function () {
            return _animate.toString();
        };

        return animate;
    }(function () {
        clearCanvas();
        requestAnimationFrame(animate);
        drawGrid();
        drawParticles();
        drawText();
        drawCursor();
    });
    function init() {
        clearCanvas();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        maxGridRows = 8;
        maxGridBlocks = maxGridRows * 11;
        gridBlockWidth = canvas.width / 11;
        gridBlockHeight = canvas.height / 8;
        cursorParticles = [];
        gridArr = [];
        particlesArr = [];
        notesTable = [];
        playedNotes = [];
        setupAudioEngine();
        gridArrGenerator();
        particlesArrGenerator();
        drawhud();
        cursorGenerator();
        animate();
    };
    init();
})();