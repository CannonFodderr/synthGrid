"use strict";!function(){var e=document.getElementById("loader"),t=setInterval(function(){"complete"===document.readyState&&(clearInterval(t),e.style.display="none")},100),i=document.querySelector("canvas"),n=i.getContext("2d");i.width=window.innerWidth,i.height=window.innerHeight;var a=i.width/10,o=[],r=[],s="",c=["Hello !","Synth with Cats in Space","Under Construction","Please note:","Most desktop features are not supported in Mobile yet",'Press "A-K" or Touch to play',"Change sounds with 1 - 4 (Not Numeric)","Mouse position will alter the note length","Press M for Mute","Press [ ] to change octaves","Transpose: - +",'Press "SPACE" for Sustain',"Set Volume with Mouse Wheel"],u=void 0,d=3,l=!1,h=!1,f=void 0,m=i.width/11,v=8,w=innerHeight/v,g=11*v,y=void 0,p=void 0,T=void 0,x=void 0,k=void 0,b=void 0;var A=!1,M=16.35,E=[],S=[],C=[],L=!1,V=void 0,N=void 0,K=0,D=0,P=36,R="sine",O={attackTime:.02,decayTime:.01,sustainTime:0,releaseTime:1},Y={};function X(){d=3}function q(){if(d>0)return d--;d<=0&&(clearInterval(u),s="")}function B(e,t){clearInterval(u),X(),"globalGain"==e&&(s="Volume: "+t),"waveform"==e&&(s="Waveform: "+t),"transpose"==e&&(s="Transpose: "+t),"octave"==e&&(s="Octave: "+t),"tutorial"==e&&(s=""+t),u=setInterval(q,500)}function G(e){D>=-2&&"BracketRight"==e.code&&(P-=12,B("octave",- --D)),D<=2&&"BracketLeft"==e.code&&(P+=12,B("octave",-++D)),K>=-11&&"Equal"==e.code&&(P--,B("transpose",- --K)),K<=11&&"Minus"==e.code&&(P++,B("transpose",-++K))}function I(e){var t=new function(){var t=this;this.osc=y.createOscillator(),this.keyCode,this.osc.type=R,this.gainNode=y.createGain(),this.noteOn=!1,this.isSustained=!1,this.sustain=.1,this.freq=e,this.play=function(){t.osc.frequency.value=t.freq,t.osc.connect(t.gainNode),t.gainNode.connect(x),t.gainNode.gain.value=.01,t.osc.start(0),1==L&&(t.isSustain=!0,t.sustain=5),t.gainNode.gain.setValueAtTime(.001,y.currentTime),t.gainNode.gain.exponentialRampToValueAtTime(.9*x.gain.value,y.currentTime+O.attackTime),t.gainNode.gain.exponentialRampToValueAtTime(.8*x.gain.value,y.currentTime+O.attackTime+O.decayTime),!0===t.isSustained&&(t.gainNode.gain.setValueAtTime(.001*x.gain.value,y.currentTime+O.attackTime+O.decayTime),t.gainNode.gain.exponentialRampToValueAtTime(.001,y.currentTime+O.attackTime+O.decayTime+t.sustain+O.releaseTime)),0==t.isSustained&&(y.currentTime,O.attackTime,O.decayTime,t.sustain,O.releaseTime,t.gainNode.gain.exponentialRampToValueAtTime(1e-4,y.currentTime+O.attackTime+O.decayTime+t.sustain+O.releaseTime),setTimeout(function(){t.osc.stop(0)},6e3))},this.volumeDrop=function(){t.gainNode.gain.exponentialRampToValueAtTime(.005,y.currentTime+1e-4)},this.stop=function(){t.gainNode.gain.setValueAtTime(t.gainNode.gain.value,y.currentTime),t.gainNode.gain.exponentialRampToValueAtTime(1e-5,y.currentTime+.03),t.gainNode.gain.setValueAtTime(1e-4,y.currentTime),setTimeout(function(){t.osc.stop(0)},100)}};return 1==A&&function(e){if(void 0!=e&&e!=S[0]){S.unshift(e);for(var t=0;t<S.length;t++)switch(t){case 0:S[0].play();break;case 16:S[8].stop()}}S.length>8&&S.pop()}(t),t}function H(){return["255, 83 , 13, ","232, 44, 12, ","255, 0, 0, ","232, 12, 122, ","255, 13, 255, "][Math.floor(5*Math.random())]}function W(){n.clearRect(0,0,i.width,i.height)}function F(e,t,i,a,o,r){return new function(){var s=this;this.index=r,this.noteOn=!1,this.isPressed=!1,this.x=e,this.y=t,this.w=i,this.h=a,this.opacity=.001,this.offset=0,this.fillColor="rgba("+o+this.opacity+")",this.strokeColor="rgba(0, 0, 0, 0.2)",this.draw=function(){n.fillStyle=o,n.beginPath(),n.rect(s.x,s.y,s.w,s.h),n.save(),n.fillStyle=s.fillColor,n.fill(),n.restore(),n.strokeStyle=s.strokeColor,n.stroke()},this.update=function(){var e;E.indexOf(N)==s.index&&(s.opacity=x.gain.value,s.noteOn=!0),s.opacity<=x.gain.value&&Y.x>s.x&&Y.x<s.x+s.w&&Y.y>s.y&&Y.y<s.y+s.h?(V=E[s.index],1==h&&(e=N,N=V,e!=S[1]&&1==h&&I(N),h=!1),s.opacity=s.opacity+.05,s.fillColor="rgba("+o+s.opacity+")"):s.opacity>=.01&&(Y.x<=s.x||Y.x>=s.x+s.w||Y.y<=s.y||Y.y>=s.y+s.h)&&(s.noteOn=!1,s.opacity=s.opacity-.005,s.fillColor="rgba("+o+s.opacity+")"),s.draw()}}}function U(){(function(e){return new function(){var t=this;this.text=e,this.opacity=1,this.fillColor="rgba(255, 255, 255, "+this.opacity+")",this.draw=function(){t.opacity=1,t.fillColor="rgba(255, 255, 255, "+t.opacity+")",n.beginPath(),n.fillStyle=t.fillColor,n.textAlign="center",n.font="italic small-caps bold 30px arial",n.fillText(t.text,i.width/2,100,i.width-10)},this.update=function(){t.draw()}}})(s).update()}function z(){return new function(){var e=this;this.i=0,this.velocity=.1*-Math.random(),this.r=.8*Math.random()+1,this.x=Y.x+100*(Math.random()-.5)+this.r,this.y=Y.y+100*(Math.random()-.5)+this.r,this.color=H(),this.fillColor="orange",this.draw=function(){n.beginPath(),n.save(),n.fillStyle=e.fillColor,n.arc(e.x,e.y,e.r,0,2*e.i,!1),n.fill(),n.restore()},this.update=function(){e.i<=-180&&(e.i=0),e.i=e.i+e.velocity,e.x=Y.x+e.r*i.width/50*Math.cos(e.i),e.y=Y.y+e.r*i.width/50*Math.sin(e.i),e.draw()}}}function J(e,t,a){return new function(){var o=this;this.x=e,this.y=t,this.dx=.2*(Math.random()-.5),this.dy=.2*(Math.random()-.5),this.r=a,this.offsetX=0,this.opacity=Math.random()+.01,this.stAng=0,this.endAng=2*Math.PI,this.clockwise=!1,this.fillColor="rgba(255, 255, 255. "+this.opacity+")",this.draw=function(){n.beginPath(),n.save(),n.fillStyle=o.fillColor,n.arc(o.x,o.y,o.r,o.stAng,o.endAng,o.clockwise),n.fill(),n.restore()},this.update=function(){Y.x>i.width/2&&o.offsetX<180&&(o.x=o.x-Math.floor(4*x.gain.value)*(2*o.dx),o.offsetX++),Y.x<i.width/2&&o.offsetX>-180&&(o.x=o.x+Math.floor(4*x.gain.value)*(2*o.dx),o.offsetX--),(o.x+o.r>i.width||o.x-o.r<0)&&(o.dx=-o.dx),(o.y+o.r>i.height||o.y-o.r<0)&&(o.dy=-o.dy),o.x=o.x+o.dx,o.y=o.y+o.dy,o.draw()}}}window.addEventListener("mousemove",function(e){var t;Y.x=e.clientX,Y.y=e.clientY,t=e,h||((t.clientY<=1||O.releaseTime<=.1)&&(O.releaseTime=.1),(t.clientY>=window.innerHeight-10||O.releaseTime>=6)&&(O.releaseTime=6),(t.clientX<=1||O.attackTime<=.1)&&(O.releaseTime=.1),(t.clientY>=window.innerWidth-10||O.attackTime>=.1)&&(O.releaseTime=6),O.releaseTime=0+t.clientY/i.height,O.attackTime=0+t.clientX/(2*i.width))}),window.addEventListener("beforeunload",function(){y.suspend(),y.close()}),window.addEventListener("unload",function(e){y.suspend(),y.close()}),window.addEventListener("contextmenu",function(e){e.preventDefault()}),window.addEventListener("mousewheel",function(e){l=!1,e.wheelDeltaY<0&&x.gain.value-b>0&&x.gain.exponentialRampToValueAtTime(x.gain.value-b,y.currentTime+.01),e.wheelDeltaY<0&&x.gain.value-b<0&&x.gain.exponentialRampToValueAtTime(1e-5,y.currentTime+.01),e.wheelDeltaY>0&&x.gain.value<=1&&x.gain.exponentialRampToValueAtTime(x.gain.value+b,y.currentTime+.01),B("globalGain",Math.floor(100*x.gain.value)),X()}),window.addEventListener("keydown",function(e){if(e.preventDefault(),-1==C.indexOf(e.code))switch(C.push(e.code),e.code){case"Digit1":R="sine",B("waveform","Sine");break;case"Digit2":R="square",B("waveform","Square");break;case"Digit3":R="sawtooth",B("waveform","Sawtooth");break;case"Digit4":R="triangle",B("waveform","Triangle");break;case"KeyM":0==l?(k=x.gain.value,x.gain.exponentialRampToValueAtTime(1e-6,y.currentTime+.01),B("globalGain","OFF"),l=!0):(x.gain.exponentialRampToValueAtTime(k,y.currentTime+.01),B("globalGain","ON"),l=!1);break;case"KeyA":N=E[12+P],A=!0,I(N);break;case"KeyD":N=E[8+P],A=!0,I(N);break;case"KeyE":N=E[9+P],A=!0,I(N);break;case"KeyF":N=E[7+P],A=!0,I(N);break;case"KeyG":N=E[5+P],A=!0,I(N);break;case"KeyH":N=E[3+P],A=!0,I(N);break;case"KeyJ":N=E[1+P],A=!0,I(N);break;case"KeyK":N=E[0+P],A=!0,I(N);break;case"KeyS":N=E[10+P],A=!0,I(N);break;case"KeyT":N=E[6+P],A=!0,I(N);break;case"KeyU":N=E[2+P],A=!0,I(N);break;case"KeyW":N=E[11+P],A=!0,I(N);break;case"KeyY":N=E[4+P],A=!0,I(N);break;case"BracketRight":case"BracketLeft":case"Equal":case"Minus":G(e);break;case"Space":L=!0}}),window.addEventListener("keypress",function(e){A=!0}),window.addEventListener("keyup",function(e){var t=C.indexOf(e.code);C.splice(t,1),"Space"==e.code&&(L=!1),A=!1}),window.addEventListener("touchstart",function(e){Y.x=e.changedTouches[0].clientX,Y.y=e.changedTouches[0].clientY,h=!0,A=!0}),window.addEventListener("touchmove",function(e){Y.x=e.changedTouches[0].clientX,Y.y=e.changedTouches[0].clientY,h=!0,A=!1}),window.addEventListener("touchend",function(e){A=!1,h=!1,N=""}),window.addEventListener("mouseover",function(e){Y.x=e.clientX,Y.y=e.clientY}),window.addEventListener("mouseup",function(e){e.preventDefault(),A=!1,h=!1,N=""}),window.addEventListener("resize",function(){Q()});var j=function(e){function t(){return e.apply(this,arguments)}return t.toString=function(){return e.toString()},t}(function(){W(),requestAnimationFrame(j),function(){for(var e=0;e<f.length;e++)f[e].update()}(),function(){for(var e=0;e<o.length;e++)o[e].update()}(),U(),function(){for(var e=0;e<r.length;e++)r[e].update()}()});function Q(){var e;W(),i.width=window.innerWidth,i.height=window.innerHeight,g=11*(v=8),m=i.width/11,w=i.height/8,r=[],f=[],o=[],E=[],S=[],(y=new(window.AudioContext||window.webkitAudioContext)).suspend(),e=y,new Promise(function(t,i){if("suspended"===y.state&&"ontouchstart"in window||"onkeydown"in window){var n=function n(){e.resume().then(function(){document.body.removeEventListener("touchstart",n),document.body.removeEventListener("touchend",n),t(!0)},function(e){i(e)})};document.body.addEventListener("touchstart",n,!1),document.body.addEventListener("touchend",n,!1),document.body.addEventListener("keydown",n,!1),document.body.addEventListener("keyup",n,!1)}else t(!1)}),p=y.createScriptProcessor(1024,1,1),(T=y.createDynamicsCompressor()).threshold.setValueAtTime(-3,y.currentTime),T.ratio.setValueAtTime(20,y.currentTime),p.onaudioprocess=function(e){for(var t=e.inputBuffer,i=e.outputBuffer,n=0;n<i.numberOfChannels;n++)for(var a=t.getChannelData(n),o=i.getChannelData(n),r=0;r<t.length;r++)o[r]=a[r]},(x=y.createGain()).gain.value=.4,k=.3,b=.01,x.connect(T),T.connect(p),p.connect(y.destination),function(){for(var e=0,t=0,n=0;n<g;n++){n>10&&n%11==0&&(e+=1),t>10&&(t=0);var a=e*w,o=t*m,r=H(),s=F(i.width-o-m,a,m,w,r,n),c=M*Math.pow(1.059463,n);f.push(s),E.unshift(c),t++}}(),function(){for(var e=0;e<a;e++){var t=2*Math.random()+.1,n=(s=t,{x:Math.random()*i.width-2*s,y:Math.random()*i.height+2*s}),r=J(n.x,n.y,t);o.push(r)}var s}(),setTimeout(function(){c.forEach(function(e){setTimeout(function(){B("tutorial",e)},3e3*c.indexOf(e))})},2e3),function(){for(var e=0;e<20;e++){var t=z();r.push(t)}}(),j()}Q()}();