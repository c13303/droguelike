const server = require('ws').Server;

class wssx extends server {
    verify(info, callback, connection, userRequestMap) {

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
            report('illegal name');
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
                    report(name + ' rejected');
                    callback(false);
                }
            } else {
                var dataclone = JSON.parse(JSON.stringify(data_example));
                var data = JSON.stringify(dataclone);
                connection.query('INSERT INTO players(name,password,data) VALUES (?,?,?)', [name, token, data], function (err) {
                    if (err)
                        report(err);
                    else {
                        report(' - New PLayer Creation : ' + name);
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
        this.clients.forEach(function each(client) {
            client.send(msg);
        });
    }
    masssave(callback = null) {
        var itemsProcessed = 0;
        console.log('mass save');
        this.clients.forEach(function each(client) {
            itemsProcessed++;
            client.save();
            if (itemsProcessed === this.clients.size && callback) {
                setTimeout(callback, 100);
            }
        });
    };
    getClientFromId(id) {
        var that = null;
        this.wss.clients.forEach(function each(client) {
            if (client.id === id) {
                that = client;
                return that;
            }
        });
        return that;
    }
}

module.exports = wssx;