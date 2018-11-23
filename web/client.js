/* file created by charles.torris@gmail.com */

var ws;
var player;
var autoreco;
var button;
var game;
var dev;
var canvas = document.getElementById("gamecanvas");
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    canvas: canvas,
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};


var level;
var layer;
var tiles;
var tilesize = 32;
var pd = {}; //playerData lol

var laginput = 50; //ms to stay sync with server

var lang = 'fr';
var peoplehere = [];
var drawnPeopleIndex = [];
var drawnPeople = {};
var tweenplayer;
var powersbible = [];
var mobsbible = [];

var map;
var tilefx;


var labelOffset = 32;
cooldowntimers = {};
cooldowns = {};
cooldownbible = {};

var tools = {
    peoplehere: null,
    cooldown: function (key, time) {
        if (cooldowntimers[key]) {
            clearTimeout(cooldowntimers[key]);
        }
        cooldowns[key] = true;
        cooldowntimers[key] = setTimeout(function () {
            cooldowns[key] = false;
        }, time + laginput);
    },
    updateKeumById(id, key, value) {
        for (i = 0; i < peoplehere.length; i++) {
            if (peoplehere[i].id === id) {
                peoplehere[i][key] = value;
                return (peoplehere[i]);
            }
        }
    }
};
var emptylevel;

function preload() {
    this.load.image('skin0', 'img/sprites/skin0.png');
    this.load.image('skin1', 'img/sprites/skin1.png');
    this.load.image('skin2', 'img/sprites/skin2.png');
    this.load.image('selector', 'img/sprites/selector.png');
    this.load.image("tiles", "img/tilesettest.png");
    this.load.spritesheet("fxtiles", "img/FXtileset.png", {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.spritesheet("powers", "img/sprites/slap.png", {
        frameWidth: 32,
        frameHeight: 32
    });

}

var cursor;

function create() {

    map = this.make.tilemap({
        data: level,
        tileWidth: 32,
        tileHeight: 32
    });
    tiles = map.addTilesetImage("tiles");
    layer = map.createDynamicLayer(0, tiles, 0, 0);

    cursor = this.add.sprite(400, 300, 'fxtiles', 3);
    cursor.alpha = 0.2;
    player = this.add.sprite(layer.tileToWorldX(pd.x) + tilesize / 2, layer.tileToWorldY(pd.y), pd.skin);
    selector = this.add.sprite(-500, -500, 'selector');
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player);
    this.cameras.main.setBackgroundColor('#ccccff');


    var tx = layer.tileToWorldX(pd.x);
    var ty = layer.tileToWorldY(pd.y) + labelOffset;


    drawnPeopleIndex.push(pd.name);
    drawnPeople[pd.name] = {};
    drawnPeople[pd.name].sprite = player;
    drawnPeople[pd.name].label = this.add.text(tx, ty, pd.name, {
        font: '14px Courier',
        align: "center",
        fill: '#ffffff'
    });
    drawnPeople[pd.name].label.setAlign('center');


}

var lastUpdate = Date.now();

function update() {



    /* mouse event */

    const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);

    var caseX = layer.worldToTileX(worldPoint.x);
    var caseY = layer.worldToTileY(worldPoint.y);

    /* cursor */
    cursor.x = layer.tileToWorldX(caseX) + 16;
    cursor.y = layer.tileToWorldY(caseY) + 16;
    dir = -1;
    if (caseX > pd.x && caseY == pd.y) {
        dir = 0;
    }
    if (caseX > pd.x && caseY > pd.y) {
        dir = 1;
    }
    if (caseX == pd.x && caseY > pd.y) {
        dir = 2;
    }
    if (caseX < pd.x && caseY > pd.y) {
        dir = 3;
    }
    if (caseX < pd.x && caseY === pd.y) {
        dir = 4;
    }
    if (caseX < pd.x && caseY < pd.y) {
        dir = 5;
    }
    if (caseX === pd.x && caseY < pd.y) {
        dir = 6;
    }
    if (caseX > pd.x && caseY < pd.y) {
        dir = 7;
    }
    pd.dir = dir;

    if (this.input.manager.activePointer.isDown) {
        /* move order */
        var tx = pd.x;
        var ty = pd.y;
        if (caseX > pd.x) {
            tx = pd.x + 1;
        }
        if (caseX < pd.x) {
            tx = pd.x - 1;
        }
        if (caseY > pd.y) {
            ty = pd.y + 1;
        }
        if (caseY < pd.y) {
            ty = pd.y - 1;
        }
        if (!cooldowns.move && (tx != pd.x || ty != pd.y)) {
            tools.cooldown('move', cooldownbible.move);
            ws.send(JSON.stringify({
                'move': [tx, ty]
            }));
        }
    }


    /* UPDATE CHARACTERS */



    for (i = 0; i < peoplehere.length; i++) {
        var keum = peoplehere[i];

        var px = layer.tileToWorldX(keum.x) + tilesize / 2;
        var py = layer.tileToWorldY(keum.y);
        var tx = layer.tileToWorldX(keum.x);
        var ty = layer.tileToWorldY(keum.y) + labelOffset;


        if ($.inArray(keum.name, drawnPeopleIndex) < 0) {
            drawnPeopleIndex.push(keum.name);
            drawnPeople[keum.name] = {};
            drawnPeople[keum.name].sprite = this.add.sprite(px, py, 'skin' + keum.skin);
            drawnPeople[keum.name].label = this.add.text(tx, ty, keum.name, {
                font: '14px Courier',
                align: "center",
                fill: '#ffffff'
            });
            drawnPeople[keum.name].label.setAlign('center');
        } else {

            fluidmove(drawnPeople[keum.name].sprite, px, py);
            fluidmove(drawnPeople[keum.name].label, tx, ty);
            if (pd.target && pd.target.id === keum.id) {
                selector.x = drawnPeople[keum.name].sprite.x;
                selector.y = drawnPeople[keum.name].sprite.y - 42;
            }

            if (drawnPeople[keum.name].sprite.texture.key !== 'skin' + keum.skin) {
                drawnPeople[keum.name].sprite.setTexture('skin' + keum.skin);
            }

            if (keum.pk != drawnPeople[keum.name].pk) {
                drawnPeople[keum.name].pk = keum.pk;
                if (keum.pk) {
                    //  drawnPeople[keum.name].label.setTint(0xff0000, 0xff0000, 0xff0000, 0xff0000);
                    drawnPeople[keum.name].label.setStyle({
                        fill: '#ff0000'
                    });
                } else {
                    //  drawnPeople[keum.name].label.setTint(0xffffff, 0xffffff, 0xffffff, 0xffffff);
                    drawnPeople[keum.name].label.setStyle({
                        fill: '#ffffff'
                    });
                }
            }

            /* power USE LOL */
            if (keum.poweruse) {

                var power = keum.poweruse.power;
                console.log('use of ' + power);
                var surface = keum.poweruse.surface;
                keum.poweruse = false;
                var powerspritekey = 'animepower_' + power;
                keum[powerspritekey] = [];
                for (i = 0; i < surface.length; i++) {
                    var x = layer.tileToWorldX(surface[i][0]) + 16;
                    var y = layer.tileToWorldY(surface[i][1]) + 16;
                    var sprite = this.add.sprite(x, y, 'powers',powersbible[power].sprite);
                    keum[powerspritekey].push(sprite);
                }

                this.tweens.add({
                    targets: keum[powerspritekey],
                    /*
                    props: {
                        x: { value: '+=20', duration: 200, ease: 'Circ.easeOut' },
                        y: { value: '-=20', duration: 200, ease: 'Circ.easeOut' }
                    },
                    */
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 200,
                    delay: 0,
                    repeat: 0,
                    yoyo: true,
                    ease: 'Circ',
                    repeatDelay: 0,
                    onComplete: function (tween, targets) {
                        for (i = 0; i < targets.length; i++) {
                            targets[i].destroy();
                        }
                    }
                });
            }


           

        }


    }
     /* update cooldowns */
     $.each(pd.mypowertimer,function(key,value){    
         
         if(pd.mypowertimer[key]){
            var timer = pd.mypowertimer[key];
            value = timer.getTimeLeft();
            if(value > 0){
                $('.power'+key+' .cooldown').html(value);
            } else {
                $('.power'+key+' .cooldown').html("");
                pd.mypowertimer[key] = null;
            }
            
         }
        
     });


} /* end of update */


function fluidmove(object, px, py) {
    var dt = 4;
    if (px > object.x)
        object.x += dt;
    if (px < object.x)
        object.x -= dt;
    if (py > object.y)
        object.y += dt;
    if (py < object.y)
        object.y -= dt;
}



function getTileX(x) {
    return layer.tileToWorldX(layer.worldToTileX(x));
}

function getTileY(y) {
    return layer.tileToWorldY(layer.worldToTileY(y));
}







$(document).ready(function () {





    dev = $('#isdev').val() ? true : false;
    console.log('poutrelle');


    // UI //


    $('#connect').submit(function (e) {
        e.preventDefault();
        connect();
    });



    // WS //
    /*
     * 
     * CONNEXION
     */
    function connect() {
        clearTimeout(autoreco);
        token = $('#password').val();
        user = $('#username').val();
        var regex = /^([a-zA-Z0-9_-]+)$/;
        if (!regex.test(user) || !regex.test(token)) {
            alert('Please use only alphanumeric characters and underscores for user and pass ');
            return false;
        }
        var port = 8088;
        Cookies.set('user', user);
        Cookies.set('token', token);
        console.log('connecting ' + user);
        try {
            var url = 'rogueserver.5tfu.org';
            if (dev) {
                isdev = 'dev=1&';
                ws = new WebSocket('wss://' + url + ':' + port + '/' + token + '-' + user);
            } else {
                ws = new WebSocket('wss://' + url + ':' + port + '/' + token + '-' + user);
            }
        } catch (e) {
            alert(e);
        }
        ws.onerror = function (e) {
            console.log(e);
            //window.location.replace("/?" + isdev + "message=Login Failed&disablereconnect=1");

        };


        /*
         * 
         * COMMUNICATION STARTING ! 
         */



        ws.onmessage = function (event) {


            var d = JSON.parse(event.data);
            tools.peoplehere = peoplehere;



            if (!d.pud && !d.moved)
                console.log(d);
            if (d.startgame && d.level) {
                $('#connect').remove();
                $('#autoreconnect').remove();
                $('#game').removeClass("hidden");
                level = d.level;
                pd = d.mydata;
                pd.mypowertimer = {};


                if (d.granu)
                    cooldownbible.move = d.granu;

                peoplehere = d.people;
                pd.skin = 'skin' + pd.skin;

                game = new Phaser.Game(config);

            }



            if (d.bibles) {
                console.log(d.bibles);
                powersbible = d.bibles.powers;
                mobsbible = d.bibles.mobs;
            }

            /* full update powers */
            if (d.mydata && d.mydata.powers_equiped) {
                var pow = d.mydata.powers_equiped;
                $('#powers').html('');
                var empty = '<div class="keypower">_</div>';
                var keys = [];
                keys.push(pow.auto ? '<div class="keypower power' + pow.auto.k + '" data-key="auto">[Auto] <span class="n">' + powersbible[pow.auto.k].name[lang] + '</span><span class="cooldown"></span></div>' : empty);
                keys.push(pow.a ? '<div class="keypower power' + pow.a.k + '" data-key="a">[1] <span class="n">' + powersbible[pow.a.k].name[lang] + '</span><span class="cooldown"></span></div>' : empty);
                keys.push(pow.b ? '<div class="keypower power' + pow.b.k + '" data-key="b">[2] <span class="n">' + powersbible[pow.b.k].name[lang] + '<span class="cooldown"></span></div>' : empty);
                keys.push(pow.c ? '<div class="keypower power' + pow.c.k + '" data-key="c">[3] <span class="n">' + powersbible[pow.c.k].name[lang] + '<span class="cooldown"></span></div>' : empty);
                keys.push(pow.d ? '<div class="keypower power' + pow.d.k + '" data-key="d">[4] <span class="n">' + powersbible[pow.d.k].name[lang] + '<span class="cooldown"></span></div>' : empty);
                for (i = 0; i < keys.length; i++) {
                    $('#powers').append(keys[i]);

                }
            }
            if (d.rskin && player) {
                console.log('skin change');
                drawnPeople[pd.name].sprite.setTexture('skin' + d.rskin);
            }


            /* you moved */
            if (d.moved) {
                var tx = d.moved[0];
                var ty = d.moved[1];
                peoplehere[0].x = pd.x = tx;
                peoplehere[0].y = pd.y = ty;
            }

            /* other player updates */
            if (d.pud) {
                var found = false;
                for (i = 0; i < peoplehere.length; i++) {
                    if (d.pud.name === peoplehere[i].name) {
                        $.each(d.pud, function (playerupdate) {
                            peoplehere[i][playerupdate.key] = playerupdate.value;
                        });
                        found = true;
                    }
                }
                if (!found) {
                    peoplehere.push(d.pud);
                }
            }

            /* other player leaves*/
            if (d.gone) {
                for (i = 0; i < peoplehere.length; i++) {
                    if (d.gone === peoplehere[i].name) {
                        console.log('removing ' + peoplehere[i].name);
                        peoplehere.splice(i, 1);
                        drawnPeople[d.gone].sprite.destroy();
                        drawnPeople[d.gone].label.destroy();
                    }
                }
                for (i = 0; i < drawnPeopleIndex.length; i++) {
                    if (d.gone === drawnPeopleIndex[i]) {
                        drawnPeopleIndex.splice(i, 1);
                    }
                }
            }

            if (d.chat) {
                notice('<b class="playa" data-name="' + d.who + '">' + d.who + '</b> : ' + d.chat);
            }

            if (d.notice) {
                notice('<span class="notice">' + d.notice + '</span>');
            }

            /* validation use power */
            if (d.pwup) {
                who = tools.updateKeumById(d.who, "poweruse", {
                    power: d.pwup,
                    surface: d.surf
                });
                /* if you then cooldown */
                if(d.who = pd.id){
                    pd.mypowertimer[d.pwup] = new timer(function() {
                        // we dont mind when its over because its server side
                    }, powersbible[d.pwup].powercool);               
                                      
                }
            }


            if (d.coolme) {
                var key = d.key;
                var time = d.time;
                tools.cooldown(key, time);
            }


        }


        function notice(c) {
            var wtf = $('#console');
            wtf.append('<br/>' + c);
            var height = wtf[0].scrollHeight;
            wtf.scrollTop(height);
        }

        function ping() {
            setTimeout(function () {
                if (ws.readyState === ws.CLOSED) {
                    window.location.replace("/?" + isdev + "reconnect=1");
                } else {
                    ping();
                }
            }, 1000);
        }

        ping();

        /* login */
        $('#pname').submit(function (e) {
            e.preventDefault();
            ws.send(JSON.stringify({
                cd: 'submitproduct',
                v: $('#prod').val()
            }));
        });

        $('#hacksubmit').click(function () {
            ws.send(JSON.stringify({
                cd: 'hack',
                what: $('#hack').val(),
                v: $('#hackvalue').val()
            }));
        });

        $('#chatte').submit(function (e) {
            e.preventDefault();
            ws.send(JSON.stringify({
                cd: 'say',
                v: $('#chat').val()
            }));
            $('#chat').val('');
        });


        /* use of keyboards */
        $('body').bind('keypress', 'canvas', function (e) {
            var keyCode = checkKey(e);
            console.log(keyCode);

            if (keyCode === 13) {
                $("#chat").focus();
            }

            /* player killer mode */
            if (keyCode === 107) {
                ws.send(JSON.stringify({
                    cd: 'pkm',
                    v: 1
                }));
            }



            /* target selection */
            if (keyCode === 116) { // 
                // select next target
                var sortedPeople = [];
                if (!peoplehere.length) {
                    notice('No one to target here ...');
                }
                for (i = 0; i < peoplehere.length; i++) {
                    var man = peoplehere[i];
                    if (man.id !== pd.id && (!pd.target || man.id !== pd.target.id)) {
                        pd.target = {
                            'name': man.name,
                            id: man.id
                        };
                        i = peoplehere.length + 1;
                    }
                }
                if (pd.target)
                    $('#target').html(pd.target.name);
            }

            /* power use */
            /*
            if ((keyCode === 38 || keyCode === 233 || keyCode === 34 || keyCode === 39) && !pd.target) {
                notice('no target ! press T to select a target');
            }
            */
            if (keyCode === 38) {              
                ws.send(JSON.stringify({
                    cd: 'key',
                    v: 'a',
                    dir: pd.dir
                }));
            }
            if (keyCode === 233) {              
                ws.send(JSON.stringify({
                    cd: 'key',
                    v: 'b',
                    dir: pd.dir
                }));
            }
        });


    } /* end of connect */

    if ($('#reconnect').val()) {
        var user = Cookies.get('user');
        var token = Cookies.get('token');
        console.log('Try to reco ' + user);
        $('#reconnect').val(0);
        if (user && token) {
            $('#password').val(token);
            $('#username').val(user);
            $('#connect').hide();
            $('#autoreconnect').removeClass('hidden');
            autoreco = setTimeout(function () {
                connect();
            }, 3000);

        }
    }
    $('body').on('click', 'canvas', function (e) {
        $('#chat').blur();
    });






    $('body').on('contextmenu', 'canvas', function (e) {
        return false;
    });



    $('.helper').click(function () {
        var id = $(this).data('info');
        var content = $("#" + id).html();
        console.log(content);
        $('.modal-body').html(content);
        $('#modal').modal('show');
    })

}); /* end of domready */

function checkKey(evt) {
    var keyID = (evt.charCode) ? evt.charCode : ((evt.which) ? evt.which : evt.keyCode);
    return (keyID);
}

function timer(time, update, complete) {
    var start = new Date().getTime();
    var interval = setInterval(function () {
        var now = time - (new Date().getTime() - start);
        if (now <= 0) {
            clearInterval(interval);
            complete();
        } else update(Math.floor(now / 1000));
    }, 100); // the smaller this number, the more accurate the timer will be
}

function matrix(rows, cols, defaultValue) {

    var arr = [];
    for (var i = 0; i < rows; i++) {
        arr.push([]);
        arr[i].push(new Array(cols));
        for (var j = 0; j < cols; j++) {
            arr[i][j] = defaultValue;
        }
    }
    return arr;
}

function timer(callback, delay) {
    var id, started, remaining = delay, running

    this.start = function() {
        running = true
        started = new Date()
        id = setTimeout(callback, remaining)
    }

    this.pause = function() {
        running = false
        clearTimeout(id)
        remaining -= new Date() - started
    }

    this.getTimeLeft = function() {
        if (running) {
            this.pause()
            this.start()
        }

        return remaining
    }

    this.getStateRunning = function() {
        return running
    }

    this.start()
}