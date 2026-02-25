// Jei toks yra - uzdarom esama projekta neissaugojus
if (app.project) {
    app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
}

app.newProject(); // Sukuriam nauja projekta

// Pirminiai kintamieji
var musicFile = null;
var compName = null;
var compWidth = 1920;
var compHeight = 1080;
var compFps = 24;

// Ikeliam muzikos faila
while (!musicFile) {
    var musicFile = File.openDialog("Choose a music file", "*.mp3;*.wav");
    if (!musicFile) {
        alert("No file selected. Please select a valid music file!");
    }
}

// Nurodom kompozicijos pavadinima
while (!compName || compName == "" || compName.length < 4 || compName.length > 60) {
    var compName = prompt("Enter the composition name:", "Audio Visualization");
    if (compName == ""){
        alert("Comp Name can not be empty!");
    } else if (compName.length < 4 || compName.length > 60) {
        alert("Please keep the Composition name between 4...60 characters!");
    }
}

// Nuskaitom audio failo trukme
var audioFile = app.project.importFile(new ImportOptions(musicFile));
var audioDuration = audioFile.duration;

// Sukuriam nauja kompozicija pagal nurodyta pavadinima ir ikelto audio failo trukme
var comp = app.project.items.addComp(compName, compWidth, compHeight, 1, audioDuration, compFps);
    
comp.openInViewer();

// Kuriame sluoksnius

// Susikuriame Controller Null sluoksni
var controllerLayer = comp.layers.addNull();
controllerLayer.source.name = ("Controllers");

// Sukuriame kontrolerius ir ivedame bazines reiksmes (su galimybe jas redaguoti part nurodytu "sienu")
controllerLayer.effect.addProperty("ADBE Slider Control")("Slider");
controllerLayer.effect("Slider Control").property("Slider").setValue([60]);
controllerLayer.effect("Slider Control").property("Slider").expression = '''clamp(value,0,100);''';
controllerLayer.effect("Slider Control").name = ("Visible Objects Scale");

controllerLayer.effect.addProperty("ADBE Color Control")("Color");
controllerLayer.effect("Color Control").property("Color").setValue([0,6,255]/255); //0006FF
controllerLayer.effect("Color Control").name = ("Spectrum Inside Color");

controllerLayer.effect.addProperty("ADBE Color Control")("Color");
controllerLayer.effect("Color Control").property("Color").setValue([183,188,254]/255); //B7BCFE
controllerLayer.effect("Color Control").name = ("Spectrum Outside Color + Ellipse Stroke Color");

controllerLayer.effect.addProperty("ADBE Slider Control")("Slider");
controllerLayer.effect("Slider Control").property("Slider").setValue([30]);
controllerLayer.effect("Slider Control").property("Slider").expression = '''clamp(value,0,50);''';
controllerLayer.effect("Slider Control").name = ("Spectrum Thickness + Ellipse Stroke Width (/2)");

controllerLayer.effect.addProperty("ADBE Slider Control")("Slider");
controllerLayer.effect("Slider Control").property("Slider").setValue([5]);
controllerLayer.effect("Slider Control").property("Slider").expression = '''clamp(value,0,100);''';
controllerLayer.effect("Slider Control").name = ("Spectrum Softness");

controllerLayer.effect.addProperty("ADBE Slider Control")("Slider");
controllerLayer.effect("Slider Control").property("Slider").setValue([100]);
controllerLayer.effect("Slider Control").property("Slider").expression = '''clamp(value,0,200);''';
controllerLayer.effect("Slider Control").name = ("Glow Effect Radius");

controllerLayer.effect.addProperty("ADBE Slider Control")("Slider");
controllerLayer.effect("Slider Control").property("Slider").setValue([2]);
controllerLayer.effect("Slider Control").property("Slider").expression = '''clamp(value,0,6);''';
controllerLayer.effect("Slider Control").name = ("Glow Effect Intensity");

// Sukuriam muzikos sluoksni
var musicLayer = comp.layers.add(audioFile);
musicLayer.source.name = ("Music Layer");

// Sugeneruojam pilna Audio Amplitude sluoksni pagal muzikos faila
musicLayer.selected = true;
app.executeCommand(5015);                                                                       // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Sitas meniu kodas yra skirtas specifiskai Adobe AE CS6! 
//app.executeCommand(app.findMenuCommandId("Convert Audio to Keyframes")); // Naudokite sita funkcija, jeigu ankstesne eilute nesugeneruoja reikiamo "Audio Amplitude" sluoksnio

mainAmplitudeLayer = comp.layer("Audio Amplitude");
mainAmplitudeLayer.source.name = ("Main Amplitude");

//Sukuriam Audio Spectrum sluoksnius (kreipiniai i funkcija apacioje)
var specialSpectrumLayer = createAudioSpectrumLayer(comp, "AS Special", 240, 300, 5000, 66, 15, 540, 1905, 540, 1);   // Special spektras: 300 Hz - 5k Hz
var bassLayer = createAudioSpectrumLayer(comp, "AS Bass", 0, 20, 250, 22, 655, 540, 1265, 540, 2);              // Bass spektras: 20 Hz - 250 Hz
var midLayer = createAudioSpectrumLayer(comp, "AS Mid", 0, 250, 2000, 22, 15, 540, 625, 540, 2);              // Midrange spektras: 250 Hz - 2k Hz
var trebleLayer = createAudioSpectrumLayer(comp, "AS Treb", 0, 2000, 10000, 22, 1295, 540, 1905, 540, 2);        // Treble spektras: 2k Hz - 10k Hz


// Funkcija sukurti audio spektro sluoksnius
function createAudioSpectrumLayer(comp, layerName, rotate, startFreq, endFreq, bands, startX, startY, endX, endY, sideAB) {
    var solid = comp.layers.addSolid([0, 0, 0], layerName, comp.width, comp.height, 1);
    
    solid.Transform.property("Rotation").setValue([rotate]);
    solid.Transform.property("Scale").expression = '''temp = thisComp.layer("Controllers").effect("Visible Objects Scale")("Slider");[temp, temp]'''; // Pick Whip
    
    var spectrumEffect = solid.Effects.addProperty("Audio Spectrum");
    spectrumEffect.property("Start Point").setValue([startX, startY]);
    spectrumEffect.property("End Point").setValue([endX, endY]);
    spectrumEffect.property("Start Frequency").setValue([startFreq]);
    spectrumEffect.property("End Frequency").setValue([endFreq]);
    spectrumEffect.property("Frequency bands").setValue([bands]);
    spectrumEffect.property("Thickness").expression = '''thisComp.layer("Controllers").effect("Spectrum Thickness + Ellipse Stroke Width (/2)")("Slider")'''; // Pick Whip
    spectrumEffect.property("Softness").expression = '''thisComp.layer("Controllers").effect("Spectrum Softness")("Slider")'''; // Pick Whip
    spectrumEffect.property("Inside Color").expression = '''thisComp.layer("Controllers").effect("Spectrum Inside Color")("Color")'''; // Pick Whip
    spectrumEffect.property("Outside Color").expression = '''thisComp.layer("Controllers").effect("Spectrum Outside Color + Ellipse Stroke Color")("Color")''' // Pick Whip
    spectrumEffect.property("Side Options").setValue(sideAB);
    
    // Priklausomai nuo sluoksnio pavadinimo, pridedam skirtingas israiskas prie maksimalaus aukscio
    switch (layerName) {
    case "AS Special":spectrumEffect.property("Maximum Height").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider"); linear(amplitude, 0, 20, 300, 5500);''';break;
    case "AS Bass":spectrumEffect.property("Maximum Height").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider"); linear(amplitude, 0, 20, 100, 1500);''';break;
    case "AS Mid":spectrumEffect.property("Maximum Height").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider"); linear(amplitude, 0, 20, 200, 2500);''';break;
    case "AS Treb":spectrumEffect.property("Maximum Height").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider"); linear(amplitude, 0, 20, 300, 5500);''';break;
    }

    // Pridedam efektus
    var polarCoordinatesEffect = solid.Effects.addProperty("ADBE Polar Coordinates");
    polarCoordinatesEffect.property("Interpolation").setValue([1]);
    polarCoordinatesEffect.property("Type of Conversion").setValue(1); // Rect to Polar
    
    var glowEffect = solid.Effects.addProperty("ADBE Glo2");
    glowEffect.property("Glow Radius").expression = '''thisComp.layer("Controllers").effect("Glow Effect Radius")("Slider")'''; // Pick Whip
    glowEffect.property("Glow Intensity").expression = '''thisComp.layer("Controllers").effect("Glow Effect Intensity")("Slider")'''; // Pick Whip
    
    var directionalBlurEffect = solid.Effects.addProperty("Directional Blur");
    directionalBlurEffect.property("Direction").setValue([90]); // 90 laipsniu
    directionalBlurEffect.property("Blur Length").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider"); linear(amplitude, 10, 100, 0, 20);''';

    return solid;
}

// Sukuriam daleliu sluoksni
var particleLayer = comp.layers.addSolid([0, 0, 0], "Particle Layer", comp.width, comp.height, 1);
particleLayer.Transform.property("Scale").expression = '''temp = thisComp.layer("Controllers").effect("Visible Objects Scale")("Slider");[temp, temp]''' // Pick Whip

var particleEffect = particleLayer.Effects.addProperty("CC Particle World");

// Daleliu sluoksnio nustatymai
particleEffect.property("Birth Rate").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider");linear(amplitude, 20, 300, 0, 10);''';
particleEffect.property("Longevity (sec)").setValue([0.5]);
particleEffect.property("Animation").setValue(5); // Viscouse
particleEffect.property("Velocity").setValue([1.8]);
particleEffect.property("Gravity").setValue([0]);
particleEffect.property("Particle Type").setValue(7); // Bubble
particleEffect.property("Birth Size").setValue([0.05]);
particleEffect.property("Max Opacity").expression = '''amplitude = thisComp.layer("Main Amplitude").effect("Both Channels")("Slider"); linear(amplitude, 10, 100, 0, 40);''';
particleEffect.property("Birth Color").expression = '''thisComp.layer("Controllers").effect("Spectrum Inside Color")("Color")'''; // Pick Whip
particleEffect.property("Death Color").expression = '''thisComp.layer("Controllers").effect("Spectrum Outside Color + Ellipse Stroke Color")("Color")'''; // Pick Whip

//Sugeneruojam darviena Audio Amplitude sluoksni zemu dazniu Audio Spectrum sluoksni
app.executeCommand(2004);
bassLayer.selected = true;
app.executeCommand(5015);                                                                       // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Sitas meniu kodas yra skirtas specifiskai Adobe AE CS6! 
//app.executeCommand(app.findMenuCommandId("Convert Audio to Keyframes")); // Naudokite sita funkcija, jeigu ankstesne eilute nesugeneruoja reikiamo "Audio Amplitude" sluoksnio

bassAmplitudeLayer = comp.layer("Audio Amplitude");
bassAmplitudeLayer.source.name = ("Bass Amplitude");

// Sukuriam sluoksni apskritimui
var ellipseLayer = comp.layers.addShape();
ellipseLayer.name = ("Ellipse");


// Sugeneruojam elipse
var contents = ellipseLayer.property("Contents");
var ellipsePath = contents.addProperty("ADBE Vector Shape - Ellipse");
ellipsePath.name = ("Ellipse Path 1");
ellipsePath.property("ADBE Vector Ellipse Size").setValue([1200, 1200]);

// Nupiesiam elipes krastine (ji nebus uzpildyta)
var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
stroke.property("ADBE Vector Stroke Color").expression = '''thisComp.layer("Controllers").effect("Spectrum Outside Color + Ellipse Stroke Color")("Color")'''; // Pick Whip
stroke.property("ADBE Vector Stroke Width").expression = '''thisComp.layer("Controllers").effect("Spectrum Thickness + Ellipse Stroke Width (/2)")("Slider")/2'''; // Pick Whip (su dalyba per puse)

// Pridedam efektus
var rippleEffect = ellipseLayer.Effects.addProperty("Ripple");
rippleEffect.property("Radius").expression = '''amplitude = thisComp.layer("Bass Amplitude").effect("Both Channels")("Slider");linear(amplitude, 30, 70, 0, 100);''';
rippleEffect.property("Type of Conversion").setValue(2); // Symmetric
rippleEffect.property("Wave Speed").setValue([10]);
rippleEffect.property("Wave Width").setValue([30]);
rippleEffect.property("Wave Height").setValue([30]);

var glowEffect = ellipseLayer.Effects.addProperty("ADBE Glo2");
glowEffect.property("Glow Radius").expression = '''thisComp.layer("Controllers").effect("Glow Effect Radius")("Slider")''';
glowEffect.property("Glow Intensity").expression = '''thisComp.layer("Controllers").effect("Glow Effect Intensity")("Slider")''';

var turbulentDisplaceEffect = ellipseLayer.Effects.addProperty("ADBE Turbulent Displace");
turbulentDisplaceEffect.property("Amount").expression = '''amplitude = thisComp.layer("Bass Amplitude").effect("Both Channels")("Slider");
min = 0;
max = 60;
factor = Math.abs(Math.sin(time * 2 * Math.PI * (amplitude / 100))); 
amount = min + (factor * (max - min));
amount''';
turbulentDisplaceEffect.property("Size").expression = '''amplitude = thisComp.layer("Bass Amplitude").effect("Both Channels")("Slider");linear(amplitude, 0, 200, 0, 100);''';
turbulentDisplaceEffect.property("Complexity").expression = '''amplitude = thisComp.layer("Bass Amplitude").effect("Both Channels")("Slider");linear(amplitude, 0, 50, 0, 5);''';

// Prisegam apskritimo sluoksnio dydi prie bendro kontrolerio
ellipseLayer.Transform.property("Scale").expression = '''temp = thisComp.layer("Controllers").effect("Visible Objects Scale")("Slider");[temp, temp]'''; // Pick Whip

//Uzdedam matomumo transformacija pagal Ripple efekto stipruma
ellipseLayer.Transform.property("Opacity").expression = '''radiusAmount = thisLayer.effect("Ripple")("Radius");
fadeInSize = 20;
maxSize = 100;
opacity = linear(radiusAmount, fadeInSize, maxSize, 80, 100);''';

//Perstumiam kontroleri i virsu
controllerLayer.moveToBeginning();

//Nurodom Audio Spectrum sluoksniams, kur yra muzikos failas
specialSpectrumLayer.Effects.property("Audio Spectrum").property("Audio Layer").setValue(10);
bassLayer.Effects.property("Audio Spectrum").property("Audio Layer").setValue(10);
midLayer.Effects.property("Audio Spectrum").property("Audio Layer").setValue(10);
trebleLayer.Effects.property("Audio Spectrum").property("Audio Layer").setValue(10);

//Nuimam visus zymejimus, pazymim Controllers sluoksni ir pazymim, kad rodytu pacius kontrolerius
app.executeCommand(2004);
controllerLayer.selected = true;
app.executeCommand(2163);

alert("Audio Visualisation setup complete!");