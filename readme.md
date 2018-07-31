# Synth with Cats in Space

My first attempt of using JS AudioContext with Canvas elements.

#### current features:

* AudioContext synth with up to 16 voices
* AudioContext plays notes to buffer
* Global gain node - for volume adjustments
* Global limiter to prevent digital distortion
* Canvas elements: notes grid, stars background particles, mouse particles & tutorial text.
* Beta & Kruvi featured in the background!
* Mouse & Touch positions displayed as Canvas particles

##### desktop

* play an octave by pressing "A" - "K"
* play a note by mouse clicking a grid element
* Sustain a note by holding "Spacebar"
* Switch oscillator type with 1 - 4 (Non numeric)
* Adjust octaves with [ ] 
* Transposition - Adjust semitones with = - (Non numeric)
* Mouse Wheel changes volume

* Grid item opacity change on mouseover
* Grid item opacity adjusted with volume change
* Grid item opacity responds to keypress

* Stars particles change direction on window edges
* Stars particles move relative to mouse X axis

* Canvas text element displays tutorial, volume, transposition & octave changes
##### mobile

**Most desktop features are currently not available in mobile**

* basic touch to play notes implementation