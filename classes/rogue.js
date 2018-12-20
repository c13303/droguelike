/* file created by charles.torris@gmail.com */

module.exports = {
    wss: [],
    bibles: {},
    tools: null,
    DelayAoE: [],
    mapAoE: [],
    wallz: [],
    mobs: [],
    mapSize: 64,
    maxLevels: 64,
    itemsUid: 0,
    formatPeople(ws) {
        var msg = {
            id: ws.id,
            name: ws.name,
            x: ws.data.x,
            y: ws.data.y,
            z: ws.data.z,
            angle: ws.data.angle,
            or: ws.data.orientation,
            skin: ws.data.skin,
            life: ws.data.life
        };

        if (ws.data.damaged) msg.damaged = ws.data.damaged;
        if (ws.data.isdead) msg.isdead = ws.data.isdead;
        if (ws.data.secured) msg.secured = ws.data.secured;
        if (ws.data.holdingPower) msg.isH = {
            "delay": ws.data.holdingPower.power.delay,
            "aim": ws.data.holdingPower.aim
        };
        if (ws.data.pk) msg.pk = ws.data.pk;
        if (ws.data.rez_signal) {
            msg.isdead = ws.data.isdead;
            msg.rez_signal = 1;
        }


        return (msg);
    },
    formatMob(mob) {
        var format = {
            id: mob.id,
            name: mob.name,
            mob: mob.mob,
            x: mob.x,
            y: mob.y,
            skin: mob.skin,
            life: {
                now: mob.life.now,
                max: mob.life.max
            },
            "damage": mob.damage,
            "defense": mob.defense,
            attack: false,
            damaged: mob.damaged
        };
        return (format);
    },
    getPeopleInZ(z, wss, ws) {
        var here = [];
        var that = this;
        here.push(this.formatPeople(ws)); // le player est peoplehere[0]
        wss.clients.forEach(function each(client) {
            if (!client.data) return null;
            if (client.data.z === z && client.data.name != ws.name) {
                here.push(that.formatPeople(client));
            }
        });
        return here;
    },
    getMobsInZ(z, mobs) {
        var here = [];
        for (iz = 0; iz < mobs.length; iz++) {
            if (mobs[iz].z === z) {
                var fMob = this.formatMob(mobs[iz]);
                here.push(fMob);
            }
        }
        return here;
    },
    getItemsInZ(z, item) {
        return null;
    },
    getNextMove(x, y, tx, ty) {
        var update = false;
        if (tx > x) {
            x++;
            update = true;
        }
        if (tx < x) {
            x--;
            update = true;
        }
        if (ty > y) {
            y++;
            update = true;
        }
        if (ty < y) {
            y--;
            update = true;
        }
        return {
            x: x,
            y: y,
            update: update
        }
    },
    getRandomMove(x, y) {
        var rx = x + 1 - this.tools.getRandomInt(3);
        var ry = y + 1 - this.tools.getRandomInt(3);
        if (rx < 0) rx = 0;
        if (ry < 0) ry = 0;
        if (rx > 63) rx = 63;
        if (ry > 63) ry = 63;
        return ([rx, ry]);
    },
    isPlayerHere(wss, x, y, z, idPlayer = null) {
        var that = null;
        wss.clients.forEach(function each(client) {
            if (client.id != idPlayer && client.data.x === x && client.data.y === y && client.data.z === z) {
                that = client;
            }
        });
        return that;
    },
    isMonsterHere(mobs, x, y, z, currentMobId = null) {
        var that = null;
        for (m = 0; m < mobs.length; m++) {
            if (mobs[m].x === x && mobs[m].y === y && mobs[m].z === z) {
                if (currentMobId !== m) {
                    that = mobs[m];
                }
            }
        }
        return that;
    },
    isWall(x, y, z) {
        if (this.wallz[z][x][y] > -1) return true;
        else return false;
    },
    isObstacle(x, y, z, idPlayer = null, mobId = null) {
        var mobs = this.mobs;
        var wss = this.wss;

        if (!this.wallz[z]) {
            console.log('NO WALLZ LOOOL' + z);
            process.exit();
        }
        if (this.isWall(x, y, z))
            return "wall";

        var isplayer = this.isPlayerHere(wss, x, y, z, idPlayer);
        if (isplayer) return ({
            "player": isplayer
        });

        var ismob = this.isMonsterHere(mobs, x, y, z, mobId);
        if (ismob) return {
            "mob": ismob
        };

        return (null);
    },

    updateMyPosition(ws) {
        if (!ws || !ws.data || !this.wss) return null;
        var pud = this.formatPeople(ws);
        this.wss.addToWaiting('waitingPuds', ws.data.z, pud);

    },
    updatePowerUse(id, z, poweruse, surface, uid = null) {
        // console.log('update Power use '+surface.length);
        var msg = {
            'who': id,
            'pwup': poweruse,
            'surf': surface
        };
        if (uid) msg.uid = uid;

        this.wss.addToWaiting('waitingPowers', z, msg);
    },
    updateItems(z, addOrRem, item, who = 0) {
        // console.log('add to update items ' + addOrRem + ' : ' + item.id);
        var msg = {
            'way': addOrRem,
            'item': item
        };
        if (who) msg.who = who;
        this.wss.addToWaiting('waitingItems', z, msg);
    },




    /* AREA OF EFFECT AoE */
    powerUse(actor, powerkeyboard, aim, DelayAoE, mapAoE, afterHold = false, isMob = false) {
        var debug = false;
        var fatal = this.tools.fatal;

        if (!isMob) {
            var departX = actor.data.x;
            var departY = actor.data.y;
            var monZ = actor.data.z;
        } else {
            /* formatage actor isMob */
            var departX = actor.x;
            var departY = actor.y;
            var monZ = actor.z;
            var power = powerkeyboard;
            var powerId = power.id;
        }

        if (afterHold) {
            var power = powerkeyboard;
            var powerId = power.id;
            if (isMob && powerId === 'nazi') console.log('--- afterHold ' + power.name.en);
        } else if (!isMob) {

            /* power use from player only */
            var equiped = actor.data.powers_equiped[powerkeyboard];
            if (!equiped) return null;
            var powerId = equiped.k;
            var power = this.bibles.powers[powerId];
            if (!isMob && debug) console.log('Using It ' + power.name.en);
            if (actor.data.powers_cooldowns[powerId] > 0) {
                /* skill not ready */
                if (!isMob && debug) console.log('still cooling, abort ' + power.name.en);
                return null;
            } else {
                actor.data.powers_cooldowns[powerId] = null;
            }
        }
        if (!power || !power.type) {
            fatal('powerUSE POWER UNDEFINED');
            console.log('power not defined error . Afterhold : ' + afterHold);
            return null;
        }
        if (!isMob) actor.data.powers_cooldowns[powerId] = power.powercool / this.tickrate; //powercool = nombre de cycles 

        if (power.delay && !afterHold) {
            /* HOLDING POWER IN CASE OF POWER DELAY */
            if (!isMob && debug) console.log('Holding it' + power.name.en);
            var surface = this.tools.calculateSurface(departX, departY, monZ, aim, power, this.wallz);
            if (!isMob) {
                actor.data.movecooling = true;
                actor.setMoveCool(power.delay, power);
                actor.data.holdingPower = {
                    power: power,
                    aim: surface[0], // first point 
                }
                this.updateMyPosition(actor);
                return null;
            } else {
                /* mob holding */
                if (isMob && powerId === 'nazi') console.log('set tup holding');
                if(!aim) fatal('no aim at mob is holding');
                actor.movecool = power.delay / 100;
                var that = this;
                setTimeout(function () {
                    that.powerUse(actor, power, aim, DelayAoE, mapAoE, true, true);
                }, power.delay);
            }

        }
        if (afterHold && !isMob) {
            actor.data.holdingPower = false;
        }
        if (isMob && powerId === 'nazi') console.log('RELEASE !' + power.name.en);
        /* calcul of AREA O_____O + duration of effect */
        var surface = this.tools.calculateSurface(departX, departY, monZ, aim, power, this.wallz);
        //if (isMob && powerId === 'nazi') fatal ('surface mob nazi',surface);
        for (is = 0; is < surface.length; is++) {
            var damage = this.getDamage(actor, power);
            var x = surface[is][0];
            var y = surface[is][1];
            var delay = surface[is][2];

            var content = {
                'map': [monZ, x, y],
                'power': powerId,
                'damage': damage,
                'owner': !isMob ? actor.id : 'mob',
                'cooldown': power.duration,
                'isMob': isMob,
                'delay': delay
            };
            content.uid = actor.id;

            // content.uid = monZ + '_' + powerId + '_' + content.owner + '_' + delay;


            if (x > 0 && y > 0 && x < this.mapSize && y < this.mapSize) {
               // if (debug) console.log('pushing tileFX on ' + x + ',' + y);
                DelayAoE.push(content);
            }
            /* debug nazi */
            if (isMob && powerId === 'nazi') {
                console.log('debug nazi delayAOE.push ' + DelayAoE.length);
                //console.log('debug nazi content ' + content);
                console.log(actor.id + ' : movecool ' + actor.movecool);
            }
        }
        if (!isMob) {
            actor.data.poweruse = powerId;
        }
        /// add to refresh client pile
    },
    getDefenses(ws) {
        if (ws.data) {
            var dataref = ws.data;
        } else {
            var dataref = ws;
        }
        if (!dataref.defense) {
            console.log('error def');
            this.tools.report(dataref);
            process.exit();
        }
        var def = {
            "social": dataref.defense.social + dataref.defense.social * dataref.defense.social_mod ? dataref.defense.social_mod : 0,
            "sex": dataref.defense.sex + dataref.defense.sex * dataref.defense.sex_mod ? dataref.defense.sex_mod : 0,
            "money": dataref.defense.money + dataref.defense.money * dataref.defense.money_mod ? dataref.defense.money_mod : 0
        }
        return (def);
    },
    getDamage(ws, power) {
        if (ws.data) {
            var dataref = ws.data;
            var from = 'player ' + dataref.name;
        } else {
            var dataref = ws;
            var from = 'mob ' + dataref.id;
        }
        if (!dataref.damage) this.tools.fatal('getDamage no damage', dataref);
        var damage = {
            "social": dataref.damage.social + power.damage.social,
            "sex": dataref.damage.sex + power.damage.sex,
            "money": dataref.damage.money + power.damage.money
        }
        /*
                this.tools.fatal('Dataref',dataref.damage,false);
                this.tools.fatal('Power',power.damage,false);
                this.tools.fatal('Damage',damage,false);
        */
        return (damage);
    },
    getAppliedDamage(damages, defenses) {

        var aDamage = {
            "social": damages.social - defenses.social,
            "sex": damages.sex - defenses.sex,
            "money": damages.money - defenses.money
        }
        var damage = aDamage.social + aDamage.sex + aDamage.money;
        if (isNaN(damage)) this.tools.fatal(' getAppliedDamage no damage', dataref);

        if (damage < 0) {
            damage = 0;
        }

        return (damage);
    },
    createItem(id = null, map = [null, null, null], playerSlot = [null, null], itemUpdate = null) {
        var debug = true;
        if (!itemUpdate) {
            var clone = JSON.parse(JSON.stringify(this.item_example));
            clone.id = id;
            this.itemsUid++;
            clone.uid = this.itemsUid;
        } else {
            clone = itemUpdate;
            if (!clone.uid) {
                console.log('ERREUR UID LOST');
                process.exit();
            }
        }

        var itemRef = this.bibles.loot[clone.id];
        if (map) {
            clone.map = map;
            var z = map[0];
            var ref = 'item' + clone.uid;
            this.itemsInWorld[z][ref] = clone;
            //if (debug) console.log(itemRef.name.fr + ' dropped into ' + map[1] + ',' + map[2] + ',' + map[0]);
            this.updateItems(z, "add", clone);
        }
        if (playerSlot[0]) {
            clone.player = playerSlot;
            var idPlayer = playerSlot[0];
            var player = this.wss.getClientFromId(idPlayer);
            if (!player || !player.data) {
                console.log('ERROR : pickup from unknown player ' + playerSlot[0]);
                process.exit();
            }
            var key = 'item' + clone.uid;
            player.data.inv[key] = clone;
            //if (debug) console.log(player.data.name + ' gets ' + itemRef.name.fr);

            /* TODO ? was the item in the world, does it needs to be removed ? */

            this.updateItems(player.data.z, "rem", clone, player.id);
            player.send(JSON.stringify({
                'myItems': player.data.inv,
            }));
        }
        return clone;
    },
    equipItem(ws, equipUID, slot) {
        /* on trouve litem dans linventory */
        Object.keys(ws.data.inv).forEach(function (itemkey) {
            var item = ws.data.inv[itemkey];
            if (item.uid === equipUID) {
                //   console.log('chaussing ' + item.id + ' in slot ' + slot);
                /* was equiped ? */
                if (item.isEquiped) {
                    ws.data.equip[item.isEquiped] = 0;
                }


                /* remove old item in new slot*/
                var oldItem = ws.data.equip[slot];
                if (oldItem) {
                    oldItem.isEquiped = 0;
                    //  console.log(oldItem.uid + ' uneuqiped');
                }

                var ky = 'item' + item.uid;
                ws.data.equip[slot] = item;
                ws.data.inv[ky].isEquiped = slot;


                return null;
            }
        });
        this.updatePowersEquiped(ws);
    },
    /* UPDATE POWERS AND MODIFIERS */
    updatePowersEquiped(ws) {
        ws.data.powers_equiped.auto.k = null;
        ws.data.powers_equiped.a.k = null;
        ws.data.powers_equiped.b.k = null;
        ws.data.powers_equiped.c.k = null;
        ws.data.powers_equiped.d.k = null;
        ws.data.damage = {
            "social": 0,
            "sex": 0,
            "money": 0,
            "social_mod": 0,
            "sex_mod": 0,
            "money_mod": 0
        }
        ws.data.defense = {
            "social": 0,
            "sex": 0,
            "money": 0,
            "social_mod": 0,
            "sex_mod": 0,
            "money_mod": 0
        }

        for (eqi = 0; eqi < ws.data.equip.length; eqi++) {
            var equItem = ws.data.equip[eqi];
            if (equItem) {
                var lootref = this.bibles.loot[equItem.id];

                if (lootref.damage) {
                    if (lootref.damage.social) ws.data.damage.social += lootref.damage.social;
                    if (lootref.damage.sex) ws.data.damage.sex += lootref.damage.sex;
                    if (lootref.damage.money) ws.data.damage.money += lootref.damage.money;
                    if (lootref.damage.social_mod) ws.data.damage.social_mod += lootref.damage.social_mod;
                    if (lootref.damage.sex_mod) ws.data.damage.sex_mod += lootref.damage.sex_mod
                    if (lootref.damage.money_mod) ws.data.damage.money_mod += lootref.damage.money_mod;
                }

                if (lootref.defense) {
                    if (lootref.defense.social) ws.data.defense.social += lootref.defense.social;
                    if (lootref.defense.sex) ws.data.defense.sex += lootref.defense.sex;
                    if (lootref.defense.money) ws.data.defense.money += lootref.defense.money;
                    if (lootref.defense.social_mod) ws.data.defense.social_mod += lootref.defense.social_mod;
                    if (lootref.defense.sex_mod) ws.data.defense.sex_mod += lootref.defense.sex_mod
                    if (lootref.defense.money_mod) ws.data.defense.money_mod += lootref.defense.money_mod;
                }


                if (lootref.powers.length) {
                    for (pi = 0; pi < lootref.powers.length; pi++) {

                        // console.log('Equiping type : ' + eqi);
                        //  console.log(lootref);

                        if (eqi === 6) { // main droite
                            ws.data.powers_equiped.auto.k = lootref.powers[pi];
                            ws.data.powers_equiped.a.k = lootref.powers[pi];
                        }
                        if (eqi === 8) { // main gauche
                            ws.data.powers_equiped.b.k = lootref.powers[pi];
                        }
                        if (eqi === 1) { // tete
                            ws.data.powers_equiped.c.k = lootref.powers[pi];
                        }
                        if (eqi === 3) { // slip
                            ws.data.powers_equiped.d.k = lootref.powers[pi];
                        }
                    }

                }
            }

        }
        //  console.log(ws.data.powers_equiped);
        ws.send(JSON.stringify({
            'pdata': ws.data,
            'myPowers': ws.data.powers_equiped,
        }));
    }


}