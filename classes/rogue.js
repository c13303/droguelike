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
        return ({
            id: ws.id,
            name: ws.name,
            x: ws.data.x,
            y: ws.data.y,
            z: ws.data.z,
            skin: ws.data.skin,
            pk: ws.data.pk,
            life: ws.data.life,
            damaged: ws.data.damaged,
            isdead: ws.data.isdead,
            isH: ws.data.holdingPower ? {
                "delay": ws.data.holdingPower.power.delay,
                "aim": ws.data.holdingPower.aim
            } : 0, // is holding power
        });
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
    updatePowerUse(id, z, poweruse, surface) {
        // console.log('update Power use '+surface.length);
        var msg = {
            'who': id,
            'pwup': poweruse,
            'surf': surface
        };
        this.wss.addToWaiting('waitingPowers', z, msg);
    },
    updateItems(z, addOrRem, item, who = 0) {
        console.log('add to update items ' + addOrRem + ' : ' + item.id);
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


        if (!isMob) {
            var departX = actor.data.x;
            var departY = actor.data.y;
            var monZ = actor.data.z;
        } else {
            var departX = actor.x;
            var departY = actor.y;
            var monZ = actor.z;
            var power = powerkeyboard;
            var powerId = power.id;
        }

        if (afterHold) {
            var power = powerkeyboard;
            var powerId = power.id;
            if (!isMob && debug) console.log('--- afterHold ' + power.name.en);
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
                actor.movecool = power.delay;
                setTimeout(function () {
                    rogue.powerUse(actor, power, aime, DelayAoE, mapAoE, true, true);
                }, power.delay);
            }

        }
        if (afterHold && !isMob) {
            actor.data.holdingPower = false;
        }
        if (!isMob && debug) console.log('RELEASE !' + power.name.en);
        /* calcul of AREA O_____O + duration of effect */
        var surface = this.tools.calculateSurface(departX, departY, monZ, aim, power, this.wallz);

        for (is = 0; is < surface.length; is++) {
            var damage = this.getPowerOffensiveDamage(actor, power);
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
            content.uid = monZ + '_' + powerId + '_' + content.owner + '_' + delay;


            if (x > 0 && y > 0 && x < this.mapSize && y < this.mapSize) {
                if (debug) console.log('pushing tileFX on ' + x + ',' + y);
                DelayAoE.push(content);
            }
        }
        if (!isMob) {
            actor.data.poweruse = powerId;
        }
        /// add to refresh client pile
    },
    getDefenses(ws) {
        var defenses = {
            physical: 0,
            humiliation: 0,
            sex: 0,
            sanity: 0,
            karma: 0,
            money: 0
        }
        return (defenses);
    },
    getBuffers(ws) {
        var buffers = {
            physical: 0,
            humiliation: 0,
            sex: 0,
            sanity: 0,
            karma: 0,
            money: 0
        }
        return (buffers);
    },
    getPowerOffensiveDamage(attacker, power) {
        var buffers = this.getBuffers(attacker);
        var damages = {
            physical_damage: power.damage.physical + buffers.physical,
            humiliation_damage: power.damage.humiliation + buffers.physical,
            sanity_damage: power.damage.sanity + buffers.physical,
            sex_damage: power.damage.sex + buffers.physical,
            money_damage: power.damage.money + buffers.physical
        }

        return (damages);
    },
    getAppliedDamage(damages, defenses) {
        var physical_damage = damages.physical_damage - defenses.physical;
        var humiliation_damage = damages.humiliation_damage - defenses.humiliation;
        var sanity_damage = damages.sanity_damage - defenses.sanity;
        var sex_damage = damages.sex_damage - defenses.sex;
        var money_damage = damages.money_damage - defenses.money;
        var damage = physical_damage + humiliation_damage + sanity_damage + sex_damage + money_damage;
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
    updatePowersEquiped(ws) {
        ws.data.powers_equiped.auto.k = null;
        ws.data.powers_equiped.a.k = null;
        ws.data.powers_equiped.b.k = null;
        ws.data.powers_equiped.c.k = null;
        ws.data.powers_equiped.d.k = null;

        for (eqi = 0; eqi < ws.data.equip.length; eqi++) {
            var equItem = ws.data.equip[eqi];


            if (equItem) {
                var lootref = this.bibles.loot[equItem.id];

                if (lootref.powers.length) {
                    for (pi = 0; pi < lootref.powers.length; pi++) {

                        console.log('Equiping type : ' + eqi);
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
            'myPowers': ws.data.powers_equiped,
        }));
    }


}