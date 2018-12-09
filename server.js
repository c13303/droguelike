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
var occupiedOriginal = tools.matrix(mapSize, mapSize);
var ticdiff;
var bibles = {};
var myglobals = {};
var shapesData;
var debug;
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
    tools.loadFile('gear.json', "gearData");
    /*
        tools.loadFile('map.json', "mapData");
        tools.loadFile('wallz.json', "wallzData");
    */

    tools.loadFile('levels/level0.json', "level0");


    setTimeout(function () {
        startServer();
    }, 2000);

}


var mapAoE = [];
var DelayAoE = [];
mapAoE.push(tools.matrix(mapSize, mapSize, []));
DelayAoE.push(tools.matrix(mapSize, mapSize, []));


/* END OF SETUP */








function startServer() {
    var data = tools.data;
    bibles.mobs = JSON.parse(data.mobsBible);
    bibles.powers = JSON.parse(data.powersBible);
    spawners = JSON.parse(data.spawnersData);
    data_example = JSON.parse(data.data_example);
    tools.shapes = JSON.parse(data.shapesData);
    rogue.gear = JSON.parse(data.gearData);


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
                    'mydata': ws.data,
                    'granu': params.granu,
                    'people': rogue.getPeopleInZ(ws.data.z, wss, ws),
                    'mobs': rogue.getMobsInZ(ws.data.z, mobs),
                    'ticrate' : tickrate
                    //  'bibles': bibles
                }));
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
                    rogue.powerUse(that, that.data.holdingPower.power, that.data.holdingPower.aim, DelayAoE,mapAoE, true);
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


                /* Commande From Clients */
                if (json.cd === "say") {
                    if (json.v === '/rez') {
                        console.log(ws.name + ' ressurecting ...');
                        ws.data.skin = 1;
                        ws.data.isdead = null;
                        ws.data.life.now = ws.data.life.max;
                        rogue.updateMyPosition(ws);
                    }
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
                        if (!obstacle) {
                            ws.data.x = x;
                            ws.data.y = y;
                            rogue.updateMyPosition(ws);
                            ws.setMoveCool(params.granu);
                        } else {
                            if (obstacle != 'wall') rogue.powerUse(ws, 'auto', [x, y], DelayAoE,mapAoE);
                        }
                    } else {
                        //  console.log("2quick");
                    }
                }

                /* power use by player with a key */
                if (json.cd === 'key' && json.v && !ws.data.holdingPower) {
                    rogue.powerUse(ws, json.v, json.aim, DelayAoE,mapAoE);
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

function tick() {

    ticTime = Date.now();
    lastTictime = ticTime - lastTime;
    lastTime = ticTime;
    deltaTime = 1 / lastTictime * 100; //0.3
    
    tic++;
    var timeos = Date.now();

    /* SERVER TICK PREPARE */
    var preparedUpdate = [];
    var occupied = occupiedOriginal.slice(0);
    for (i = 0; i < rogue.maxLevels; i++) {
        preparedUpdate[i] = {
            moves: [],
            powers: [],
            mobs: [],
            deadmobs: []
        };
    }



    if (wss.clients.size) {


        /* AoE DELAYED PREPARATION */
        var debug = false;
        for(AoZ = 0; AoZ < DelayAoE.length; AoZ++){
            for(AoX = 0; AoX < DelayAoE[AoZ].length; AoX++){
                for(AoY = 0; AoY < DelayAoE[AoZ][AoX].length; AoY++){ 
                  //  var surfaceD = [];                                     
                    if(DelayAoE[AoZ][AoX][AoY].length){ // presence d'effects dans la table des delayed
                        var newFXOnThisTile = mapAoE[AoZ][AoX][AoY].slice(0); // JSON.parse(JSON.stringify(mapAoE[AoZ][AoX][AoY])); 
                        var fxtileD = DelayAoE[AoZ][AoX][AoY];                      
                       
                        for(fX = 0; fX < fxtileD.length; fX++){
                            var daFX = fxtileD[fX];
                            if(daFX.delay<=1){
                                if(debug)console.log(daFX.power + ' ON '+AoX+','+AoY);
                                newFXOnThisTile.push(daFX);
                                DelayAoE[AoZ][AoX][AoY].splice(fX,1);                                  
                                rogue.updatePowerUse(daFX.owner, AoZ, daFX.power, [[AoX,AoY]]); 
                            } else{
                                if(debug)console.log(daFX.power + ' hold in  '+AoX+','+AoY+ ' for ' + daFX.delay);
                                DelayAoE[AoZ][AoX][AoY][fX].delay-=1;
                            }
                        }
                       
                        mapAoE[AoZ][AoX][AoY] = newFXOnThisTile;
                    }
                }
            }
        }
        
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

                if (!mob.target) {
                    /* target selection */
                    nearest = wss.nearestPlayerFromPoint(mob.x, mob.y, mob.z);
                    if (nearest) {
                        mob.target = nearest;
                    }
                } else {
                    /* HAS TARGET AND VERIF DISTANCE TO DROP OR ATTACK */
                    var dist = tools.getDist(mob.x, mob.target.data.x, mob.y, mob.target.data.y);
                    if (dist > 24) {
                        mob.target = null;
                    }
                    var mobPower = bibles.powers[mob.attack];
                    if (!mobPower) console.log('no mob power :(' + mob.attack);
                    if (dist <= mobPower.surface.dist) {
                        /* ATTACK */
                        rogue.powerUse(mob, mobPower, [mob.target.data.x, mob.target.data.y], DelayAoE, mapAoE, false, true);
                    }

                }

                /* movecool */
                if (mob.nextMoveIsRandom && mob.target) {
                    var newMove = rogue.getRandomMove(mob.x, mob.y);
                    var x = newMove[0];
                    var y = newMove[1];
                    var obstacle = null;
                    if (occupied[mob.z][x][y]) obstacle = true;
                    if (rogue.wallz[mob.z][x][y] > -1) obstacle = true;
                    if (!obstacle) obstacle = rogue.isPlayerHere(wss, x, y, mob.z);
                    if (!obstacle) obstacleMob = rogue.isMonsterHere(mobs, x, y, mob.z, ii);
                    if (!obstacle) {
                        mob.nextMoveIsRandom = false;
                        mob.update = true;
                        mob.x = x;
                        mob.y = y;
                        occupied[mob.z][x][y] = true;
                    } else {
                        occupied[mob.z][mob.x][mob.y] = true;
                    }
                }

                if (mob.target && mob.target.data && !mob.nextMoveIsRandom) {
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
                            if (occupied[mob.z][x][y]) obstacle = true;
                            if (rogue.wallz[mob.z][x][y] > -1) obstacle = true;
                            if (!obstacle) obstacle = rogue.isPlayerHere(wss, x, y, mob.z);
                            if (!obstacle) obstacleMob = rogue.isMonsterHere(mobs, x, y, mob.z, ii);
                            if (obstacle || obstacleMob) {
                                mob.nextMoveIsRandom = true;
                                occupied[mob.z][mob.x][mob.y] = true;
                            } else {
                                /* move validated */
                                mob.update = true;
                                mob.x = x;
                                mob.y = y;
                                occupied[mob.z][x][y] = true;
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

        /* SPAWWWWWWNERS */
        for (spp = 0; spp < spawners.length; spp++) { // foreach spawner
            var spobj = spawners[spp];
            if (spobj.cooldown <= 0) {                
                spobj.cooldown = spobj.batchtime;
               // console.log('new batchtime'+spobj.batchtime);
                if (occupied[spobj.z][spobj.x][spobj.y]) obstacle = true;
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
                                update: true,
                            }
                            mobs.push(newmob);
                        }
                    }
                }

            } else {

                // lastTictime == plus précis que ticktime car REEL
                spobj.cooldown-= deltaTime;
               // console.log("delta "+deltaTime+", new cool "+spobj.cooldown + '(tictime real : '+lastTictime+')');
               
            }
        }



    } /* end if clients */














    /* PLAYERS TIC */


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
        if (preparedUpdate[z].moves.length || preparedUpdate[z].powers.length || preparedUpdate[z].mobs.length || preparedUpdate[z].deadmobs.length) {
            wss.broadcastToLevel(JSON.stringify({
                'puds': preparedUpdate[z].moves,
                'pwups': preparedUpdate[z].powers,
                'mobs': preparedUpdate[z].mobs,
                'dm': preparedUpdate[z].deadmobs,
            }), z);
        }
    }


    if (!wss.clients.size) {

    }



    /* AeO cools */
    for (z = 0; z < mapAoE.length; z++) {
        for (x = 0; x < mapAoE[z].length; x++) {
            for (y = 0; y < mapAoE[z][x].length; y++) {
                for (i = 0; i < mapAoE[z][x][y].length; i++) {
                    if (mapAoE[z][x][y][i]) {
                        mapAoE[z][x][y][i].cooldown--;
                        if (mapAoE[z][x][y][i].cooldown <= 0) {
                            mapAoE[z][x][y].splice(i, 1);
                        }
                    }
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