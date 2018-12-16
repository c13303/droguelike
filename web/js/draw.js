var durationsLib = [];
var animsLib = {};
var music;
var soundlib = {};
var soundEnabled = true;

var powerUseDrawing = [];



function mySoundHook(soundKey) {
    if (soundEnabled)
        soundlib[soundKey].play();
}

function preload() {
    //console.log('preload');

    this.load.bitmapFont('pixelfont', '../style/fonts/pixel.png', '../style/fonts/pixel.xml');


    this.load.spritesheet("skinssheet", "img/skinssheet.png?v=" + v, {
        frameWidth: 64,
        frameHeight: 64
    });
    var v = Date.now();
    this.load.image('selector', 'img/selector.png?v=' + v);

    this.load.image("decors", "img/decors.png?v=" + v);

    this.load.spritesheet("fxtiles", "img/FXtileset.png?v=" + v, {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.spritesheet("powers", "img/powers.png?v=" + v, {
        frameWidth: 32,
        frameHeight: 32
    });

    this.load.spritesheet("mobs", "img/mobs.png?v=" + v, {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet("loot", "img/loot.png?v=" + v, {
        frameWidth: 64,
        frameHeight: 64
    });

    if (soundEnabled) {
        this.load.audio('music', [
            'sfx/droguelike1.ogg',
            'sfx/droguelike1.mp3'
        ]);

        this.load.audio('load', [
            'sfx/load.ogg',
            'sfx/load.mp3'
        ]);

        this.load.audio('slap', [
            'sfx/slap.ogg',
            'sfx/slap.mp3'
        ]);

        this.load.audio('foutrage', [
            'sfx/foutrage.ogg',
            'sfx/foutrage.mp3'
        ]);

    }

}


function create() {
    if (soundEnabled) {
        music = this.sound.add('music', {
            volume: 1,
        });
        //  music.play();
        music.setLoop(true);

        soundlib.load = this.sound.add('load', {
            volume: 0.3,
        });
        soundlib.foutrage = this.sound.add('foutrage', {
            volume: 0.3,
        });
    }


    /* map */
    map = this.make.tilemap({
        data: level,
        tileWidth: 32,
        tileHeight: 32
    });
    var floorz = map.addTilesetImage("decors");
    layer = map.createDynamicLayer(0, floorz, 0, 0);
    layer.setDepth(-50);

    var wallzTilemap = this.make.tilemap({
        data: wallData,
        tileWidth: 32,
        tileHeight: 32
    });
    var wallTiles = wallzTilemap.addTilesetImage("decors");
    wallLayer = wallzTilemap.createDynamicLayer(0, wallTiles, 0, 0);
    wallLayer.setDepth(-49);

    /* cursor */
    cursor = this.add.sprite(400, 300, 'fxtiles', 3);
    cursor.alpha = 0.2;
    cursor.setDepth(-10);

    /* player 1 */
    player = tools.createCharacter(this, pd.name, pd.skin, pd.x, pd.y);


    /* camera bound */
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player);
    this.cameras.main.setBackgroundColor('#ccccff');

    /* target selector */
    selector = this.add.sprite(-500, -500, 'selector');

    /* xplode anime creation */
    var deathConfig = {
        key: 'deathMob',
        frames: this.anims.generateFrameNumbers('skinssheet', {
            start: 3,
            end: 5,
            first: 3,

        }),
        frameRate: 6
    };
    this.anims.create(deathConfig);

}
var boomtest;
var lastrefresh = Date.now();
var updateRate = null;

function update() {

    var nowRefresh = Date.now();
    updateRate = nowRefresh - lastrefresh;
    lastrefresh = nowRefresh;

    /* mouse event */

    const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);

    caseX = layer.worldToTileX(worldPoint.x);
    caseY = layer.worldToTileY(worldPoint.y);
    $('.coords').html(caseX + ',' + caseY);
    /* cursor */
    cursor.x = layer.tileToWorldX(caseX) + 16;
    cursor.y = layer.tileToWorldY(caseY) + 16;



    /* direction selection */
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
    pd.aim = [caseX, caseY];



    if (this.input.manager.activePointer.isDown && !cooldowns.move) {
        /* move order to new case */
        var tx = pd.x;
        var ty = pd.y;

        var moveCase = 1;

        if (caseX > pd.x) {
            tx = pd.x + moveCase;
        }
        if (caseX < pd.x) {
            tx = pd.x - moveCase;
        }
        if (caseY > pd.y) {
            ty = pd.y + moveCase;
        }
        if (caseY < pd.y) {
            ty = pd.y - moveCase;
        }
        if (tx != pd.x || ty != pd.y) {
            tools.cooldown('move', cooldownbible.move);
            ws.send(JSON.stringify({
                'move': [tx, ty]
            }));
        }
    }


    /* UPDATE CHARACTERS */


    for (loopIndexPeople = 0; loopIndexPeople < peoplehere.length; loopIndexPeople++) {
        var keum = peoplehere[loopIndexPeople];
        var px = layer.tileToWorldX(keum.x) + tilesize / 2;
        var py = layer.tileToWorldY(keum.y);
        var tx = layer.tileToWorldX(keum.x);
        var ty = layer.tileToWorldY(keum.y) + labelOffset;
        var lx = layer.tileToWorldX(keum.x) + lifebarOffsetX;
        var ly = layer.tileToWorldY(keum.y) + lifebarOffsetY;

        if ($.inArray(keum.name, drawnPeopleIndex) < 0) {
            /* create a character */
            if (!keum.mob) {
                tools.createCharacter(this, keum.name, keum.skin, keum.x, keum.y);
                tools.notice(keum.name + ' is back online');
            } else {
                var mobname = mobsbible[keum.mob].name[lang];
                tools.createCharacter(this, keum.name, keum.skin, keum.x, keum.y, mobname);
            }
        } else {
            /* update character */
            /* UPDATE DEAD OR ALIVE */
            if (pd.target && pd.target.id === keum.id) {
                selector.x = drawnPeople[keum.name].sprite.x;
                selector.y = drawnPeople[keum.name].sprite.y - 42;
            }

            drawnPeople[keum.name].sprite.setDepth(keum.y);
            for (killindex = 0; killindex < killingPile.length; killindex++) {
                if (keum.name === killingPile[killindex]) {

                    var boom = this.add.sprite(drawnPeople[keum.name].sprite.x, drawnPeople[keum.name].sprite.y, 'skinssheet');
                    boom.anims.play('deathMob');
                    boom.on('animationcomplete', animComplete, this);
                    drawnPeople[keum.name].sprite.destroy();
                    drawnPeople[keum.name].lifebar.destroy();
                    if (drawnPeople[keum.name].label) drawnPeople[keum.name].label.destroy();
                    delete drawnPeople[keum.name];
                    for (dpi = 0; dpi < drawnPeopleIndex.length; dpi++) {
                        if (drawnPeopleIndex[dpi] === keum.name) {
                            drawnPeopleIndex.splice(dpi, 1);
                        }
                    }
                    killingPile.splice(killindex, 1);
                    peoplehere.splice(loopIndexPeople, 1);
                    keum.killMob = 1;
                }
            }

            if (keum.isdead || keum.killMob) {
                /* UPDATE IS DEAD */
                if (keum.isdead && !drawnPeople[keum.name].sprite.frame.name !== 0) {
                    drawnPeople[keum.name].sprite.setFrame(0);
                    drawnPeople[keum.name].sprite.clearTint();
                }
            } else {
                /* UPDATE IF NOT DEAD */
                tools.fluidmove(drawnPeople[keum.name].sprite, px, py);
                tools.fluidmove(drawnPeople[keum.name].lifebar, lx, ly);
                if (drawnPeople[keum.name].label) tools.fluidmove(drawnPeople[keum.name].label, tx, ty);
                var percentLife = keum.life.now / keum.life.max;
                drawnPeople[keum.name].lifebar.setScale(percentLife, 0.25);

                if (drawnPeople[keum.name].sprite.frame.name !== keum.skin) {
                    drawnPeople[keum.name].sprite.setFrame(keum.skin);
                }

                if (drawnPeople[keum.name].label && keum.pk != drawnPeople[keum.name].pk) {
                    drawnPeople[keum.name].pk = keum.pk;
                }

                /* apply cursor for power delayed LOL */
                if (keum.cursorDelayTrigger) {
                    // console.log(keum.cursorDelayTrigger);
                    if (keum.cursorPowerDelayedSprite) keum.cursorPowerDelayedSprite.destroy();
                    keum.cursorPowerDelayed = keum.cursorDelayTrigger / 10;
                    keum.cursorDelayTrigger = null;
                    keum.cursorPowerDelayedSprite = this.add.sprite(layer.tileToWorldX(keum.aim[0]) + 16, layer.tileToWorldX(keum.aim[1]) + 16, 'fxtiles', 1);
                    keum.cursorPowerDelayedSprite.setDepth(-1).setAlpha(0.5);
                }


                if (keum.release && keum.cursorPowerDelayedSprite) {
                    keum.cursorPowerDelayedSprite.destroy();
                    keum.cursorPowerDelayedSprite = null;
                    keum.release = false;
                }


                /* holding */
                if (keum.holdDrawTrigger) {
                    keum.holdDrawTrigger = false;
                    var repeat = keum.cursorPowerDelayed / 50;
                    /* animation shaking */
                    /*
                    var config = {
                        targets: drawnPeople[keum.name].sprite,
                        x: {
                            getEnd: function (target, key, value) {
                                return value + Phaser.Math.Between(-10, 10);
                            }
                        },
                        ease: 'Linear',
                        duration: 50,
                        yoyo: true,
                        repeat: repeat
                    };
                    if (keum.id === pd.id) {
                        this.cameras.main.stopFollow(player);
                        var that = this;
                        config.onComplete = function () {
                            that.cameras.main.startFollow(player);
                        }
                    }
                    keum.shakingtween = this.tweens.add(config);
                    */
                }







                /* power USE LOL */

                if (keum.poweruse) {
                    var power = keum.poweruse.power;
                    var surface = keum.poweruse.surface;
                    keum.poweruse = false;
                    mySoundHook('foutrage');
                    var powersAnimeArray = [];

                    for (powerUseIndex = 0; powerUseIndex < surface.length; powerUseIndex++) {
                        var x = layer.tileToWorldX(surface[powerUseIndex][0]) + 16;
                        var y = layer.tileToWorldY(surface[powerUseIndex][1]) + 16;

                        var firstFrame = powersbible[power].sprite * 3;
                        var lastFrame = firstFrame + 2;
                        if (!animsLib[power]) {
                            //  console.log('generating anime' + firstFrame + ' to ' + lastFrame);
                            var config = {
                                key: power + 'explode',
                                frames: this.anims.generateFrameNumbers('powers', {
                                    start: firstFrame,
                                    end: lastFrame,
                                    first: firstFrame
                                }),
                                frameRate: 6
                            };
                            animsLib[power] = this.anims.create(config);
                        }



                        var sprite = this.add.sprite(x, y, 'powers');
                        sprite.anims.play(power + 'explode');



                        if (powersbible[power].depth === 1)
                            sprite.setDepth(99);
                        else
                            sprite.setDepth(0);
                        powersAnimeArray.push(sprite);
                    }
                    var Pduration = powersbible[power].duration * ticrate;
                    durationsLib.push({
                        'timeleft': Pduration, // duration en MS
                        'spriteArray': powersAnimeArray
                    });


                    /* animation power use */
                    /*
                    this.tweens.add({
                        targets: keum[powerspritekey],
                        scaleX: 1.5,
                        scaleY: 1.5,
                        duration: powersbible[power].duration * 50,
                        delay: 0,
                        repeat: 0,
                        yoyo: true,
                        ease: 'Circ',
                        repeatDelay: 0,
                        onComplete: function (tween, targets) {
                            for (tweenPowerIndex = 0; tweenPowerIndex < targets.length; tweenPowerIndex++) {
                                targets[tweenPowerIndex].destroy();
                            }
                        }
                    });*/

                }


                /* damaged */
                if (keum.damaged) {
                    var damage = keum.damaged;
                    keum.damaged = null;
                    keum.damageLabel = this.add.bitmapText(drawnPeople[keum.name].sprite.x, drawnPeople[keum.name].sprite.y - 64, 'pixelfont', damage);
                    keum.damageLabel.setTint(0xff0000);
                    keum.damageLabel.setDepth(200);


                    var rangeDom = 50;
                    var randX = tools.getRandomInt(rangeDom) - rangeDom / 2;
                    var randY = tools.getRandomInt(rangeDom) - rangeDom / 2;
                    var duration = 500;
                    /* animation damage label */
                    this.tweens.add({
                        targets: keum.damageLabel,
                        props: {
                            x: {
                                'value': '+=' + randX,
                                'duration': duration,
                            },
                            y: {
                                'value': '+=' + randY,
                                'duration': duration,
                            }
                        },
                        duration: duration,
                        repeat: 0,
                        onComplete: function (tween, targets) {
                            for (damageIndex = 0; damageIndex < targets.length; damageIndex++) {
                                targets[damageIndex].destroy();
                            }
                        }
                    });
                    drawnPeople[keum.name].sprite.clearTint();
                    drawnPeople[keum.name].sprite.setTint(0xff0000);
                    keum.hurtimer = 20;
                }

                /* TIMERS */

                if (keum.hurtimer) {
                    keum.hurtimer--;
                    if (keum.hurtimer === 0) {
                        drawnPeople[keum.name].sprite.clearTint();
                    }
                }
            }

        }
    }


    for (pin = 0; pin < powerUseDrawing.length; pin++) {

        var power = powerUseDrawing[pin].power;
        var surface = powerUseDrawing[pin].surface;

        mySoundHook('foutrage');
        var powersAnimeArray = [];

        for (powerUseIndex = 0; powerUseIndex < surface.length; powerUseIndex++) {
            var x = layer.tileToWorldX(surface[powerUseIndex][0]) + 16;
            var y = layer.tileToWorldY(surface[powerUseIndex][1]) + 16;

            var firstFrame = powersbible[power].sprite * 3;
            var lastFrame = firstFrame + 2;
            if (!animsLib[power]) {
                //   console.log('generating anime' + firstFrame + ' to ' + lastFrame);
                var config = {
                    key: power + 'explode',
                    frames: this.anims.generateFrameNumbers('powers', {
                        start: firstFrame,
                        end: lastFrame,
                        first: firstFrame
                    }),
                    frameRate: 6
                };
                animsLib[power] = this.anims.create(config);
            }


            // console.log(power);
            var sprite = this.add.sprite(x, y, 'powers');
            sprite.anims.play(power + 'explode');



            if (powersbible[power].depth === 1)
                sprite.setDepth(99);
            else
                sprite.setDepth(0);
            powersAnimeArray.push(sprite);
        }
        var Pduration = powersbible[power].duration * ticrate;
        durationsLib.push({
            'timeleft': Pduration, // duration en MS
            'spriteArray': powersAnimeArray
        });
    }


    powerUseDrawing = [];


    /* update cooldowns */
    $.each(pd.mypowertimer, function (key, value) {
        if (pd.mypowertimer[key]) {
            var timer = pd.mypowertimer[key];
            value = timer.getTimeLeft();

            var keyElem = $('.power' + key);
            //console.log(key);
            if (value > 0) {
                keyElem.addClass('cooling');
                $('.power' + key + ' .cooldown').html(value);
            } else {
                keyElem.removeClass('cooling');
                $('.power' + key + ' .cooldown').html("");
                pd.mypowertimer[key] = null;
            }

        }

    });

    tools.killDurations(durationsLib);






    /* UPDATE ITEMS IN WORLD */
    if (pd.itemsInWorld) {
        var that = this;
        pd.itemsHere = [];
        $.each(pd.itemsInWorld, function (key, value) {
            var ditem = value;

            // var ditem = pd.itemsInWorld[itemIndex];
            if (ditem && !ditem.drawn) {
                var iX = layer.tileToWorldX(ditem.map[1]) + 16;
                var iY = layer.tileToWorldY(ditem.map[2]) + 16;
                drawnItems[key] = {
                    'sprite': that.add.sprite(iX, iY, 'loot', 0),
                    'uid': ditem.uid
                }
                drawnItems[key].sprite.setScale(0.5);
                ditem.drawn = true;
                console.log('drawin item ' + ditem.uid +', total : '+ Object.keys(drawnItems).length);

            }


            if (pd.x == ditem.map[1] && pd.y == ditem.map[2]) {
                var loot = lootbible[ditem.id].name.fr;
                pd.itemsHere.push(ditem.uid);
            }
        });
    }

    /* item removal */
    $.each(drawnItems, function (key, dritem) {
        if (!pd.itemsInWorld['item' + dritem.uid]) {
            dritem.sprite.destroy();
            console.log('removing ' + dritem.uid + ' object from world');
            delete drawnItems[key];
        }
    });









} /* end of update */

function animComplete(animation, frame, gameobject) {
    gameobject.destroy();
}