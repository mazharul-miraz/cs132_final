(function(){
var decreaseCutoff = 200.0;
var increaseCutoff = 200.0;
var minColor = 30;
var fireRadius = 10;
var selectedFire = -1;
var fires = new Array();

//get request from server to get speaker data and map image

fires.push({"id" : "FIRE0", "x" : 120, "y" : 170, "radius" : 40, "needsFed" : 0});
fires.push({"id" : "FIRE1", "x" : 150, "y" : 180, "radius" : 40, "needsFed" : 200});
fires.push({"id" : "FIRE2", "x" : 150, "y" : 250, "radius" : 40, "needsFed" : 150});
fires.push({"id" : "FIRE3", "x" : 180, "y" : 200, "radius" : 40, "needsFed" : 100});
fires.push({"id" : "FIRES4", "x" : 115, "y" : 230, "radius" : 40, "needsFed" : 50});

var map = document.getElementById("map");
document.getElementById("mappane").style.backgroundImage = "url(map.png)";
for (var i = 0; i < fires.length; i++){
	var fire = fires[i];
	var newfire = document.createElement('div');
	fire["element"] = newfire;
	newfire.id = fire.id;
	newfire.className = "fire"
	newfire.style.position = "absolute";
	newfire.style.left = fire.x + "px";
	newfire.style.top = fire.y + "px";
	newfire.style.width = fireRadius*2 + "px";
	newfire.style.height = fireRadius*2 + "px";
	newfire.style.backgroundColor = getColorFromFeedback(fire.needsFed);
	//closure to make this work properly
	(function (_fire) {
		_fire["element"].addEventListener('click', function(){
			console.log("clicked");
			var infopane = document.getElementById("fireInfoPane");
			infopane.innerHTML = "<h3>Fire Information for:</h3>"
			infopane.innerHTML += "<p>ID: " + _fire.id + "</p>";
			infopane.innerHTML += "<p>Needs Fed: " + _fire.needsFed + "</p>";
			infopane.innerHTML += "<p>Radius: " + _fire.radius + "</p>";
			selectedFire = _fire.id;
			var button = document.createElement("button");
			button.innerHTML = "Reset Data";
			(function (_button) {
				button.addEventListener('click', function(){
					resetData();
				});
			})(button);
			infopane.appendChild(button);
		});
	})(fire);
	map.appendChild(newfire);
}

function resetData(){
	console.log(selectedSpeaker);
	//send message to server to reset data for the selected speaker.
	//only remove the amount that the speaker has in the front-end, anything new on the server should remain.
}

function getColorFromFeedback(amount){
	//need to decrease, meaning negative amount
	var red = 255-amount;
	if(red<25){
		red = 25;
	}
	
	//need to increase, meaning positive amount
	var blue = amount/2;
	if(blue>255){
		blue = 255;
	}
	//neutral
	var green = amount/2;
	if(green>255){
		green = 255;
	}
	var redString = red.toString(16);
	var blueString = blue.toString(16);
	var greenString = green.toString(16);
	if (redString.length == 1){
		redString = "0" + redString;
	}
	if (blueString.length == 1){
		blueString = "0" + blueString;
	}
	if (greenString.length == 1){
		greenString = "0" + greenString;
	}
		
	return "#" + redString + greenString + blueString;
}

function clearFeedback(){
	//sends a message to the server to clear the feedback for this speaker
	updateData();
}

function updateData(){
	//pull the most recent feedback data from the server
	//update the information for each speaker
}

function findFire(id){
	for (var i = 0; i < firess.length; i++){
		if (fires[i].id === id){
			return fires[i];
		}
	}
	return null;
}
})();