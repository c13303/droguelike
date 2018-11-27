/* file created by charles.torris@gmail.com */

module.exports = {
    wss: null,
    bibles: null,
    tools: null,
    mapAoE: null,
    mapSize: 64,
    maxLevels: 64,
    getClientFromId(wss, id) {
        var that = null;
        this.wss.clients.forEach(function each(client) {
            if (client.id === id) {
                that = client;
                return that;
            }
        });
        return that;
    },
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
            isdead: ws.data.isdead
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
            damaged : mob.damaged
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
    isPlayerHere(wss, x, y, z, name = null) {
        var that = null;
        wss.clients.forEach(function each(client) {
            if (client.name != name && client.data.x === x && client.data.y === y && client.data.z === z) {
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
    updateMyPosition(ws, wss) {

        if (!ws || !ws.data) return null;
        var pud = this.formatPeople(ws);
        wss.addToWaiting('waitingPuds', ws.data.z, pud);

    },
    updatePowerUse(ws, surface) {
        var msg = {
            'who': ws.id,
            'pwup': ws.data.poweruse,
            'surf': surface
        };
        this.wss.addToWaiting('waitingPowers', ws.data.z, msg);
    },
    powerUse(ws, powerkeyboard, dir, mapAoE) {
        var equiped = ws.data.powers_equiped[powerkeyboard];
        if (!equiped) return null;
        var powerId = equiped.k;
        var power = this.bibles.powers[powerId];
        if (!power) {
            console.log('error no valid power here ! ' + powerId);
            return null;
        }

        //    console.log(ws.name + ' tries to use ' + power.name[ws.data.lang]);


        /* cooldown of power use*/
        if (ws.data.powers_cooldowns[powerId] > 0) {
            console.log(powerId + " shit still cooling down bitch : " + ws.data.powers_cooldowns[powerId]);
            ws.data.security.floods++;
            return null;
        } else {
            ws.data.powers_cooldowns[powerId] = null;
        }
        ws.data.powers_cooldowns[powerId] = power.powercool / 100;
        if (power.movecool) {
            ws.setMoveCool(power.movecool);
        }

        /* calcul of AREA O_____O + duration of effect */

        var surface = this.tools.calculateSurface(ws.data.x, ws.data.y, dir, power.surface.dist, power.surface.style, power.surface.size);
        for (is = 0; is < surface.length; is++) {
            // console.log('surface empiled : ' + surface[is][0]+','+surface[is][1]);
            var x = surface[is][0];
            var y = surface[is][1];
            var content = {
                'power': powerId,
                'damage': this.getPowerOffensiveDamage(ws, power),
                'owner': ws.id,
                'cooldown': power.duration
            };
            if (x > 0 && y > 0 && x < this.mapSize && y < this.mapSize) {
                var arrer = JSON.parse(JSON.stringify(mapAoE[ws.data.z][x][y]));
                arrer.push(content)
                mapAoE[ws.data.z][x][y] = arrer;
            }

        }

        ws.data.poweruse = powerId;
        this.updatePowerUse(ws, surface);
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
    getPowerOffensiveDamage(wsattack, power) {
        var buffers = this.getBuffers(wsattack);
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
    /*
    applyDamage(entity, mapAoE) {
        if (mapAoE.length) {
            var fxs = mapAoE;
            for (ifff = 0; ifff < fxs.length; ifff++) {
                if (fxs[ifff].owner != entity.id) {
                    var damage = fxs[ifff].damage;
                    var defenses = this.getDefenses(entity);
                    var appliedDamage = this.getAppliedDamage(damage, defenses);
                    entity.life.now -= appliedDamage;
                    entity.damaged = appliedDamage;
                    if (entity.life.now <= 0) {
                        var dareport = entity.name + ' killed by ' + fxs[ifff].power + ' from ' + fxs[ifff].owner;
                        entity.life.now = 0;                        
                        entity.isdead = true;           
                        
                    }
                   
                }
            }
        }
        return(entity);
    }
    */


}