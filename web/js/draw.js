function preload() {
    console.log('preload');
    this.load.spritesheet("skinssheet", "img/skinssheet.png?v="+v, {
        frameWidth: 64,
        frameHeight: 64
    });
    var v = Date.now();
    this.load.image('selector', 'img/selector.png?v='+v);
    
    this.load.image("decors", "img/decors.png?v="+v);

    this.load.spritesheet("fxtiles", "img/FXtileset.png?v="+v, {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.spritesheet("powers", "img/powers.png?v="+v, {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.spritesheet("explosheet", "img/explo-sheet.png?v="+v, {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.spritesheet("mobs", "img/mobs.png?v="+v, {
        frameWidth: 64,
        frameHeight: 64
    });
}



function create() {
    console.log('Create');
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
        data : wallData,
        tileWidth: 32,
        tileHeight: 32
    });
    var wallTiles = wallzTilemap.addTilesetImage("decors");
    wallLayer = wallzTilemap.createDynamicLayer(0,wallTiles,0,0);
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
    var config = {
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosheet', {
            start: 0,
            end: 2,
            first: 2
        }),
        frameRate: 2
    };
    this.anims.create(config);


}



function update() {

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
        if (tx != pd.x || ty != pd.y) {
            tools.cooldown('move', cooldownbible.move);
            ws.send(JSON.stringify({
                'move': [tx, ty]
            }));
        }
    }


    /* UPDATE CHARACTERS */


    var peopleToSplice = [];
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
                    if (keum.pk) {
                        drawnPeople[keum.name].label.setStyle({
                            fill: '#ff0000'
                        });
                    } else {
                        drawnPeople[keum.name].label.setStyle({
                            fill: '#ffffff'
                        });
                    }
                }





                /* apply cursor for power delayed LOL */
                if (keum.cursorDelayTrigger) {
                   // console.log(keum.cursorDelayTrigger);
                    if(keum.cursorPowerDelayedSprite) keum.cursorPowerDelayedSprite.destroy();
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
                }








                /* power USE LOL */
                if (keum.poweruse) {
                    var power = keum.poweruse.power;
                    var surface = keum.poweruse.surface;
                    keum.poweruse = false;
                    var powerspritekey = 'animepower_' + power;
                    keum[powerspritekey] = [];
                    for (powerUseIndex = 0; powerUseIndex < surface.length; powerUseIndex++) {
                        var x = layer.tileToWorldX(surface[powerUseIndex][0]) + 16;
                        var y = layer.tileToWorldY(surface[powerUseIndex][1]) + 16;
                        var sprite = this.add.sprite(x, y, 'powers', powersbible[power].sprite);
                        if (powersbible[power].depth === 1)
                            sprite.setDepth(99);
                        else
                            sprite.setDepth(0);
                        keum[powerspritekey].push(sprite);
                    }
                    /* animation power use */
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
                    });

                }


                /* damaged */
                if (keum.damaged) {
                    var damage = keum.damaged;
                    keum.damaged = null;
                    keum.damageLabel = this.add.text(drawnPeople[keum.name].sprite.x, drawnPeople[keum.name].sprite.y - 64, damage, {
                        font: '15px cioFont',
                        align: "center",
                        fill: '#d77355'
                    });
                    keum.damageLabel.setDepth(100);
                    var rangeDom = 50;
                    var randX = tools.getRandomInt(rangeDom) - rangeDom / 2;
                    var randY = tools.getRandomInt(rangeDom) - rangeDom / 2;
                    var duration = 500;
                    /* animation damage text */
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

    /* update cooldowns */
    $.each(pd.mypowertimer, function (key, value) {

        if (pd.mypowertimer[key]) {
            var timer = pd.mypowertimer[key];
            value = timer.getTimeLeft();
            if (value > 0) {
                $('.power' + key).addClass('cooling');
                $('.power' + key + ' .cooldown').html(value);
            } else {
                $('.power' + key).removeClass('cooling');
                $('.power' + key + ' .cooldown').html("");
                pd.mypowertimer[key] = null;
            }

        }

    });


} /* end of update */