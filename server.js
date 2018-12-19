/* fromage server */
console.log(' --- go --- ');
var params = require('./params.js');
var tools = require('./classes/tools.js');
var rogue = require('./classes/rogue.js');
var express = require('express');
var app = express();
var fs = require('fs');
var spawners = [];
var wss;
var WebSocketServer = require('./classes/wssx.js');
var mapSize = rogue.mapSize;
var tickrate = 200;
tools.setup();
var port = params.port_prod;
var regularStart = true;
var data_example = null;
const userRequestMap = new WeakMap();
var mobs = [];
var occupiedOriginal = [];
for (oc = 0; oc < 64; oc++) {
    occupiedOriginal.push(tools.matrix(mapSize, mapSize,0,true));
}



var ticdiff;
var bibles = {};
var myglobals = {};
var shapesData;
var debug;

Array.prototype.rotate = (function () {
    var unshift = Array.prototype.unshift,
        splice = Array.prototype.splice;

    return function (count) {
        var len = this.length >>> 0,
            count = count >> 0;

        unshift.apply(this, splice.call(this, count % len, len));
        return this;
    };
})();

/* mysql */

var mysql = require('mysql');
var db_config = {
    host: params.host,
    user: params.user,
    password: params.password,
    database: params.database
};




function handleDisconnect() {
    connection = mysql.createConnection(db_config);

    connection.connect(function (err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            report('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        } else {
            tools.connection = connection;
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        report('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        } else { // connnection idle timeout (the wait_timeout
            throw err; // server variable configures this)
        }
    });
}

handleDisconnect();














/* ARGS  */
var flushAtStart = null;
process.argv.forEach(function (val, index, array) {
    if (val === '-flush') {
        flushAtStart = true;
    }

    if (val === '-dev') {
        params.dev = true;
        port = params.port_dev;
    }
    if (val === '-regen') {
        //   regen();
    }
});
/*
function regen() {
    levels.push(tools.matrix(mapSize, mapSize));
    tools.saveFile('map.json', JSON.stringify(levels));
}

*/


/* HTTPS (OR NOT) */
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



function flush() {

    if (!data_example) {
        console.log('model data_example missing');
        process.exit();
    }
    var flushsessionquery = "UPDATE players SET data = ? ";
    if (wss && wss.clients) {
        wss.clients.forEach(function each(client) {
            client.data = data_example;
        });
    }
    empty = JSON.stringify(data_example);

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

/* COMMANDS LISTENER */
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
            console.log(wss.clients.size + ' clients');
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

        if (cde === 'tic') {
            console.log(ticdiff + ' ms');
        }


    } catch (e) {
        report(e);
    }
});


/* SETUP STEPS */
if (regularStart) setup();




function setup() {

    tools.loadFile('mobs.json', "mobsBible");
    tools.loadFile('powers.json', 'powersBible');
    tools.loadFile('spawners.json', "spawnersData");
    tools.loadFile('shapes.json', "shapesData");
    tools.loadFile('player_model.json', "data_example");
    tools.loadFile('lootbible.json', "lootBible");
    tools.loadFile('item_model.json', "item_example");
    /*
        tools.loadFile('map.json', "mapData");
        tools.loadFile('wallz.json', "wallzData");
    */
    for (ll = 0; ll < rogue.mapSize; ll++) {
        tools.loadFile('levels/level0.json', "level" + ll);

    }



    setTimeout(function () {
        console.log('JSON Files Loaded');
        startServer();
    }, 2000);

}

var mapAoE = [];
var mapAoEList = [];
var DelayAoE = [];
var items = [];
var interacs = [];

rogue.itemsInWorld = [];

for (livels = 0; livels < rogue.mapSize; livels++) {
    mapAoE.push(tools.matrix(mapSize, mapSize, []));
    rogue.itemsInWorld.push({});
    interacs.push({
        'in': [5, 5],
        'out': [60, 60]
    });
}


/* END OF SETUP */








function startServer() {
    var data = tools.data;
    bibles.mobs = JSON.parse(data.mobsBible);
    bibles.powers = JSON.parse(data.powersBible);
    spawners = JSON.parse(data.spawnersData);
    data_example = JSON.parse(data.data_example);
    tools.shapes = JSON.parse(data.shapesData);
    bibles.loot = JSON.parse(data.lootBible);
    rogue.item_example = JSON.parse(data.item_example);
    rogue.bibles = bibles;

    /* WALLZ BUILDUING */

    var level0 = JSON.parse(data.level0);

    rogue.wallz = tools.matrix(64, 0);
    rogue.tickrate = tickrate;
    rogue.mobs = mobs;


    level0.layers.forEach(function each(layer) {
        var levelRawData = layer.data;
        var formatedData = tools.reformatJsonFromTiledSoftware(levelRawData);
        if (!formatedData) {
            console.log('Layer Data Missing');
            process.exit();
        }
        if (layer.name == "floor") {
            tools.saveFile('formatedLevels/level0_floor.json', JSON.stringify(formatedData));
        }
        if (layer.name == "wall") {
            tools.saveFile('formatedLevels/level0_wallz.json', JSON.stringify(formatedData));

            var newArray = formatedData[0].map(function (col, i) {
                return formatedData.map(function (row) {
                    return row[i];
                });
            });


            rogue.wallz[0] = newArray;
        }
    });















    console.log(spawners.length + ' spawners in the map, ' + rogue.wallz.length + ' wall levels');
    if (!spawners || !rogue.wallz.length) {
        console.log('setup failed');
        process.exit();
    }

    if (flushAtStart) {
        flush();
    }

    report('- - - - Lancement serveur port ' + port);


    rogue.wss = wss = new WebSocketServer({
        server: httpsServer,
        verifyClient: function (info, callback) {
            wss.verify(info, callback, connection, userRequestMap, data_example);
        }
    });
    wss.subinit();

    rogue.bibles = bibles;
    rogue.tools = tools;
    rogue.DelayAoE = DelayAoE;
    rogue.mapAoE = mapAoE;



    wss.on('connection', function myconnection(ws, request) {

        try {

            if (!rogue.wallz.length) {
                console.log('conare');
                process.exit();
            }

            /* recognize authentified player */
            var userinfo = userRequestMap.get(request);
            var name = userinfo.name.replace(/\W/g, '');
            var token = userinfo.password.replace(/\W/g, '');
            var id = userinfo.id;









            connection.query('SELECT id,name,data FROM players WHERE name=? AND password=?', [name, token], function (err, rows, fields) {
                if (err)
                    report(err);
                var data = JSON.parse(rows[0].data);
                ws.name = name;
                ws.id = rows[0].id;
                ws.data = data;
                ws.data.name = name;
                ws.data.id = rows[0].id;

                report(name + ' connected with id ' + ws.id);

                var thatId = ws.id;


                /* free items */
                if (ws.data.new) {
                    items.push(rogue.createItem('gant', [0, 10, 10]));
                    var item2Equip = items.push(rogue.createItem('gant', null, [thatId, null]));
                    rogue.equipItem(ws, item2Equip, 6);

                    items.push(rogue.createItem('bob_ricard', null, [thatId, null]));
                    items.push(rogue.createItem('slip_de_tete', null, [thatId, null]));
                    ws.data.new = false;
                }

                var msgS = {
                    'startgame': 1,
                    'mydata': ws.data,
                    'granu': params.granu,
                    'people': rogue.getPeopleInZ(ws.data.z, wss, ws),
                    'mobs': rogue.getMobsInZ(ws.data.z, mobs),
                    'itemsInWorld': rogue.itemsInWorld[ws.data.z],
                    'myItems': ws.data.inv,
                    'myPowers': ws.data.powers_equiped,
                    'ticrate': tickrate,
                    'inter': interacs[ws.data.z],
                    //  'bibles': bibles
                };
                if (ws.data.isdead) msgS.isdead = ws.data.isdead;

                ws.send(JSON.stringify(msgS));
                rogue.updateMyPosition(ws);




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
            try {
                ws.send(JSON.stringify({
                    'notice': n
                }));
            } catch (e) {
                report(e);
            }
        };

        ws.reset = function () {
            ws.data = JSON.parse(JSON.stringify(data_example));
            ws.save();

        };

        ws.setMoveCool = function (cool, holdingPower = false) {
            clearTimeout(ws.data.currentCool);
            ws.data.movecooling = true;
            var that = ws;
            ws.data.currentCool = setTimeout(function () {
                that.data.movecooling = false;
                if (that.data.holdingPower) {
                    rogue.powerUse(that, that.data.holdingPower.power, that.data.holdingPower.aim, DelayAoE, mapAoE, true);
                }
            }, cool);
        };

        /*read messages from the client */
        ws.on('message', function incoming(message) {
            try {


                var now = Date.now();
                var last = ws.data.time;

                /* security flood monitor */
                var diff = now - ws.data.security.last;
                if (diff > params.antiFloodDelay) {
                    ws.data.security.floods++;
                }
                ws.data.security.last = now;

                var json = JSON.parse(message);
                if (!json.move && !json.cd) console.log(ws.name + ' : ' + message);


                if (json.startlevel) {
                    ws.send(JSON.stringify({
                        'startgame': 1,
                        'mydata': ws.data,
                        'granu': params.granu,
                        'people': rogue.getPeopleInZ(ws.data.z, wss, ws),
                        'mobs': rogue.getMobsInZ(ws.data.z, mobs),
                        'itemsInWorld': rogue.itemsInWorld[ws.data.z],
                        'myItems': ws.data.inv,
                        'myPowers': ws.data.powers_equiped,
                        'ticrate': tickrate
                        //  'bibles': bibles
                    }));
                }


                if (json.rez) {
                    console.log(ws.name + ' ressurecting ...');
                    ws.data.skin = 1;
                    ws.data.isdead = null;
                    ws.data.life.now = ws.data.life.max;
                    ws.data.x = 2;
                    ws.data.y = 2;
                    ws.data.z = 0;
                    ws.send(JSON.stringify({
                        'reset': 1,
                    }));
                }

                /* Commande From Clients */
                if (json.cd === "say") {




                    if (json.v.indexOf("/") === 0) {
                        var com = json.v.split(" ");
                        if (com[0] === '/skin' && com[1]) {
                            ws.data.skin = com[1];
                            rogue.updateMyPosition(ws);
                        }
                        console.log('--adm cd :  ' + com[0] + ' ' + com[1]);
                    } else {
                        try {
                            var saydata = JSON.stringify({
                                'who': ws.name,
                                'chat': json.v
                            });
                            report(saydata);
                            wss.broadcast(saydata);
                        } catch (e) {
                            report(e);
                        }

                    }

                }

                /* Dead = null */
                if (ws.data.isdead) {
                    return null;
                }

                if (json.cd === 'reset') {
                    ws.reset();
                }


                if (json.move) {
                    if (!ws.data.movecooling) {
                        var x = parseInt(json.move[0]);
                        var y = parseInt(json.move[1]);
                        if (x < 0 || y < 0 || x > mapSize || y > mapSize) {
                            report('ILLEGAL MOVE : ' + x + ',' + y + '');
                            return null;
                        }
                        var dist = Math.sqrt(Math.pow(ws.data.x - x, 2) + Math.pow(ws.data.y - y, 2));
                        if (dist > 1.42) {
                            /* RECADRAGE */
                            ws.send(JSON.stringify({
                                'rcdr': rogue.formatPeople(ws)
                            }));
                            return null;
                        }




                        var obstacle = rogue.isObstacle(x, y, ws.data.z, ws.id);
                        var updateMove = false;
                        if (!obstacle) {
                            /* MOVE IS VALIDATED */
                            var xangle = x;
                            var yangle = y;
                            updateMove = true;

                        } else {
                            if (obstacle != 'wall') {
                                rogue.powerUse(ws, 'auto', [x, y], DelayAoE, mapAoE);
                            }

                            var xangle = ws.data.x;
                            var yangle = ws.data.y;

                        }

                        /* set orientation */
                        if (x > ws.data.x && y === ws.data.y) {
                            ws.data.angle = [xangle + 1, ws.data.y];
                            ws.data.orientation = 0;
                        }
                        if (x > ws.data.x && y > ws.data.y) {
                            ws.data.angle = [xangle + 1, yangle + 1];
                            ws.data.orientation = 1;
                        }
                        if (x < ws.data.x && y > ws.data.y) {
                            ws.data.angle = [xangle - 1, yangle + 1];
                            ws.data.orientation = 3;
                        }
                        if (x > ws.data.x && y < ws.data.y) {
                            ws.data.angle = [xangle + 1, yangle - 1];
                            ws.data.orientation = 7;
                        }
                        if (x < ws.data.x && y < ws.data.y) {
                            ws.data.angle = [xangle - 1, yangle - 1];
                            ws.data.orientation = 5;
                        }

                        if (x === ws.data.x && y < ws.data.y) {
                            ws.data.angle = [ws.data.x, yangle - 1];
                            ws.data.orientation = 6;
                        }
                        if (x === ws.data.x && y > ws.data.y) {
                            ws.data.angle = [ws.data.x, yangle + 1];
                            ws.data.orientation = 2;
                        }
                        if (x < ws.data.x && y === ws.data.y) {
                            ws.data.angle = [xangle - 1, ws.data.y];
                            ws.data.orientation = 4;
                        }

                        if (updateMove) {
                            ws.data.x = x;
                            ws.data.y = y;
                        }

                        rogue.updateMyPosition(ws);
                        ws.setMoveCool(params.granu);



                    } else {
                        //  console.log("2quick");
                    }
                }

                /* power use by player with a key */
                if (json.cd === 'key' && json.v && !ws.data.holdingPower) {
                    rogue.powerUse(ws, json.v, json.aim, DelayAoE, mapAoE);
                }

                /* pkmode toggle */
                if (json.cd === "pkm") {
                    if (ws.data.pk === true) {
                        ws.data.pk = false;
                    } else {
                        ws.data.pk = true;
                    }
                    rogue.updateMyPosition(ws);
                }




                if (json.dequip && json.slot) {
                    var oldItem = ws.data.equip[json.slot];
                    if (oldItem) {
                        oldItem.isEquiped = 0;
                        ws.data.equip[json.slot] = 0;
                        //  console.log('DEchaussing ' + oldItem.id + ' in slot ' + json.slot);
                        rogue.updatePowersEquiped(ws);
                    }
                }

                /* equip */
                if (json.equip && json.slot) {
                    if (json.slot < 1 || json.slot > 9) {
                        return null;
                    }

                    var slot = json.slot;
                    rogue.equipItem(ws, json.equip, slot);
                }


                if (json.pic) {
                    var itemHere = json.pic;
                    //    console.log(itemHere.length + 'picked up');
                    var update = false;
                    for (ih = 0; ih < itemHere.length; ih++) {
                        var ditem = rogue.itemsInWorld[ws.data.z]['item' + itemHere[ih]];
                        if (!ditem) {
                            console.log('error item not found');
                        } else {
                            //  console.log(ditem);
                            // console.log(ditem.id + '('+ditem.uid+') here and picked up');

                            rogue.createItem(null, null, [ws.id, null], ditem);
                            delete rogue.itemsInWorld[ws.data.z]['item' + itemHere[ih]];
                            update = true;
                        }

                    }
                    /*
                    if (update) {
                        ws.send(JSON.stringify({
                            'itemsInWorld': rogue.itemsInWorld[ws.data.z],
                            'myItems': ws.data.inv
                        }));
                    }
*/

                }

                if (json.inv) {
                    //console.log(json);y
                    if (json.inv == 1) {
                        ws.data.secured = 1;
                    }
                    if (json.inv == 2) {
                        ws.data.secured = 0;
                    }
                }





            } catch (e) {
                report(e);
            }
        });

        ws.on('close', function (message) {
            report(ws.name + ' is closing');
            wss.broadcast(JSON.stringify({
                'gone': ws.name
            }));
            ws.save(null);
            wss.clearMobTarget(mobs, ws.id);
            wss.clients.delete(ws);

        });
    });



    tick();




} /* eof start server */









/* tick operations */
var tic = 0;
var save_clock = 0;
var save_freq = 10000;
var mobIndex = 0;

var lastTime = Date.now();
var ticTime = null;
var lastTictime = null;
var deltaTime;


var occupied = occupiedOriginal.slice(0);




function tick() {

    ticTime = Date.now();
    lastTictime = ticTime - lastTime;
    lastTime = ticTime;
    deltaTime = 1 / lastTictime * 100; //0.3

    tic++;
    var timeos = Date.now();

    /* SERVER TICK PREPARE */
    var preparedUpdate = [];


    for (iWw = 0; iWw < rogue.maxLevels; iWw++) {
        preparedUpdate[iWw] = {
            moves: [],
            powers: [],
            mobs: [],
            deadmobs: [],
            items: []
        };
    }



    if (wss.clients.size) {


        /* AoE DELAYED PREPARATION */
        var debug = false;
        var fxUpdatePile = {};

        for (AoZ = DelayAoE.length - 1; AoZ >= 0; AoZ--) {
            var daFX = DelayAoE[AoZ];
            var z = daFX.map[0];
            var x = daFX.map[1];
            var y = daFX.map[2];
            var newFXOnThisTile = mapAoE[z][x][y].slice(0); // JSON.parse(JSON.stringify(mapAoE[AoZ][AoX][AoY])); 
            if (daFX.delay <= 1) {
                if (!daFX.disabled) {
                    if (debug) console.log(tic + ' : ' + daFX.power + ' ON ' + x + ',' + y);
                    newFXOnThisTile.push(daFX);
                    DelayAoE[AoZ].disabled = true;
                    DelayAoE.splice(AoZ, 1);
                    /*
                    rogue.updatePowerUse(daFX.owner, z, daFX.power, [
                        [x, y]
                    ]);
                    */

                    if (!fxUpdatePile[daFX.uid]) fxUpdatePile[daFX.uid] = {
                        'daFX': daFX,
                        'z': z,
                        'surface': []
                    };
                    fxUpdatePile[daFX.uid].surface.push([x, y]);
                }
            } else {
                if (debug) console.log(tic + ' : ' + daFX.power + ' hold in  ' + x + ',' + y + ' for ' + daFX.delay);
                DelayAoE[AoZ].delay -= 1;
            }
            mapAoE[z][x][y] = newFXOnThisTile;
            mapAoEList.push({
                map: [z, x, y],
                fxlist: newFXOnThisTile
            });
        }

        Object.keys(fxUpdatePile).forEach(function (fxkey) {
            var val = fxUpdatePile[fxkey];
            rogue.updatePowerUse(val.daFX.owner, val.z, val.daFX.power, val.surface);
        });




        //  mapAoE = DelayAoE;



        /* M O B S    O______________________________O  */


        var preparedMob = nearest = null;
        for (ii = 0; ii < mobs.length; ii++) {
            var mob = mobs[ii];
            mob.update = false;

            /* IS DAMAGED */
            var x = mob.x;
            var y = mob.y;
            var z = mob.z;
            if (mapAoE[z][x][y].length) {
                var fxtile = mapAoE[z][x][y];
                //console.log('Mob Damaged in '+z+','+x+','+y);

                for (ifff = 0; ifff < fxtile.length; ifff++) {
                    if (fxtile[ifff].owner != 'mob') {

                        var damage = fxtile[ifff].damage;
                        var defenses = rogue.getDefenses(mob);
                        var appliedDamage = rogue.getAppliedDamage(damage, defenses);
                        mob.life.now -= appliedDamage;
                        mob.damaged = appliedDamage;
                        mob.update = true;
                        if (mob.life.now <= 0) {
                            var dareport = mob.name + ' killed by ' + fxtile[ifff].power + ' from ' + fxtile[ifff].owner;
                            mob.life.now = 0;
                            mob.isdead = true;
                            occupied[mob.z][mob.x][mob.y] = 0;
                        }

                    }
                }
            }


            if (mob.isdead) {
                /* MOB DIES */

                preparedUpdate[mob.z].deadmobs.push(mob.id);
                mobs.splice(ii, 1);
                mob = null;

            } else {
                /* MOB ACTION (if survived) >> */
                if (mob.attackcool > 0) {
                    mob.attackcool = mob.attackcool - 100;
                } else {
                    if (!mob.target) {
                        /* target selection */
                        nearest = wss.nearestPlayerFromPoint(mob.x, mob.y, mob.z);
                        if (nearest) {
                            var dist = tools.getDist(mob.x, nearest.data.x, mob.y, nearest.data.y);
                            if (dist <= 24) mob.target = nearest;
                        }
                    } else {
                        /* HAS TARGET AND VERIF DISTANCE TO DROP OR ATTACK */
                        /* MOB ATTACK */
                        var dist = tools.getDist(mob.x, mob.target.data.x, mob.y, mob.target.data.y);

                        if (dist > 24 || mob.target.data.secured) {
                            mob.target = null;
                        }

                        var mobPower = bibles.powers[mob.attack];
                        if (!mobPower) console.log('no mob power :(' + mob.attack);
                        if (mob.target && dist <= mobPower.surface.dist) {
                            /* ATTACK */

                            rogue.powerUse(mob, mobPower, [mob.target.data.x, mob.target.data.y], DelayAoE, mapAoE, false, true);
                            mob.attackcool = mobPower.powercool;
                            // console.log('Attack Cool Mob : ' + mob.attackcool);
                        }

                    }

                    /* movecool */
                    if (mob.nextMoveIsRandom && mob.target) {
                        // console.log('Rmoving');
                        var newMove = rogue.getRandomMove(mob.x, mob.y);
                        var x = newMove[0];
                        var y = newMove[1];
                        var obstacle = null;
                        var debug = true;

                        if (occupied[mob.z][x][y]) {
                            if (debug) console.log('R occupied simplet');
                            obstacle = true;
                        }
                        if (rogue.wallz[mob.z][x][y] > -1) {
                            obstacle = true;
                            if (debug) console.log('R occupied wall');
                        }
                        if (!obstacle) {
                            obstacle = rogue.isPlayerHere(wss, x, y, mob.z);
                            if (obstacle && debug) console.log('R occupied isPlayerHere');
                        }
                        if (!obstacle) {
                            obstacleMob = rogue.isMonsterHere(mobs, x, y, mob.z, ii);
                            if (obstacleMob && debug) console.log('R occupied obstacleMob');
                        }

                        if (!obstacle) {
                            occupied[mob.z][mob.x][mob.y] = 0;
                            mob.nextMoveIsRandom = false;
                            mob.update = true;
                            mob.x = x;
                            mob.y = y;
                            occupied[mob.z][x][y] = 'randommovingmob';
                            if(debug) console.log('random moving mob ');

                        } else {
                           
                        }
                    }
                }


                if (mob.target && mob.target.data && !mob.nextMoveIsRandom) {
                    // console.log('Tmoving');
                    if (!mob.movecool) {
                        var mobdef = bibles.mobs[mob.mob];
                        mob.movecool = mobdef.movecool;
                        var newMove = rogue.getNextMove(mob.x, mob.y, mob.target.data.x, mob.target.data.y);
                        var x = newMove.x;
                        var y = newMove.y;
                        var moveupdate = newMove.update;
                        if (moveupdate) {
                            /* check obstacle */
                            var obstacle = null;
                            var debug = true;

                            if (occupied[mob.z][x][y]) {
                                if (debug) console.log('occupied simplet');
                                obstacle = true;
                            }
                            if (rogue.wallz[mob.z][x][y] > -1) {
                                obstacle = true;
                                if (debug) console.log('occupied wall');
                            }
                            if (!obstacle) {
                                obstacle = rogue.isPlayerHere(wss, x, y, mob.z);
                                if (obstacle && debug) console.log('occupied isPlayerHere');
                            }
                            if (!obstacle) {
                                obstacleMob = rogue.isMonsterHere(mobs, x, y, mob.z, ii);
                                if (obstacleMob && debug) console.log('occupied obstacleMob');
                            }
                            if (obstacle || obstacleMob) {
                                mob.nextMoveIsRandom = true;
                               
                            } else {
                                occupied[mob.z][mob.x][mob.y] = 0;
                                /* move validated */
                                mob.update = true;
                                mob.x = x;
                                mob.y = y;
                                occupied[mob.z][x][y] = 'movingmob';
                                if(debug) console.log('moving mob ');
                            }
                        }


                    } else {
                        mob.movecool--;
                    }
                }



                if (mob.update && mob.target) {
                    preparedMob = rogue.formatMob(mob);
                    preparedUpdate[mob.z].mobs.push(preparedMob);
                    /* clean the mob for next tick */
                    mob.update = false;
                    mob.damaged = false;
                }

            }
        }

        /* SPAWWWWWWNERS MOB CREATION */
        // console.log('mobs +' + mobs.length);
        for (spp = 0; spp < spawners.length; spp++) { // foreach spawner
            var spobj = spawners[spp];
            if (spobj.cooldown <= 0) {
                spobj.cooldown = spobj.batchtime;
                // console.log('new batchtime'+spobj.batchtime);
                if (occupied[spobj.z][spobj.x][spobj.y]) {
                    console.log('OCCUPIED BY ' + occupied[spobj.z][spobj.x][spobj.y]);
                    console.log(occupied[spobj.z][spobj.x]);
                    obstacle = true;
                }
                if (rogue.wallz[spobj.z][spobj.x][spobj.y] > -1) obstacle = true;
                if (!obstacle) obstacle = rogue.isPlayerHere(wss, spobj.x, spobj.y, spobj.z);
                if (!obstacle) obstacle = rogue.isMonsterHere(mobs, spobj.x, spobj.y, spobj.z);
                if (!obstacle) {
                    for (sp = 0; sp < spobj.batchnumber; sp++) { // foreach batch
                        if (mobs.length < 10) {
                            mobIndex++;
                            var newmob = {
                                id: '_m' + mobIndex,
                                name: '_m' + mobIndex,
                                mob: spobj.mob,
                                x: spobj.x,
                                y: spobj.y,
                                z: spobj.z,
                                skin: bibles.mobs[spobj.mob].skin,
                                attackcool: null,
                                movecool: null,
                                attack: bibles.mobs[spobj.mob].attack,
                                target: 0,
                                life: {
                                    now: bibles.mobs[spobj.mob].life.now,
                                    max: bibles.mobs[spobj.mob].life.max
                                },
                                damage: bibles.mobs[spobj.mob].damage,
                                defense: bibles.mobs[spobj.mob].defense,
                                update: true,
                            }
                            mobs.push(newmob);
                            occupied[newmob.z][newmob.x][newmob.y] = 'spawnedmob';
                            if(debug) console.log('spawning mob ');
                        }
                    }
                } else {
                    console.log('spawnersobstrue');
                }

            } else {

                // lastTictime == plus précis que ticktime car REEL
                spobj.cooldown -= deltaTime;
                // console.log("delta "+deltaTime+", new cool "+spobj.cooldown + '(tictime real : '+lastTictime+')');

            }
        }



    } /* end if clients */














    /* PLAYERS TIC */

    /* ENVOI DES PILES */

    /* asked moves & damage PUD */
    if (wss.waitingPuds.length) {
        for (i = 0; i < wss.waitingPuds.length; i++) {
            for (j = 0; j < wss.waitingPuds[i].length; j++) {
                var waitingPud = wss.waitingPuds[i][j];
                preparedUpdate[i].moves.push(waitingPud);
            }
        }
        wss.waitingPuds = []; // clear the pile
    }

    /*asked powers */
    if (wss.waitingPowers.length) {
        for (i = 0; i < wss.waitingPowers.length; i++) {
            for (j = 0; j < wss.waitingPowers[i].length; j++) {
                var waitingPud = wss.waitingPowers[i][j];
                preparedUpdate[i].powers.push(waitingPud);
            }
        }
        wss.waitingPowers = []; // clear the pile
    }

    /* do you refresh items */
    if (wss.waitingItems.length) {
        //  console.log('TIC updating items');
        for (i = 0; i < wss.waitingItems.length; i++) {
            for (j = 0; j < wss.waitingItems[i].length; j++) {
                var waitingPud = wss.waitingItems[i][j];
                preparedUpdate[i].items.push(waitingPud);
            }
        }
        wss.waitingItems = []; // clear the pile
    }



    wss.clients.forEach(function each(client) {
        if (client.data) {
            try {
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
                    var fxtile = mapAoE[z][x][y];
                    for (damageTileIndex = 0; damageTileIndex < fxtile.length; damageTileIndex++) {
                        /* touché */

                        if (fxtile[damageTileIndex].owner != client.id && !client.data.isdead) {
                            var damage = fxtile[damageTileIndex].damage;
                            var defenses = rogue.getDefenses(client);
                            var appliedDamage = rogue.getAppliedDamage(damage, defenses);
                            if (isNaN(appliedDamage)) {
                                console.log('damage sucks');
                                process.exit();
                            }
                            client.data.life.now -= appliedDamage;
                            client.data.damaged = appliedDamage;
                            /* death :o */
                            if (client.data.life.now <= 0 && !client.data.isdead) {
                                var dareport = client.data.name + ' killed by ' + fxtile[damageTileIndex].power + ' from ' + fxtile[damageTileIndex].owner;
                                report(dareport);
                                client.data.life.now = 0;
                                client.send(JSON.stringify({
                                    dead: 1
                                }));
                                wss.broadcast(JSON.stringify({
                                    'notice': report
                                }));
                                client.data.isdead = true;
                                wss.clearMobTarget(mobs, client.data.id);
                            }
                            var pud = rogue.formatPeople(client);
                            client.data.damaged = 0;
                            preparedUpdate[client.data.z].moves.push(pud);
                        }
                    }
                }
            } catch (e) {
                report(e);
            }
        }

    });


    /*

    E N V O I    D U   T I C K 

    */
    /* on envoie l'update groupée en 1 json par personne /  tick optimisé du cul */
    for (z = 0; z < preparedUpdate.length; z++) {
        if (preparedUpdate[z].moves.length || preparedUpdate[z].items.length || preparedUpdate[z].powers.length || preparedUpdate[z].mobs.length || preparedUpdate[z].deadmobs.length) {
            var msg = {
                // 't': tic
            };
            if (preparedUpdate[z].moves.length) msg.puds = preparedUpdate[z].moves;
            if (preparedUpdate[z].powers.length) msg.pwups = preparedUpdate[z].powers;
            if (preparedUpdate[z].mobs.length) msg.mobs = preparedUpdate[z].mobs;
            if (preparedUpdate[z].deadmobs.length) msg.dm = preparedUpdate[z].deadmobs;
            if (preparedUpdate[z].items.length) msg.itup = preparedUpdate[z].items;



            wss.broadcastToLevel(JSON.stringify(msg), z);
        }
    }





    /* AeO cools */


    for (b = 0; b < mapAoEList.length; b++) {
        var fxPile = mapAoEList[b].fxlist;
        for (i = 0; i < fxPile.length; i++) {
            var fx = fxPile[i];
            var x = fx.map[1];
            var y = fx.map[2];
            var z = fx.map[0];
            if (mapAoE[z][x][y][i]) {
                mapAoE[z][x][y][i].cooldown--;
                if (mapAoE[z][x][y][i].cooldown <= 0) {
                    mapAoE[z][x][y].splice(i, 1);
                    mapAoEList[b].fxlist.splice(i, 1);
                }
            }
        }
    }


    var timeos2 = Date.now();
    ticdiff = timeos2 - timeos;
    if (ticdiff > 25) {
        report('TicDIFF greater than ' + ticdiff + ' ms :-o ' + mobs.length + ' mobs, ' + wss.clients.size + ' players');
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