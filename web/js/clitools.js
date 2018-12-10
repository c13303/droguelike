function timer(callback, delay) {
    var id, started, remaining = delay,
        running;

    this.start = function () {
        running = true;
        started = new Date();
        id = setTimeout(callback, remaining);
    }

    this.pause = function () {
        running = false;
        clearTimeout(id);
        remaining -= new Date() - started;
    }

    this.getTimeLeft = function () {
        if (running) {
            this.pause();
            this.start();
        }

        return remaining;
    }

    this.getStateRunning = function () {
        return running;
    }

    this.start();
}

var tools = {
    peoplehere: null,
    getRandomInt: function (max) {
        return Math.floor(Math.random() * Math.floor(max));
    },
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
        for (bi = 0; bi < peoplehere.length; bi++) {
            if (peoplehere[bi].id === id) {
                peoplehere[bi][key] = value;
                // return (peoplehere[i]); // fait planter quand trop rapproché 4 some reason o_O
            }
        }
    },
    createCharacter(that, name, skin, x, y, isMob = false) {
        var oriX = layer.tileToWorldX(x);
        var x = oriX + tilesize / 2;
        var y = layer.tileToWorldY(y);
        var char = that.add.sprite(x, y, 'skinssheet', skin);

        drawnPeopleIndex.push(name);
        drawnPeople[name] = {};
        drawnPeople[name].sprite = char;
        if (!isMob) {
            drawnPeople[name].label = that.add.text(oriX, y + labelOffset, name, {
                fontFamily: 'cioFont',
                fontSize : "12px",
                align: "center",
                fill: '#dcf5ff'
            });
            drawnPeople[name].label.setAlign('center');
            drawnPeople[name].label.setDepth(100);
        }
        drawnPeople[name].lifebar = that.add.sprite(oriX + lifebarOffsetX, y + lifebarOffsetY, 'fxtiles', 0);
        drawnPeople[name].lifebar.setScale(1, 0.25);
        drawnPeople[name].lifebar.setDepth(-0.1);
        return (char);
    },
    updatePlayer(pud) {
        var found = false;
        for (PeopleUpdateIndex = 0; PeopleUpdateIndex < peoplehere.length; PeopleUpdateIndex++) {
            if (pud.id === peoplehere[PeopleUpdateIndex].id) {
                if (pud.name === pd.name) { // if player 1
                    pd.x = pud.x;
                    pd.y = pud.y;
                    pd.holding = pud.isH ? true : false;
                }

                if (pud.isH) { /*holding power and shake delay */
                    // console.log(pud.isH);
                    peoplehere[PeopleUpdateIndex].release = null;
                    peoplehere[PeopleUpdateIndex].holdDrawTrigger = true;
                    peoplehere[PeopleUpdateIndex].cursorDelayTrigger = pud.isH.delay;
                    peoplehere[PeopleUpdateIndex].aim = pud.isH.aim;
                }

                $.each(pud, function (key, value) {
                    peoplehere[PeopleUpdateIndex][key] = value;
                });
                found = true;
            }
        }
        if (!found) { //newplayer
            peoplehere.push(pud);
        }
    },
    killMobs(killingPile) {
        console.log(peoplehere);
        console.log(killingPile);

        /*
        for (dmi = 0; dmi < peoplehere.length; dmi++) {
            for (dmj = 0; dmj < killingPile.length; dmj++) {
                if (killingPile[dmj] === peoplehere[dmi].id) {
                    console.log('KillMobs : killing ' + peoplehere[dmi].name);
                    peoplehere[dmi].killMob = true;
                    killingPile.splice(dmj,1);
                }
            }
        }*/
        $.each(peoplehere, function (indexKeum, keum) {
            $.each(killingPile, function (indexKill, kill) {
                if (kill === keum.id) {
                    keum.killMob = true;
                    killingPile.splice(indexKill, 1);
                }
            });
        });
    },
    notice(c) {
        var wtf = $('#console');
        wtf.append('<br/>' + c);
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    },
    fluidmove(object, px, py) {
        var dt = 2;
        if (px > object.x)
            object.x += dt;
        if (px < object.x)
            object.x -= dt;
        if (py > object.y)
            object.y += dt;
        if (py < object.y)
            object.y -= dt;
    },

    checkKey(evt) {
        var keyID = (evt.charCode) ? evt.charCode : ((evt.which) ? evt.which : evt.keyCode);
        return (keyID);
    },
    matrix(rows, cols, defaultValue) {
        var arr = [];
        for (var i = 0; i < rows; i++) {
            arr.push([]);
            arr[i].push(new Array(cols));
            for (var j = 0; j < cols; j++) {
                arr[i][j] = defaultValue;
            }
        }
        return arr;
    },
    killDurations(durationsLib) {
        if (durationsLib) {
            for (durIndex = 0; durIndex < durationsLib.length; durIndex++) {
                durationsLib[durIndex].timeleft = durationsLib[durIndex].timeleft - updateRate;
                if (durationsLib[durIndex].timeleft <= 0) {
                    /* destroy all powers*/
                    for (spriteArrayIndex = 0; spriteArrayIndex < durationsLib[durIndex].spriteArray.length; spriteArrayIndex++) {
                        durationsLib[durIndex].spriteArray[spriteArrayIndex].destroy();
                    }
                }
            }
        }
    },
    updateMyItems(items){
        console.log(items);

    }


};