// WS //
/*
 * 
 * CONNEXION
 */

function updatestats(pd) {
    for (var p in pd) {
        if (obj.hasOwnProperty(p)) {
            var id = '.' + p;
            $(id).val(pd[p]);
        }
    }
}


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
        // if disabled, the close will be detected and try to reconnect forever

        //window.location.replace("/?" + isdev + "message=Login Failed&disablereconnect=1");

    };
    ws.onclosed = function (e) {
        console.log('closed');
        console.log(e);

    }


    /*
     * 
     * COMMUNICATION STARTING ! 
     */



    ws.onmessage = function (event) {


        var d = JSON.parse(event.data);
        tools.peoplehere = peoplehere;

        /* CONSOLAGE */
        if (consolage)
            console.log(d);

        if (d.startgame && level && d.ticrate) {
            ticrate = d.ticrate;
            //   console.log('firestarter , ticrate : ' + ticrate);
            $('#connect').remove();
            $('#autoreconnect').remove();
            $('#game').removeClass("hidden");


            pd = d.mydata;
            pd.mypowertimer = {};


            if (d.granu)
                cooldownbible.move = d.granu;

            peoplehere = d.people;


            game = new Phaser.Game(config);
            //  $('#logo').remove();

        }






        /* any player updates */

        if (d.puds) {
            for (pudI = 0; pudI < d.puds.length; pudI++) {
                tools.updatePlayer(d.puds[pudI]); // tout se retrouve dans keum ^^ 
            }
        }

        /* power use update */
        if (d.pwups && d.pwups.length) {

            /* reunir les surfaces */

            for (puI = 0; puI < d.pwups.length; puI++) {
                /* P1 cooldown */
                if (d.pwups[puI].who === pd.id) {
                    pd.holding = false;
                    pd.mypowertimer[d.pwups[puI].pwup] = new timer(function () {
                        // utile pour afficher le timer live du boutton
                    }, powersbible[d.pwups[puI].pwup].powercool);
                }

                /*
                tools.updateKeumById(d.pwups[puI].who, "poweruse", {
                    power: d.pwups[puI].pwup,
                    surface: d.pwups[puI].surf
                });
                */
                var msg = {
                    power: d.pwups[puI].pwup,
                    surface: d.pwups[puI].surf
                }
                powerUseDrawing.push(msg);
                tools.updateKeumById(d.pwups[puI].who, "release", true);
            }
        }

        /* mobs update */
        if (d.mobs && d.mobs.length) {
            for (m = 0; m < d.mobs.length; m++) {
                var mob = d.mobs[m];
                tools.updatePlayer(mob);
            }
        }

        /* dead mobs update */
        if (d.dm && d.dm.length) {
            killingPile.push.apply(killingPile, d.dm);

        }


        /* recadrage */
        if (d.rcdr) {
            // console.log('recadrage');
            tools.updatePlayer(d.rcdr);
        }

        if (d.myItems) {
            myItems = d.myItems;

            tools.inventoryReorder();

        }

        if (d.myPowers) {
            //     console.log(d.myPowers);
            pd.powers_equiped = d.myPowers;
            var pow = d.myPowers;
            $('#powers').html('');
            var empty = '<div class="keypower empty">_</div>';
            var keys = [];
            keys.push(pow.auto.k ? '<div class="keypower keyauto power' + pow.auto.k + '" data-key="auto" data-power="' + pow.auto.k + '"><div class="keynum autokey">.</div> <span class="n">' + powersbible[pow.auto.k].name[lang] + '</span><span class="cooldown"></span></div>' : empty);
            keys.push(pow.a.k ? '<div class="keypower keya power' + pow.a.k + '" data-key="a" data-power="' + pow.a.k + '"><div class="keynum dakey">1</div> <span class="n">' + powersbible[pow.a.k].name[lang] + '</span><span class="cooldown"></span></div>' : empty);
            keys.push(pow.b.k ? '<div class="keypower keyb power' + pow.b.k + '" data-key="b" data-power="' + pow.b.k + '"><div class="keynum dakey">2</div> <span class="n">' + powersbible[pow.b.k].name[lang] + '<span class="cooldown"></span></div>' : empty);
            keys.push(pow.c.k ? '<div class="keypower keyc power' + pow.c.k + '" data-key="c" data-power="' + pow.c.k + '"><div class="keynum dakey">3</div> <span class="n">' + powersbible[pow.c.k].name[lang] + '<span class="cooldown"></span></div>' : empty);
            keys.push(pow.d.k ? '<div class="keypower keyd power' + pow.d.k + '" data-key="d" data-power="' + pow.d.k + '"><div class="keynum dakey">4</div> <span class="n">' + powersbible[pow.d.k].name[lang] + '<span class="cooldown"></span></div>' : empty);
            for (i = 0; i < keys.length; i++) {
                $('#powers').append(keys[i]);
            }
        }


        if (d.itemsInWorld) {
            // console.log('-------------------allitems');
            //console.log(d.itemsInWorld);
            pd.itemsInWorld = d.itemsInWorld;
        }

        if (d.itup && d.itup.length) {
            //console.log('-------------------itup from tic ' + d.tic);
            // console.log(d.itup);
            for (dritupX = 0; dritupX < d.itup.length; dritupX++) {
                var itemTP = d.itup[dritupX];
                if (itemTP.way == 'rem') {
                    // console.log('removing '+itemTP.item.uid);
                    delete pd.itemsInWorld['item' + itemTP.item.uid];
                }
                if (itemTP.way == 'add') {
                    // console.log('adding');
                    pd.itemsInWorld['item' + itemTP.item.uid] = itemTP.item;
                }
            }
        }



        /* other player leaves*/
        if (d.gone) {
            for (i = 0; i < peoplehere.length; i++) {
                if (d.gone === peoplehere[i].name) {
                    tools.notice(peoplehere[i].name + ' has left');
                    peoplehere.splice(i, 1);
                    drawnPeople[d.gone].sprite.destroy();
                    drawnPeople[d.gone].label.destroy();
                    drawnPeople[d.gone].lifebar.destroy();
                    drawnPeople[d.gone] = null;
                }
            }
            for (i = 0; i < drawnPeopleIndex.length; i++) {
                if (d.gone === drawnPeopleIndex[i]) {
                    drawnPeopleIndex.splice(i, 1);
                }
            }
        }

        if (d.chat) {
            tools.notice('<b class="playa" data-name="' + d.who + '">' + d.who + '</b> : ' + d.chat);
        }

        if (d.notice) {
            tools.notice('<span class="notice">' + d.notice + '</span>');
        }
        if (d.dead) {
            tools.notice('<span class="notice">You are dead. Type /rez to resurrect</span>');
        }

        if (d.reset) {
            game.destroy(true);
            drawnPeopleIndex = [];
            peoplehere = [];
            killingPile = [];
            drawnPeople = {};
            drawnItems = {};
            tweenplayer;
            pd = null;
            ws.send(JSON.stringify({
                startlevel: 1,
              
            }));
        }





    } /* end of reception */







    function ping() {
        setTimeout(function () {
            if (ws.readyState === ws.CLOSED) {
                console.log('Connexion closed, reset triggered');
                window.location.replace("/?" + isdev + "reconnect=1");
            } else {
                ping();
            }
        }, 1000);
    }

    ping();



    /* 



    C O N T R O L S 


    */


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
            v: $('#chat').val(),
            cur: [caseX, caseY]
        }));
        $('#chat').val('');
    });

    $('#bar .inventory').click(function () {
        $('.playerfiche').toggle();
    });

    function pickup() {
        if (pd.itemsHere.length) {
            console.log('picking up ' + pd.itemsHere.length + ' objects');
            tools.notice('You are picking up ' + pd.itemsHere.length + ' objects');
            ws.send(JSON.stringify({
                pic: pd.itemsHere,
            }));
        }
    }

    $('#bar .takeloot').click(function () {
        pickup();
    });

    /* use of keyboards */
    $('body').bind('keypress', 'canvas', function (e) {

        if (!$('#chat').is(":focus")) {

            var keyCode = tools.checkKey(e);
            if (consolage) console.log(keyCode);

            if (keyCode === 13) {
                $("#chat").focus();
            } else {
                e.preventDefault();
            }

            /* player killer mode */
            if (keyCode === 107) {
                ws.send(JSON.stringify({
                    cd: 'pkm',
                    v: 1
                }));
            }

            if (keyCode === 105) {
                $('.playerfiche').toggle();
            }

            if (keyCode === 112) {
                pickup();
            }


            /* target selection */
            if (keyCode === 116) { // 
                // select next target
                var sortedPeople = [];
                if (!peoplehere.length) {
                    tools.notice('No one to target here ...');
                }
                for (targetSelIndex = 0; targetSelIndex < peoplehere.length; targetSelIndex++) {
                    var man = peoplehere[targetSelIndex];
                    var dist = Math.sqrt(Math.pow(man.x - pd.x, 2) + Math.pow(man.y + pd.y, 2));
                    if (man.id !== pd.id && (!pd.target || man.id !== pd.target.id) && dist < 800) {
                        pd.target = {
                            'name': man.name,
                            id: man.id
                        };
                        i = peoplehere.length + 1;
                    }
                }
                if (pd.target)
                    $('#target').html(pd.target.name);
                else {
                    $('#target').html("");
                }
            }

            /* power use */
            /*
            if ((keyCode === 38 || keyCode === 233 || keyCode === 34 || keyCode === 39) && !pd.target) {
                tools.notice('no target ! press T to select a target');
            }
            */

            var powerUse = null;




            if (!pd.holding) {
                if (!$('.keya').hasClass('cooling') && (keyCode === 38 || keyCode === 49)) {
                    keyUse('.keya');
                }
                if (!$('.keyb').hasClass('cooling') && keyCode === 233 || keyCode === 50) {
                    keyUse('.keyb');
                }

                if (!$('.keyc').hasClass('cooling') && keyCode === 34 || keyCode === 51) {
                    keyUse('.keyc');
                }

                if (!$('.keyd').hasClass('cooling') && keyCode === 39 || keyCode === 52) {
                    keyUse('.keyd');
                }

            }



        }
    });


    function keyUse(myclass) {
        //   console.log('Key Use : ' + myclass);

        powerUse = $(myclass).data('power');
        if ($(myclass).data('key') && powerUse) {
            // $(this).addClass('cooling');
            ws.send(JSON.stringify({
                cd: 'key',
                v: $(myclass).data('key'),
                dir: pd.dir,
                aim: pd.aim
            }));
            if (powersbible[powerUse].delay) {
                pd.holding = true;
                mySoundHook('load');
            }
        }
    }

    $('#powers').on('click', '.keypower', function () {
        if (!$(this).hasClass('cooling')) {
            var dak = $(this).data('key');
            console.log('power ' + dak);
            keyUse('.key' + dak);
        }
    });

} /* end of connect */