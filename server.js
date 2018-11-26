/* fromage server */
var params = require('./params.js');
var tools = require('./classes/tools.js');
var rogue = require('./classes/rogue.js');
var admin = require('./classes/admin.js');
var data_lib = require('./classes/data_example.js');


var express = require('express');
var app = express();
var fs = require('fs');

var levels = [];

var wss;
var WebSocketServer = require('./classes/wssx.js');

var mapSize = 64;
var tickrate = 100;


tools.setup();

var port = params.port_prod;

var regularStart = true;



/* mysql */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: params.host,
    user: params.user,
    password: params.password,
    database: params.database
});
connection.connect();
tools.connection = connection;

process.argv.forEach(function (val, index, array) {
    if (val === '-flush') { //flush all sessions
        flush();
    }
    if (val === '-mapgen') { //flush all sessions
        regularStart = false;
        levels.push(tools.matrix(mapSize, mapSize));
        tools.saveFile('map.cio', JSON.stringify(levels), loadMap);
        report('Level 0 generated');
    }
    if (val === '-dev') { //flush all sessions
        params.dev = true;
        port = params.port_dev;
    }
});
/* server https or not */
if (params.httpsenabled) {
    const https = require("https");
    const options = {
        key: fs.readFileSync(params.key),
        cert: fs.readFileSync(params.cert)
    };
    var credentials = {
        key: options.key,
        cert: options.cert
    };
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(port);
} else {
    http = require('http');
    var httpsServer = http.createServer();
    httpsServer.listen(port);
}







var data_example = data_lib.data_example;

if (!data_example) {
    console.log('no data example');
    process.exit();
}

const userRequestMap = new WeakMap();


/* END OF SETUP */

var bibles = require('./classes/bibles.js');
bibles.init(tools);



/* cd line args */
function flush() {
    var empty = JSON.stringify(data_lib.data_example);
    var flushsessionquery = "UPDATE players SET data = ? ";
    if (wss && wss.clients) {
        wss.clients.forEach(function each(client) {
            client.data = data_lib.data_example;
        });
    }

    connection.query(flushsessionquery, [empty], function (err, rows, fields) {
        report('sessions FLUSHED!');
    });
}

function report(e) {

    tools.report(e);
}

function quit() {
    process.exit();
}


var stdin = process.openStdin();

stdin.addListener("data", function (d) {
    try {
        var cde = d.toString().trim();
        var com = cde.split(":");
        var cde = com[0];
        var arg = com[1];
        var arg2 = com[2];
        var arg3 = com[3];
        console.log("cd received: [" +
            cde + "]");
        if (arg) {
            console.log("arg : [" + arg + ']');
        }
        if (cde === 'flush') {
            flush();
        }
        if (cde === 'clients') {
            wss.clients.forEach(function each(client) {
                if (client.data)
                    console.log(client.data.name + ":" + client.data.init);
                else {
                    console.log('unknown client!');
                }
            });
        }
        if (cde === 'data' && arg) {
            wss.clients.forEach(function each(client) {
                if (client.data && client.name === arg)
                    console.log(client.data);
            });
        }
        if (cde === 'save') {
            wss.masssave();
        }

        if (cde === 'quit') {
            wss.masssave(quit);
        }
    } catch (e) {
        report(e);
    }
});





function loadMap() {
    console.log('Loading map ..');
    filemap = tools.loadFile('map.cio', startServer);
}

var mapAoE = [];
mapAoE.push(tools.matrix(mapSize, mapSize, []));


function startServer(mapData) {

    report('Lancement serveur port ' + port + '------------------------------------------------------');

    var levels = JSON.parse(mapData);


    wss = new WebSocketServer({
        server: httpsServer,
        verifyClient: function(info,callback){
            wss.verify(info,callback,connection,userRequestMap);
        }
    });







    wss.on('connection', function myconnection(ws, request) {
       

        try {
            /* recognize authentified player */
            var userinfo = userRequestMap.get(request);
            var name = userinfo.name.replace(/\W/g, '');
            var token = userinfo.password.replace(/\W/g, '');
            var id = userinfo.id;
            report(name + ' connected with id ' + id);
            connection.query('SELECT id,name,data FROM players WHERE name=? AND password=?', [name, token], function (err, rows, fields) {
                if (err)
                    report(err);
                var data = JSON.parse(rows[0].data);            

                ws.name = name;
                ws.id = rows[0].id;
                ws.data = data;
                ws.data.name = name;
                ws.data.id = rows[0].id;
                ws.send(JSON.stringify({
                    'startgame': 1,
                    'level': levels[ws.data.z],
                    'mydata': ws.data,
                    'granu': params.granu,
                    'people': rogue.getPeopleInZ(ws.data.z, wss, ws),
                    //  'bibles': bibles
                }));
                rogue.updateMyPosition(ws, wss);
            });
        } catch (e) {
            report(e);
        }




        ws.save = function save(callback) {
            try {
                connection.query('UPDATE players SET data=? WHERE name= ?', [JSON.stringify(ws.data), ws.name], function (err, rows, fields) {
                    if (err)
                        report(err);
                    if (callback) {
                        callback();
                    }
                });
            } catch (e) {
                report(e);
            }
        };

        ws.notice = function notice(n) {
            ws.send(JSON.stringify({
                'notice': n
            }));
        };

        ws.reset = function () {
            ws.data = JSON.parse(JSON.stringify(data_example));
            ws.save();
            ws.send(JSON.stringify({
                'reset': 1
            }));
        };

        ws.setMoveCool = function (cool) {
            clearTimeout(ws.data.currentCool);
            ws.data.movecooling = true;
            var that = ws;
            ws.data.currentCool = setTimeout(function () {
                that.data.movecooling = false;
            }, cool);
        };

        /*read messages from the client */
        ws.on('message', function incoming(message) {

            rogue.wss = wss;
            rogue.bibles = bibles;
            rogue.tools = tools;
            rogue.mapAoE = mapAoE;

            var now = Date.now();
            var last = ws.data.time;
            var diff = now - ws.data.security.last;
            if (diff > params.antiFloodDelay) {
                ws.data.security.floods++;
            }
            ws.data.security.last = now;


            var json = JSON.parse(message);
            if (json.cd === 'reset') {
                ws.reset();
            }

            if (!json.move) console.log(ws.name + ' : ' + message);
            /* all the recevied cds from client */

            if (json.move) {
                /* is move illegal */
                if (!ws.data.movecooling) {
                    var x = json.move[0];
                    var y = json.move[1];
                    var someone = rogue.whoIsThere(ws, wss, x, y, ws.data.z);
                    if (!someone) {
                        ws.data.x = x;
                        ws.data.y = y;
                        rogue.updateMyPosition(ws, wss);
                        ws.setMoveCool(params.granu);
                    } else {
                        if (!ws.data.pk) {
                            ws.notice('You bump into ' + someone.name);
                        } else {

                        }
                    }
                } else {
                    console.log("2quick");
                }
            }

            /* power use by player with a key */
            if (json.cd === 'key' && json.v) {
                rogue.powerUse(ws, json.v, json.dir, mapAoE);
            }



            if (json.cd === "say") {
                if (json.v.indexOf("/") === 0) {
                    var com = json.v.split(" ");
                    if (com[0] === '/skin') {
                        ws.data.skin = com[1];
                        //     ws.send(JSON.stringify({'mydata': ws.data,'rskin': ws.data.skin}));
                        rogue.updateMyPosition(ws, wss);
                    }
                    console.log('--adm cd :  ' + com[0] + ' ' + com[1]);
                } else {
                    var saydata = JSON.stringify({
                        'who': ws.name,
                        'chat': json.v
                    });
                    report(saydata);
                    wss.broadcast(saydata);
                }

            }

            /* pkmode toggle */
            if (json.cd === "pkm") {
                if (ws.data.pk === true) {
                    ws.data.pk = false;
                } else {
                    ws.data.pk = true;
                }
                rogue.updateMyPosition(ws, wss);
            }

        });







        ws.on('close', function (message) {
            report(ws.name + ' is closing');
            wss.broadcast(JSON.stringify({
                'gone': ws.name
            }));
            ws.save(null);
            wss.clients.delete(ws);
        });
    });



    tick();




}
if (regularStart)
    loadMap();






/* tick operations */
var tic = 0;
var save_clock = 0;
var save_freq = 0;


function tick() {
    tic++;
    /* SERVER TICK */





    /* PLAYER TICK */

    var preparedTickUpdate = []; /// there's one by level
    var preparedPuds = [];
    wss.clients.forEach(function each(client) {

        try {

            /* prepare the level tick update json array */
            if (!preparedTickUpdate[client.data.z]) {
                preparedTickUpdate[client.data.z] = [];
            }

            /* player cooldowns powers */
            if (client.data.powers_cooldowns) {
                Object.keys(client.data.powers_cooldowns).forEach(function (key) {
                    if (client.data.powers_cooldowns[key] > 0)
                        client.data.powers_cooldowns[key]--;
                });
            }

            /* is player touched by AeO */
            var x = client.data.x;
            var y = client.data.y;
            var z = client.data.z;
            if (mapAoE[z][x][y].length) {
                var fxs = mapAoE[z][x][y];
                for (i = 0; i < fxs.length; i++) {
                    /* touché */
                    if (fxs[i].owner != client.id) {

                        var damage = fxs[i].damage;
                        var defenses = rogue.getDefenses(client);
                        var appliedDamage = rogue.getAppliedDamage(damage, defenses);
                        client.data.life.now -= appliedDamage;
                        console.log(client.name + ' is touched by ' + fxs[i].power + ' and takes ' + appliedDamage + ' damage');
                        console.log(client.data.life.now + '/' + client.data.life.max + ' life remaing');
                        var json = {
                            'damage': {
                                pid: client.id,
                                damage: appliedDamage,
                                owner: fxs[i].owner
                            }
                        }
                        preparedTickUpdate[client.data.z].push(json);
                        preparedPuds.push(pudjson);
                    }
                }
            }


        } catch (e) {
            report(e);
        }




    });

    for (z = 0; z < preparedTickUpdate.length; z++) {
        if (preparedTickUpdate[z].length) {
            wss.broadcast(JSON.stringify({
                'tic': preparedTickUpdate[z]
            }));
        }
    }


    if (!wss.clients.size) {

    }


    var timeos = Date.now();
    /* AeO cools */
    for (z = 0; z < mapAoE.length; z++) {
        for (x = 0; x < mapAoE[z].length; x++) {
            for (y = 0; y < mapAoE[z][x].length; y++) {
                for (i = 0; i < mapAoE[z][x][y].length; i++) {
                    if (mapAoE[z][x][y][i]) {
                        //    console.log('effect active on : ' + mapAoE[z][x][y][i].power + ' on ' + z + ',' + y + ',' + x);
                        mapAoE[z][x][y][i].cooldown--;
                        if (mapAoE[z][x][y][i].cooldown <= 0) {
                            //console.log('Delete effect : ' + mapAoE[z][x][y][i].power + ' on ' + z + ',' + y + ',' + x);
                            mapAoE[z][x][y].splice(i, 1);
                        }
                    }
                }
            }
        }
    }
    var timeos2 = Date.now();
    var diff = timeos2 - timeos;
    // console.log('calcul' + diff);



    save_clock++;

    if (save_clock === save_freq) {
        wss.masssave();
        save_clock = 0;
    }

    var mytick = setTimeout(function () {
        tick();
    }, tickrate);
}