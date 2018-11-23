/* file created by charles.torris@gmail.com */

module.exports = {
    wss: null,
    bibles: null,
    tools: null,
    data_example: {
        'id': 0,
        'name': '',
        'x': 0,
        'y': 0,
        'z': 0,
        'level': 0,
        'life': 0,
        'skin': 0,
        'lang': 'en',
        'movecooling': false,
        'pk': false,
        stats: {
            masse: 0,
            anest: 0,
        },
        powers_inventory: ['slap'],
        powers_cooldowns: {},
        powers_equiped: {
            auto: {
                k: 'slap',
                cool: 0
            },
            a: {
                k: 'ass',
                cool: 0
            },
            b: {
                k: 'slap',
                cool: 0
            },
            c: null,
            d: null,
        },
        'equip': {
            'head': 0,
            'body': 0,
            'r_hand': 0,
            'l_hand': 0,
            'legs': 0
        },
        'inv': [],
        'house': {
            x: 0,
            y: 0,
            inv: []
        },
        security: {
            'last': 0,
            'floods': 0,
        }
    },
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
            pk: ws.data.pk
        });
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
    whoIsThere(ws, wss, x, y, z) {
        var that = null;
        wss.clients.forEach(function each(client) {
            if (client.name != ws.name && client.data.x === x && client.data.y === y && client.data.z === z) {
                that = client;
            }
        });

        return that;
    },
    updateMyPosition(ws, wss) {
        try {
            if (!ws || !ws.data) return null;
            var that = this;
            wss.clients.forEach(function each(client) {
                if (client.data.z === ws.data.z) {
                    client.send(JSON.stringify({
                        'pud': that.formatPeople(ws)
                    }));
                }
            });
        } catch (e) {
            report(e);
        }
    },
    updatePowerUse(ws, surface) {
        this.wss.clients.forEach(function each(client) {
            if (client.data.z === ws.data.z) {
                client.send(JSON.stringify({
                    'who': ws.id,
                    'pwup': ws.data.poweruse,
                    'surf': surface
                }));
            }
        });
    },
    coolme(ws, key, time) {
        ws.send(JSON.stringify({
            "coolme": 1,
            "key": key,
            "time": time
        }));
    },
    powerUse(wss, ws, powerkeyboard, dir) {
        console.log("Use of power key : " + powerkeyboard);
        var equiped = ws.data.powers_equiped[powerkeyboard];
        var powerId = equiped.k;
        var power = this.bibles.powers[powerId];
        if (!power) {
            console.log('error no valid power here ! ' + powerId);
            return null;
        }
        if (ws.data.powers_cooldowns[powerId]) {
            console.log(powerId + " shit still cooling down bitch : " + ws.data.powers_cooldowns[powerId]);
            return null;
        }
        console.log(ws.name + ' tries to use ' + power.name[ws.data.lang]);
        ws.data.powers_cooldowns[powerId] = power.powercool / 100;
        if (power.movecool) {
            ws.setMoveCool(power.movecool);
        }

        /* calcul of AREA O_____O */

        var surface = this.tools.calculateSurface(ws.data.x, ws.data.y, dir, power.surface.dist, power.surface.style, power.surface.size);


        ws.data.poweruse = powerId;
        this.updatePowerUse(ws, surface);
        this.coolme(ws, powerId, power.powercool);
        this.coolme(ws, "move", power.movecool);

    }
}