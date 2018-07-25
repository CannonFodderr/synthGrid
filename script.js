const canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');
canvas.style.backgroundColor = "#000";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Particles Variables
let maxParticles = 120;
let particlesArr = [];
let cursorParticles = [];
// Hud
let displayText = "";
let tutorialArr = [
    "Hello !",
    "We are updating your computer",
    "Just Kidding :)",
    'Press "A-K" to play',
    "Press M for Mute",
    "Press [ ] to change octaves",
    "Transpose: - +",
    "Set Volume with Mouse Wheel"
]
let timerInterval;
let displayTimer = 3;
let isMuted = false;
// grid Variables
let gridArr;
let gridBlockWidth = canvas.width / 12;
let maxGridRows = Math.floor(canvas.height / gridBlockWidth);
let gridBlockHeight = innerHeight / maxGridRows;
let maxGridBlocks = maxGridRows * 12;
// Global Synth Variables
const audioCTX = new AudioContext;
// audioCTX.createBuffer(2, 44100, 44100);
let globalGainNode = audioCTX.createGain();
globalGainNode.gain.value = 0.5;
let gainRestore = 0.3;
let gainAdjustment = 0.01;
let gainNode = audioCTX.createGain();
globalGainNode.connect(audioCTX.destination);
// Global Notes Variables
let noteON = false;
let rootNote = 16.35; 
let notesTable = [];
let playedNotes = [];
let currentNote;
let transpose = 0;
let transposeArr = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B", "C"];
let octave = 0;
let semiTones = 36;
let selectedWaveform = "sine";
// Mouse Controller
let mouse = {};
window.addEventListener('mousemove', (e)=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('beforeunload', ()=>{
    audioCTX.close();
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
})
window.addEventListener('keydown', (e)=>{
    console.log(noteON);
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
        break;
        case "KeyD": currentNote = notesTable[8 + semiTones];
        noteON = true;
        break;
        case "KeyE": currentNote = notesTable[9 + semiTones];
        noteON = true;
        break;
        case "KeyF": currentNote = notesTable[7 + semiTones];
        noteON = true;
        break;
        case "KeyG": currentNote = notesTable[5 + semiTones];
        noteON = true;
        break;
        case "KeyH": currentNote = notesTable[3 + semiTones];
        noteON = true;
        break;
        case "KeyJ": currentNote = notesTable[1 + semiTones];
        noteON = true;
        break;
        case "KeyK": currentNote = notesTable[0 + semiTones];
        noteON = true;
        break;
        case "KeyS": currentNote = notesTable[10 + semiTones];
        noteON = true;
        break;
        case "KeyT": currentNote = notesTable[6 + semiTones];
        noteON = true;
        break;
        case "KeyU": currentNote = notesTable[2 + semiTones];
        noteON = true;
        break;
        case "KeyW": currentNote = notesTable[11 + semiTones];
        noteON = true;
        break;
        case "KeyY": currentNote = notesTable[4 + semiTones];
        noteON = true;
        break;
        case "BracketRight": setScale(e);
        break;
        case "BracketLeft": setScale(e);
        break;
        case "Equal": setScale(e);
        break;
        case "Minus": setScale(e);
        break;
    }
});
window.addEventListener('keyup', (e)=>{
    noteON = false;
})

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
    init();
})
// Synth

createNote = (freq) => {
    function Note () {
        this.osc = audioCTX.createOscillator();
        this.osc.type = selectedWaveform;
        this.gainNode = audioCTX.createGain();
        this.noteOn = false;
        this.freq = freq;
        this.play = () => {
            this.osc.frequency.value = this.freq;
            this.osc.connect(this.gainNode);
            this.gainNode.connect(globalGainNode);
            this.gainNode.gain = 0.01;
            this.osc.start(0);
            this.gainNode.gain.exponentialRampToValueAtTime(0.1, audioCTX.currentTime + 0.001);
            // Attack
            this.gainNode.gain.exponentialRampToValueAtTime(0.5, audioCTX.currentTime + 0.001);
            // Decay
            this.gainNode.gain.exponentialRampToValueAtTime(0.3, audioCTX.currentTime + 0.03);
            // Sustain
            this.gainNode.gain.exponentialRampToValueAtTime(0.3, audioCTX.currentTime + 1);
            // Release
            this.gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCTX.currentTime + 2);
        }
        this.volumeDrop = () => {
            console.log('drops')
            this.gainNode.gain.exponentialRampToValueAtTime(0.05, audioCTX.currentTime + 0.01);
        }
        this.stop = () => {
            this.gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCTX.currentTime + 1);
            setTimeout(()=>{
                
            }, 500);
        }
}
    if(noteON == true){
        let newNote =  new Note;
        player(newNote);
        noteON = false;
    }
}
    

player = (newNote) => {
    if(newNote != undefined){
        playedNotes.unshift(newNote);
        for(let i = 0; i < playedNotes.length; i++){
            switch(i){
                case 0: playedNotes[0].play();
                break;

                default: playedNotes[i].stop();
            }
        }
    }
    // Keep only 16 voices
    if(playedNotes.length > 16){
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
clearCanvas = () => {
    return c.clearRect(0, 0, canvas.width, canvas.height);
}

gridGenerator = (x, y, w, h, color, index) =>{
    function GridBlock () {
        this.index = index;
        this.noteOn = false; 
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.opacity = 0.001;
        this.offset = 0;
        this.fillColor = "rgba(" + color + `${this.opacity}` + ")";
        this.strokeColor = "#000";
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
                createNote(notesTable[this.index]);
            }
            if(this.opacity <= globalGainNode.gain.value && mouse.x > this.x && mouse.x < this.x + this.w && mouse.y > this.y && mouse.y < this.y + this.h){
                if(this.noteOn == false){
                    // currentNote = notesTable[this.index];
                    // createNote(notesTable[this.index]);
                }
                    this.opacity = this.opacity + 0.05;
                    this.fillColor = "rgba(" + color + `${this.opacity}` + ")";
                    // this.noteOn = true;
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
gridArrGenerator = () => {
    let gridRowNum = 0;
    let gridColNum = 0;
    for(let i = 0; i< maxGridBlocks; i++){
        if(i > 11 && i % 12 == 0){
            gridRowNum = gridRowNum + 1;
        }
        if(gridColNum > 11){
            gridColNum = 0;
        }
        let yPosition = gridRowNum * gridBlockHeight;
        let xPosition = gridColNum * gridBlockWidth;
        let color = randomColor();
        let  newGridBlock = gridGenerator(xPosition, yPosition, gridBlockWidth, gridBlockHeight, color, i);
        let freq = rootNote * Math.pow(1.059463, i);
        gridArr.push(newGridBlock);
        notesTable.unshift(freq);
        gridColNum++;
    }
};
getCoords = (radius) => {
    let x = Math.random() * canvas.width - (radius * 2);
    let y = Math.random() * canvas.height + (radius * 2);
    return {
        x: x,
        y: y
    }
}
particlesArrGenerator = () => {
    for(let i = 0; i < maxParticles; i++){
        let radius = Math.random() * 2 + 0.1;
        let coords = getCoords(radius);
        let newParticle = particlesGenerator(coords.x, coords.y, radius);
        particlesArr.push(newParticle);
    }
}
// Hud Text Generator
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
            c.fillText(this.text, canvas.width / 2, 100, 400);
        }
        this.update = () => {
            this.draw();
        }
    }
    return new Text
}

GenerateCursorParticles = () => {
    function CursorParticle () {
        this.i = 0;
        this.velocity = -Math.random() * 0.1;
        this.r = Math.random() * 0.8 + 1;
        this.x = mouse.x + (Math.random() - 0.5) * 100 + this.r;
        this.y = mouse.y + (Math.random() - 0.5) * 100 + this.r;
        this.fillColor = `rgba(255, 255, 255, 0.7)`;
        this.draw = () => {
            c.beginPath();
            c.fillStyle = this.fillColor;
            c.arc(this.x, this.y, this.r, 0, this.i * 2, false);
            c.fill();
        }
        this.update = () => {
            if(this.i >= 360){
                this.i = 0;
            }
            this.i = this.i + this.velocity;
            this.x = mouse.x + this.r * 20 * Math.cos(this.i);
            this.y = mouse.y + this.r * 20 * Math.sin(this.i); 
            this.draw();
        }
    }
    return new CursorParticle
}
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
// Particles Generator
particlesGenerator = (x, y, r) => {
    function Particle () {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 0.15;
        this.dy = (Math.random() - 0.5) * 0.15;
        this.r = r;
        this.offsetX = 0;
        this.opacity = Math.random() + 0.01;
        this.stAng = 0;
        this.endAng = Math.PI * 2;
        this.clockwise = false;
        this.fillColor = `rgba(255, 255, 255. ${this.opacity})`;
        this.draw = () => {
            c.beginPath();
            c.fillStyle = this.fillColor;
            c.arc(this.x, this.y, this.r, this.stAng, this.endAng, this.clockwise);
            c.fill();
        }
        this.update = () => {
            if(mouse.x > canvas.width / 2 && this.offsetX < 180){
                this.x = this.x - Math.floor(globalGainNode.gain.value * 4) * (this.dx * 5);
                this.offsetX++;
            }
            if(mouse.x < canvas.width / 2 && this.offsetX > -180){
                this.x = this.x + Math.floor(globalGainNode.gain.value * 4) * (this.dx * 5);
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

cursorGenerator = () => {
    for(i = 0; i < 50; i++){
        let newParticle = GenerateCursorParticles();
        cursorParticles.push(newParticle);
    }
}
animate = () => {
    requestAnimationFrame(animate);
    clearCanvas();
    drawGrid();
    drawParticles();
    drawText();
    drawCursor();
}

init = () => {
    gridArr = [];
    particlesArr = [];
    notesTable = [];
    playedNotes = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    maxGridRows = 8;
    maxGridBlocks = maxGridRows * 12;
    gridBlockWidth = canvas.width / 12;
    gridBlockHeight = canvas.height / 8
    gridArrGenerator();
    particlesArrGenerator()
    cursorGenerator();
    clearCanvas();
    animate();    
} 


init();

tutorialArr.forEach((item)=>{
    setTimeout(()=>{
        setDisplayText("tutorial", item);
    },3000 * tutorialArr.indexOf(item));
})

