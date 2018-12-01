/* file created by charles.torris@gmail.com */

module.exports = {
    params: null,
    fs: null,
    connection: null,
    data: {},
    setup: function () {
        this.params = require('../params.js');
        this.fs = require('fs');
    },
    saveFile(filename, data, callback = null) {
        this.fs.writeFile(this.params.datapath + filename, data, (err) => {
            if (err)
                this.report(err);
            else {
                console.log(filename + ' written');
                if (callback) callback();
            }
        });
    },
    loadFile(fnam, key, callback = null) {
        console.log('Loading file : ' + this.params.datapath + fnam);
        this.fs.readFile(this.params.datapath + fnam, (err, data) => {
            if (err)
                this.report(err);
            this.data[key] = data;
            if (callback)
                callback(this.data);
        });

    },
    report: function (e) {

        var currentdate = new Date();
        var day = currentdate.getDate() + "-" +
            (currentdate.getMonth() + 1) + "-" +
            currentdate.getFullYear();
        var datetime = currentdate.getDate() + "/" +
            (currentdate.getMonth() + 1) + "/" +
            currentdate.getFullYear() + " @ " +
            currentdate.getHours() + ":" +
            currentdate.getMinutes() + ":" +
            currentdate.getSeconds();
        if (e.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(e.stack);
        }


        var note = datetime + ' : ' + e;
        try {
            var version = this.params.dev ? 'dev' : 'prod';
            this.fs.appendFile(this.params.logpath + "log_" + version + "_" + day + ".log", note + "\n", function (err) {
                if (err) {
                    console.log(err);
                }
                console.log(note);

            });
        } catch (er) {
            console.log(er);
        }
    },
    matrix: function (rows, cols, defaultValue = null) {
        var arr = [];
        for (var matrixi = 0; matrixi < rows; matrixi++) {
            arr.push([]);
            arr[matrixi].push(new Array(cols));
            for (var matrixj = 0; matrixj < cols; matrixj++) {
                if (!defaultValue) {
                    daval = this.getRandomInt(10);
                } else {
                    daval = defaultValue
                }
                arr[matrixi][matrixj] = daval;
            }
        }
        return arr;
    },
    getRandomInt: function (max) {
        return Math.floor(Math.random() * Math.floor(max));
    },
    calculateSurface(x, y, z, aim, power, wallz) {

        var dist = power.surface.dist;
        var style = power.surface.style;
        var size = power.surface.size;
        var isshape = power.surface.shape ? power.surface.shape : null;
        var p = [];
        var caseX = aim[0];
        var caseY = aim[1];
        var sx = null;
        var sy = null;

        if (Math.sqrt(Math.pow(x - caseX, 2)) <= dist) {
            var sx = caseX;
        }
        if (Math.sqrt(Math.pow(y - caseY, 2)) <= dist) {
            var sy = caseY;
        }


        /* direction selection */
        dir = -1;
        if (caseX > x && caseY == y) dir = 0;
        if (caseX > x && caseY > y) dir = 1;
        if (caseX == x && caseY > y) dir = 2;
        if (caseX < x && caseY > y) dir = 3;
        if (caseX < x && caseY === y) dir = 4;
        if (caseX < x && caseY < y) dir = 5;
        if (caseX === x && caseY < y) dir = 6;
        if (caseX > x && caseY < y) dir = 7;
        if (dir === -1) {
            var dirsx = x;
            var dirsy = y;
        }
        if (dir === 0) {
            var dirsx = x + dist;
            var dirsy = y;
        }
        if (dir === 1) {
            var dirsx = x + dist;
            var dirsy = y + dist;
        }
        if (dir === 2) {
            var dirsx = x;
            var dirsy = y + dist;
        }
        if (dir === 3) {
            var dirsx = x - dist;
            var dirsy = y + dist;
        }
        if (dir === 4) {
            var dirsx = x - dist;
            var dirsy = y;
        }
        if (dir === 5) {
            var dirsx = x - dist;
            var dirsy = y - dist;
        }
        if (dir === 6) {
            var dirsx = x;
            var dirsy = y - dist;
        }
        if (dir === 7) {
            var dirsx = x + dist;
            var dirsy = y - dist;
        }
        if (!sx) sx = dirsx;
        if (!sy) sy = dirsy


        if (size < 1) {
            return ([
                [sx, sy]
            ]);
        }
        if (style) {
            if (style === 'cross') {
                p.push([sx, sy]);
                p.push([sx + size, sy]);
                p.push([sx - size, sy]);
                p.push([sx, sy + size]);
                p.push([sx, sy - size]);
            }
        }
        if (isshape) {
            var shape = this.shapes[isshape];
            var center = shape[5][5];
            for (shapeIndex = 0; shapeIndex < shape.length; shapeIndex++) {
                var line = shape[shapeIndex];
                for (shapeIndexY = 0; shapeIndexY < line.length; shapeIndexY++) {
                    var col = line[shapeIndexY];
                    if (col) {
                        var positionX = sx + (shapeIndexY - 5);
                        var positionY = sy + (shapeIndex - 5);
                        p.push([positionX, positionY]);
                    }
                }
            }
        }
        /* cleanage wall */
        for (pX = 0; pX < p.length; pX++) {
            var myX = p[pX][0];
            var myY = p[pX][1];
            if (wallz[z][myX][myY] > -1) {
                p.splice(pX, 1);
            }
        }

        return (p);
    },

    timer(callback, delay) {
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
    },
    getDist(x1, x2, y1, y2) {
        return (Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
    },
    reformatJsonFromTiledSoftware(wallData) {
        var reformat = this.matrix(64, 64, null);
        var limit = 64;
        var index = 0;
        var line = 0;
        for (wiiX = 0; wiiX < wallData.length; wiiX++) {
            if (index >= limit) {
                index = 0;
                line++;
            }
            /*
                        if(!reformat[wiiX]){
                            reformat.push([]);
                        }
                        if(!reformat[wiiX][line]){
                            reformat[wiiX].push([]);
                        } */

            reformat[line][index] = wallData[wiiX] - 1;

            index++;
        }
        return reformat;
    }
}