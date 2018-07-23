const canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');
canvas.style.backgroundColor = "#000";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;



window.addEventListener('resize', ()=>{
    init();
})
// grid Variables
let gridArr;
let gridBlockWidth = canvas.width / 12;
let maxGridRows = Math.floor(canvas.height / gridBlockWidth);
let gridBlockHeight = innerHeight / maxGridRows;
let maxGridBlocks = maxGridRows * 12;
// Synth Variables
const audioCTX = new AudioContext;
let gainNode = audioCTX.createGain();
gainNode.gain.value = 0.4;
gainNode.connect(audioCTX.destination);
let baseFreq = 16.35; 
let notesTable = [];
let playedNotes = [];
// Mouse Controller
let mouse = {};
window.addEventListener('mousemove', (e)=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
// Synth

createNote = (freq) => {
    function Note () {
        this.osc = audioCTX.createOscillator();
        this.gainNode = audioCTX.createGain();
        this.noteOn = false;
        this.freq = freq;
        this.play = () => {
            this.osc.frequency.value = this.freq;
            this.osc.connect(this.gainNode);
            this.gainNode.connect(audioCTX.destination);
            this.gainNode.gain.value = 0.01;
            this.gainNode.gain.exponentialRampToValueAtTime(0.5, audioCTX.currentTime + 0.01);
            this.osc.start(0);
        }
        this.volumeDrop = () => {
            this.gainNode.gain.exponentialRampToValueAtTime(0.1, audioCTX.currentTime + 0.01);
        }
        this.stop = () => {
            this.gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCTX.currentTime + 0.5);
            setTimeout(()=>{
                this.osc.stop();
            }, 500);
        }

}
    let newNote =  new Note;
    player(newNote);
}

player = (newNote) => {
    if(newNote != undefined){
        playedNotes.unshift(newNote);
        for(let i = 0; i < playedNotes.length; i++){
            switch(i){
                case 0: playedNotes[0].play();
                break;
                case i < 15: playedNotes[i].volumeDrop()
                break;
                default: playedNotes[i].stop();
            }
        }
    }
    // Keep only 16 voices
    if(playedNotes.length > 16){
        playedNotes.pop();
        console.log(playedNotes);
    }
    

    
    
}
// Utility Functions
randomColor = () => {
    let colors = [
        "37, 94 , 138, ",
        "21, 149, 159, ",
        "241, 228, 179, ",
        "236, 151, 112, ",
        "199, 64, 45, "
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
        this.opacity = 0.5;
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
            if(this.opacity <= 1.1 && mouse.x > this.x && mouse.x < this.x + this.w && mouse.y > this.y && mouse.y < this.y + this.h){
                if(this.noteOn == false){
                    
                    let newNote = createNote(notesTable[this.index]);
                    console.log(newNote);
                    player()
                    
                }
                    this.opacity = this.opacity + 0.05;
                    this.fillColor = "rgba(" + color + `${this.opacity}` + ")";
                    this.noteOn = true;
            }
            else if(this.opacity >= 0.5){
                if(mouse.x <= this.x || mouse.x >= this.x + this.w || mouse.y <= this.y || mouse.y >= this.y + this.h){
                    this.noteOn = false;
                    this.opacity = this.opacity - 0.1;
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
        let freq = baseFreq * Math.pow(1.059463, i);
        gridArr.push(newGridBlock);
        notesTable.push(freq);
        gridColNum++;
    }
};

animate = () => {
    requestAnimationFrame(animate);
    clearCanvas();
    drawGrid();
}

init = () => {
    gridArr = [];
    notesTable = [];
    playedNotes = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    maxGridRows = 8;
    maxGridBlocks = maxGridRows * 12;
    gridBlockWidth = canvas.width / 12;
    gridBlockHeight = canvas.height / 8
    gridArrGenerator();
    clearCanvas();
    animate();
}


init();

