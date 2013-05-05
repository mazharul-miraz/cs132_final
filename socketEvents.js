var cookie = require('cookie');
var connect = require('connect');
var models = require('./models.js');

//used to count number of updates for volume and fire, only update every 5 updates.
var firecount = 0;
var volumecount = 0;

module.exports = function(io)
{
    // Authorize web socket from session id
    io.set('authorization', function (handshakeData, accept)
    {
        if (handshakeData.headers.cookie)
        {
            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
            handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');

            if (handshakeData.cookie['express.sid'] == handshakeData.sessionID)
            {
                return accept('Cookie is invalid.', false);
            }
        }
        else
        {
            return accept('No cookie transmitted.', false);
        }

        accept(null, true);
    });

    // bind events to socket
    io.sockets.on('connection', function (client)
    {

        function sendData(tech)
        {
            var speakers;
            var fires;
            models.Speaker.findAll().success(function(s) {
                speakers = s;
                models.Fire.findAll().success(function(f) {
                    fires = f;
                    var data = {'speakers' : speakers, 'fires' : fires};
                    tech.emit('data', data);
                });
            });
        }

	function sendDataToAllTechs()
        {
            var speakers;
            var fires;
            models.Speaker.findAll().success(function(s) {
                speakers = s;
                models.Fire.findAll().success(function(f) {
                    fires = f;
                    var data = {'speakers' : speakers, 'fires' : fires};
                    io.sockets.in("techClients").emit('data', data);
                });
            });
        }

        client.on("techConnect", function()
        {
            client.join("techClients");
        });

        //tech socket events
        client.on('updateTechData', function ()
        {
            sendData(client);
        });

        client.on('resetSpeakerData', function(speaker){
            models.Speaker.find(speaker.id).success(function(s) {
                s.updateAttributes({
                  volumeUp: 0,
                  volumeDown: 0
                }).success(function() {
                 sendData(client)
                   });
            })
        });

        client.on('resetFireData', function(fire){
            models.Fire.find(fire.id).success(function(f) {
                f.updateAttributes({
                  needsFed: 0
                }).success(function() {
                sendData(client)
                   });
            })
        });

        client.on('newSpeaker', function(lat, lng){
            models.Speaker.create({"latitude" : lat, "longitude" : lng, "volumeUp" : 100, "volumeDown" : 0}).success(function(){
                sendData(client);
            });
        });

        client.on('newFire', function(lat, lng){
            models.Fire.create({"latitude" : lat, "longitude" : lng, "needsFed" : 50}).success(function(){
                sendData(client);
            });
        });

        client.on('removeSpeaker', function(speaker){
            models.Speaker.find(speaker.id).success(function(s){if (s) {s.destroy(); sendData(client);}});
        });

        client.on('removeFire', function(fire){
            models.Fire.find(fire.id).success(function(f){if (f) {f.destroy(); sendData(client);}});
        });


        // Event to run user first connects
        client.on('connected', function (name, fn)
        {
            console.log(client.id);
            // TODO get song info from database
        });

        // Event to run when feed fire button is clicked
        client.on('feedFire', function (msg, fn)
        {
            var obj = JSON.parse(msg);
            console.log(obj);

            // TODO need to first check if user with session ID already exists
            models.Location.create({client_id:client.id,longitude:obj.coords.longitude,latitude:obj.coords.latitude}).success(function(location)
            {
		models.Fire.findAll().success(function(fires){
			var closest = 0.001;
			var closestFire = null;

			for (var i = 0; i < fires.length; i++){
				var fire = fires[i];
				var dist = Math.sqrt((location.latitude - fire.latitude)*(location.latitude - fire.latitude) + (location.longitude - fire.longitude)*(location.longitude - fire.longitude));
				if (dist < closest){
					closest = dist;
					closestFire = fire;
				}
			}
			if (closestFire){
				models.Fire.find(closestFire.id).success(function(f) {
					var feds = f.needsFed;
					f.updateAttributes({
					  needsFed: feds + 1
					}).success(function() {
						firecount++;
						if (firecount > 4){
							sendDataToAllTechs();
							firecount = 0;
						}
						models.FeedFire.create({feed:true,LocationId:location.id}).success(function(feedFire){
							fn(true);
						});
					  });
				    });
			}
		});
            });
        });

        // Event to run when volume slider is slid and stays still for certain number of seconds
        client.on('volume', function (msg, fn)
        {
	    var obj = JSON.parse(msg);
            console.log(obj);

            // TODO need to first check if user with session ID already exists
            models.Location.create({client_id:client.id,longitude:obj.coords.longitude,latitude:obj.coords.latitude}).success(function(location)
            {
		models.Speaker.findAll().success(function(speakers){
			var closest = 0.001;
			var closestSpeaker = null;

			for (var i = 0; i < speakers.length; i++){
				var speaker = speakers[i];
				var dist = Math.sqrt((location.latitude - speaker.latitude)*(location.latitude - speaker.latitude) + (location.longitude - speaker.longitude)*(location.longitude - speaker.longitude));
				if (dist < closest){
					closest = dist;
					closestSpeaker = speaker;
				}
			}
			if (closestSpeaker){
				models.Speaker.find(closestSpeaker.id).success(function(f) {
					var up = f.volumeUp;
					var down = f.volumeDown;
					if (obj.dir > 0){
						up = up + 1;
					}
					if (obj.dir < 0){
						down = down + 1;
					}
					f.updateAttributes({
					  volumeUp: up,
					  volumeDown: down
					}).success(function() {
						volumecount++;
						if (volumecount > 4){
							sendDataToAllTechs();
							volumecount = 0;
						}
						models.Volume.create({dir:obj.dir, LocationId:location.id}).success(function(volume)
						{
						    fn(true);
						});
					  });
				    });
			}
		});
            });

        });
    });
};
