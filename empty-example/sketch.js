/**
 * @name Measuring Amplitude
 * @description <p>Analyze the amplitude of sound with
 * p5.Amplitude.</p>
 *
 *  <p><b>Amplitude</b> is the magnitude of vibration. Sound is vibration,
 *  so its amplitude is is closely related to volume / loudness.</p>
 *
 * <p>The <code>getLevel()</code> method takes an array
 * of amplitude values collected over a small period of time (1024 samples).
 * Then it returns the <b>Root Mean Square (RMS)</b> of these values.</p>
 *
 * <p>The original amplitude values for digital audio are between -1.0 and 1.0.
 * But the RMS will always be positive, because it is squared.
 * And, rather than use instantanous amplitude readings that are sampled at a rate
 * of 44,100 times per second, the RMS is an average over time (1024 samples, in this case),
 * which better represents how we hear amplitude.
 * </p>
 * <p><em><span class="small"> To run this example locally, you will need the
 * <a href="http://p5js.org/reference/#/libraries/p5.sound">p5.sound library</a>
 * a sound file, and a running <a href="https://github.com/processing/p5.js/wiki/Local-server">local server</a>.</span></em></p>
 */
let song, analyzer;
let centerX = 710 / 2, centerY = 500 / 2;
let circleNum = 10;
let cols, rows,
    current = [],
    previous = [],
    damping = 0.9;

let colorscale = new Array(); //list of opacity scaling factors of circles from previous frames
let circles = new Array(); //list of circle radii from previous frames 
let colors = new Array(); // etc. 
let velocities = new Array();
let ampsArray = new Array();
var volhistory = [];

function preload() {
    song = loadSound('assets/illo_-_Marta.mp3');
}

function sigmoid(t) {
    return 1 / (1 + Math.pow(Math.E, -t));
}

function setup() {
    createCanvas(710, 500);
    song.loop();

    // create a new Amplitude analyzer
    analyzer = new p5.Amplitude();

    // Patch the input to an volume analyzer
    analyzer.setInput(song);

    // makes new FFT analyzer. idk what these words mean
    fft = new p5.FFT();
    fft.setInput(song);
    cols = width
    rows = height
    //pixelDensity(1.0)
    for (let i = 0; i < cols; i++) {
        current[i] = []
        previous[i] = []
        for (let j = 0; j < rows; j++) {
            current[i][j] = 255
            previous[i][j] = 255
        }
    }
    previous[100][100] = 255
    frameRate(18);
    angleMode(DEGREES);
}

//splits array into parts. note this destroys the array :(
function splitToChunks(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
}

//currently not useful
function mouseDragged() {
    current[mouseX][mouseY] = 0
}

function draw() {
    background(255);
   
    //Get the average (root mean square) amplitude
    let rms = analyzer.getLevel();
    let spectrum = fft.analyze();

    // Get average amplitude in specific frequency region
	/** const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
	var hue1 = average(spectrum.slice(spectrum.length/3));
	var hue2 = average(spectrum.slice(spectrum.length/3, 2*spectrum.length/3));
	var hue3 = average(spectrum.slice(2*spectrum.length/3, spectrum.length-1));
  
	fill(hue1*4, hue2*4, hue3*6, 150); **/

    // plots spectrum
/**fill(255, 10);
    beginShape();
    for (l = 0; l < spectrum.length; l += 10) {

        vertex(l, map(spectrum[l], 0, 255, height, 0));
    }
    endShape();**/

    //initializes two variables that determine how many circles are present, which scales with average amplitude
    if (Math.floor(6 * rms) > 0) { amp = 1; }
    else { amp = 0;}

    ampsArray.push(amp)

    // split array into n parts, then finds the maximum intensity for each part, then draws an ellipse with size and color equal to the max intensity
    var spectrumChunks = splitToChunks(spectrum, circleNum);
    for (i = 0; i < spectrumChunks.length; i++) {
        spectrumChunks[i] = Math.max.apply(null, spectrumChunks[i])
        if (i % 3 == 0) { // turns circle and outline yellow
            fill(1.5 * spectrumChunks[i], 1.5 * spectrumChunks[i], 0, 10 * Math.log(spectrumChunks[i]));
            stroke(spectrumChunks[i] * 1.5, spectrumChunks[i] * 1.5, 0, 10 * Math.log(spectrumChunks[i]));
        }
        else if (i % 3 == 1) { // turns circle and outline yellow
            fill(2 * spectrumChunks[i], 0, 0, 10 * Math.log(spectrumChunks[i]));
            stroke(spectrumChunks[i] * 1.5, spectrumChunks[i] * 1.5, 0, 10 * Math.log(spectrumChunks[i]));
        }
        else if (i % 3 == 2) { // turns circle and outline yellow
            fill(2*spectrumChunks[i], 2*0.647*spectrumChunks[i],0, 10 * Math.log(spectrumChunks[i]));
            stroke(spectrumChunks[i] * 1.5, spectrumChunks[i] * 1.5, 0, 10 * Math.log(spectrumChunks[i]));
        }
        for (j = -amp; j < amp + 1; j++) {  //actually plots the circle
            tint(255, 255 - 200 * abs(j));
            ellipse(centerX + 250 * j, centerY, 2.5*(10 + spectrumChunks[i] * (0.5 - i / 24)), 2.5*(10 + spectrumChunks[i] * (0.5 - i / 24)));
            circles.push(2*(20 + spectrumChunks[i] * (0.5 - i / 24))) //adds circle radius to a list of circle radii
            velocities.push((20 + i * (0.5 - i / 24)) / 8) //adds circle velocity to a list
            colors.push(spectrumChunks[i]) //adds circle ''color'' to a list
            colorscale.push(1) //adds a quantity that will be used to scale the circle opacity
            
        }

    }

    /**loadPixels()
    for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
            current[i][j] =
                (previous[i - 1][j] + previous[i + 1][j] +
                    previous[i][j - 1] + previous[i][j + 1] +
                    previous[i - 1][j - 1] + previous[i - 1][j + 1] +
                    previous[i + 1][j - 1] + previous[i + 1][j + 1]
                ) / 4 - current[i][j];
            current[i][j] = current[i][j] * damping
            let index = (i + j * cols) * 4;
            pixels[index + 0] = current[i][j] * 255
            pixels[index + 1] = current[i][j] * 255
            pixels[index + 2] = current[i][j] * 255
            pixels[index + 3] = 0
        }
    }
    updatePixels()**/

    //for all circles that have been saved in the circles array, draw circles at specified locations
    for (q = circles.length-1; q>=0; q--) {
        for (r = -ampsArray[q]; r < ampsArray[q] + 1; r++) {
            {
                colorscale[q]*=0.9
                if (colors[q] % 3 == 0) { // draws yellow circles with indicated color. opacity scaled by colorscale
                    fill(colors[q] * 1.5, colorscale[q] *colors[q] * 1.5, 0, colorscale[q]*10 * Math.log(colors[q]));
                    stroke(colors[q] * 1.5, colorscale[q] * colors[q] * 1.5, 0, colorscale[q] * 10 * Math.log(colors[q]));
                }
                else if (colors[q] % 3 == 1) { // red circles
                    fill(2 * colors[q], 0, 0, colorscale[q] * 10 * Math.log(colors[q]));
                    stroke(colors[q] * 1.5, colors[q] * 1.5, 0, colorscale[q] * 10 * Math.log(colors[q]));
                }
                else if (colors[q] % 3 == 2) { // orange circles
                    fill(2 * colors[q], 0.647 * colors[q], 0, colorscale[q] * 10 * Math.log(colors[q]));
                    stroke(colors[q] * 1.5, colors[q] * 1.5, 0, colorscale[q] * 10 * Math.log(colors[q]));
                }
                circles[q] = circles[q] + velocities[q]
                ellipse(centerX + 250 * r, centerY, circles[q], circles[q]);
                if (circles[q] >= 900) { //if your circle is too large we save space and cut it from the list of circles
                    circles.splice(q)
                    velocities.splice(q)
                    colors.splice(q)
                    colorscale.splice(q)
                    ampsArray.splice(q)
                }
            }
        }
    }

    // Draws an ellipse with size based on amplitude of specified frequency
    // fill(0, hue2*4, 0, 50); 
    // ellipse(q, j, 100 + hue2*2, 100+hue2*3);
    // fill(0, 0, hue3*6, 50);
    // ellipse(q, j, 100 + hue3*1.6, 100+hue3*1.6);

    // drifts center of ellipse a lil bit
    //centerX += 4 * (Math.random() - 0.5)
    //centerY += 4 * (Math.random() - 0.5)

    //radial graph
    var vol = analyzer.getLevel();
    volhistory.push(vol);
 
    translate(width / 2, height / 2);
    fill(255,255,255,0)
    stroke(255, 204, 0);
    beginShape();
    for (var i = 0; i < 360; i++) {
        var r = map(volhistory[i], 0, 1, 100, 400);
        var x = r* cos(i);
        var y = r * sin(i);
        vertex(x, y);
    }
    endShape();

    if (volhistory.length > 360) {
        volhistory.splice(0, 1);
    }

    var temp = previous;
    previous = current;
    current = temp;
}