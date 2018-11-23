/* fromage server */
var params = require('./params.js');
var tools = require('./classes/tools.js');
var rogue = require('./classes/rogue.js');
var admin = require('./classes/admin.js');

var sha256 = require('js-sha256');
var Filter = require('bad-words');
var express = require('express');
var app = express();
var fs = require('fs');

var filemap = null;
var levels = [];

var wss;
var WebSocketServer = require('ws').Server;

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







var myFilter = new Filter({
    placeHolder: 'x'
});
var data_example = rogue.data_example;





/* END OF SETUP */


var bibles = require('./classes/bibles.js');
bibles.init();



/* cd line args */
function flush() {
    var empty = JSON.stringify(rogue.data_example);
    var flushsessionquery = "UPDATE players SET data = ? ";
    if (wss && wss.clients) {
        wss.clients.forEach(function each(client) {
            client.data = rogue.data_example;
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

function startServer(mapData) {

    report('Lancement serveur port ' + port + '------------------------------------------------------');

    var levels = JSON.parse(mapData);


    wss = new WebSocketServer({
        server: httpsServer,
        verifyClient: function (info, callback) { /* AUTHENTIFICATION */
            var urlinfo = info.req.url;
            const ip = info.req.connection.remoteAddress;
            urlinfo = urlinfo.replace('/', '');
            urlinfo = urlinfo.split('-');
            if (!Array.isArray(urlinfo)) {
                callback(false);
            }
            var regex = /^([a-zA-Z0-9_-]+)$/;
            var name = urlinfo[1].toLowerCase();
            var token = urlinfo[0];

            if (name.length > 10) {
                callback(false);
            }

            if (name !== myFilter.clean(name)) {
                callback(false);
            }
            if (!regex.test(name)) {
                callback(false);
            }
            if (!regex.test(token)) {
                callback(false);
            }
            if (!name || !token || !urlinfo[1] || !urlinfo[0]) {
                callback(false);
            }
            if (urlinfo[1].toLowerCase() !== name || urlinfo[0] !== token) {
                report('illegal name');
                callback(false);
            }
            wss.clients.forEach(function each(client) {
                if (client.name === name) {
                    callback(false);
                }
            });
            var token = sha256(token);
            connection.query('SELECT id,name,password FROM players WHERE name=?', [name], function (err, rows, fields) {
                if (rows[0] && rows[0].id) {
                    if (rows[0].password === token) {
                        userRequestMap.set(info.req, rows[0]);
                        callback(true);
                    } else {
                        report(name + ' rejected');
                        callback(false);
                    }
                } else {
                    var dataclone = JSON.parse(JSON.stringify(data_example));
                    var data = JSON.stringify(dataclone);
                    connection.query('INSERT INTO players(name,password,data) VALUES (?,?,?)', [name, token, data], function (err) {
                        if (err)
                            report(err);
                        else {
                            report(' - New PLayer Creation : ' + name);
                            var uzar = {
                                'name': name,
                                'password': token,
                                'id': 'new'
                            };
                            userRequestMap.set(info.req, uzar);
                            callback(true);
                        }
                    });
                }
            });
        }
    });


    wss.broadcast = function broadcast(msg) {
        wss.clients.forEach(function each(client) {
            client.send(msg);
        });
    };



    function getOneClient(name) {
        var clientFound = null;
        wss.clients.forEach(function each(client) {
            if (client.name.toString() === name.toString()) {
                clientFound = client;
                return client;
            }
        });
        return clientFound;
    }


    wss.masssave = function masssave(callback = null) {
        var itemsProcessed = 0;
        wss.clients.forEach(function each(client) {
            itemsProcessed++;
            client.save();
            if (itemsProcessed === wss.clients.size && callback) {
                setTimeout(callback, 100);
            }
        });
    };


    tick();
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
                    'bibles': bibles
                }));
                rogue.updateMyPosition(ws, wss);
            });
        } catch (e) {
            report(e);
        }




        ws.save = function save(callback) {
            connection.query('UPDATE players SET data=? WHERE name= ?', [JSON.stringify(ws.data), ws.name], function (err, rows, fields) {
                if (err)
                    report(err);
                if (callback) {
                    callback();
                }
            });
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
                        ws.send(JSON.stringify({
                            'moved': [ws.data.x, ws.data.y]
                        }));
                        rogue.updateMyPosition(ws, wss);
                        ws.setMoveCool(params.granu);
                    } else {
                        if (!ws.data.pk) {
                            ws.notice('You bump into ' + someone.name);
                        } else {

                        }
                        // console.log('bump into ' + someone.name);
                    }
                } else {
                    //2quick
                }
            }

            /* power use by player with a key */
            if (json.cd === 'key' && json.v ) {
                rogue.powerUse(wss, ws, json.v,json.dir);
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



    // tick();




}
if (regularStart)
    loadMap();


function erreur(ws, what) {
    try {
        report('ERREUR : ' + ws.name + ':' + what);
        ws.close();
    } catch (e) {
        report(e);
    }
}
const userRequestMap = new WeakMap();




/* tick operations */
var tic = 0;
var save_clock = 0;
var save_freq = 0;


function tick() {
    tic++;
    /* SERVER TICK */



    /* PLAYER TICK */

    wss.clients.forEach(function each(client) {
        
        try {

            if(client.data.powers_cooldowns){
                Object.keys(client.data.powers_cooldowns).forEach(function (key){
                    if(client.data.powers_cooldowns[key]>0)
                    client.data.powers_cooldowns[key]--;
                   
                });
            }



        } catch (e) {
            report(e);
        }




    });
    if (!wss.clients.size) {
       
    }


    save_clock++;

    if (save_clock === save_freq) {
        wss.masssave();
        save_clock = 0;
    }

    var mytick = setTimeout(function () {
        tick();
    }, tickrate);
}
