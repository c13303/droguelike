const server = require('ws').Server;

class wssx extends server {
    subinit() {
        this.waitingPuds = [];
        this.waitingPowers = [];
        this.waitingCools = [];
        this.waitingItems = [];
    }
    addToWaiting(pile, z, msg) {
        if(isNaN(z)){
            console.log('error Z in pile');
            process.exit();
        }
        if (!this[pile][z]) {
            this[pile][z] = [];
        }
        this[pile][z].push(msg);

       // console.log(pile+ ' updated on '+ z + ' for a total : '+this[pile][z].length);
    }
    verify(info, callback, connection, userRequestMap, data_example) {
        var Filter = require('bad-words');
        var myFilter = new Filter({
            placeHolder: 'x'
        });
        var sha256 = require('js-sha256');
        var urlinfo = info.req.url;
        const ip = info.req.connection.remoteAddress;
        urlinfo = urlinfo.replace('/', '');
        urlinfo = urlinfo.split('-');
        if (!Array.isArray(urlinfo)) {
            callback(false);
        }
        var regex = /^([a-zA-Z0-9_-]+)$/;
        var name = urlinfo[1].toLowerCase();
        var token = urlinfo[0];

        if (name.length > 10) {
            callback(false);
        }

        if (name !== myFilter.clean(name)) {
            callback(false);
        }
        if (!regex.test(name)) {
            callback(false);
        }
        if (!regex.test(token)) {
            callback(false);
        }
        if (!name || !token || !urlinfo[1] || !urlinfo[0]) {
            callback(false);
        }
        if (urlinfo[1].toLowerCase() !== name || urlinfo[0] !== token) {
            console.log('illegal name');
            callback(false);
        }
        this.clients.forEach(function each(client) {
            if (client.name === name) {
                callback(false);
            }
        });
        var token = sha256(token);
        connection.query('SELECT id,name,password FROM players WHERE name=?', [name], function (err, rows, fields) {
            if (rows[0] && rows[0].id) {
                if (rows[0].password === token) {
                    userRequestMap.set(info.req, rows[0]);
                    callback(true);
                } else {
                    console.log(name + ' rejected');
                    callback(false);
                }
            } else {
                var dataclone = JSON.parse(JSON.stringify(data_example));
                var data = JSON.stringify(dataclone);
                connection.query('INSERT INTO players(name,password,data) VALUES (?,?,?)', [name, token, data], function (err) {
                    if (err)
                        console.log(err);
                    else {
                        console.log(' - New PLayer Creation : ' + name);
                        var uzar = {
                            'name': name,
                            'password': token,
                            'id': 'new'
                        };
                        userRequestMap.set(info.req, uzar);
                        callback(true);
                    }
                });
            }
        });
    }

    broadcast(msg) {
        try {
            this.clients.forEach(function each(client) {
                client.send(msg);
            });
        } catch (e) {
            console.log('websocket closed for '+client.data.name);
            client.terminate();
           // console.log(e);
        }
    }
    broadcastToLevel(msg, z) {
        try {
            this.clients.forEach(function each(client) {
                if (client.data && client.data.z === z) {
                    client.send(msg);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
    masssave(callback = null) {
        var itemsProcessed = 0;
        console.log('mass save');
        var that = this;
        this.clients.forEach(function each(client) {
            itemsProcessed++;
            client.save();
            if (itemsProcessed === that.clients.size && callback) {
                setTimeout(callback, 100);
            }
        });
    };

    getClientFromId(id) {
        var that = null;
        for (let daCli of this.clients) {
            if (daCli.id === id) {
                that = daCli;
            }
        }
        if (!that) console.log(id + ' didnt found in ' + this.clients.size + ' clients ');
        return that;
    }
    nearestPlayerFromPoint(x, y, z) {
        var smallest = null;
        var that = null;
        this.clients.forEach(function each(client) {
            if (client.data && client.data.z === z && !client.data.isdead) {
                var dist = Math.sqrt(Math.pow(client.data.x - x, 2) + Math.pow(client.data.y - y, 2));
                if (!smallest || dist < smallest) {
                    smallest = dist;
                    that = client;
                }
            }
        });
        return that;
    }

    clearMobTarget(mobs, id) {
        for (i = 0; i < mobs.length; i++) {
            if (mobs[i].target && mobs[i].target.id === id) {
                // console.log('cleared target of mob ' + i);
                mobs[i].target = null;
            }
        }
    }
}

module.exports = wssx;