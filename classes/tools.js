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
            if(callback)
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
                    daval = this.getRandomInt(4);
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
    calculateSurface(x, y, dir, dist, style, size = 1) {

        var p = [];
        if (dir === -1) {
            var sx = x;
            var sy = y;
        }

        if (dir === 0) {
            var sx = x + dist;
            var sy = y;
        }
        if (dir === 1) {
            var sx = x + dist;
            var sy = y + dist;
        }
        if (dir === 2) {
            var sx = x;
            var sy = y + dist;
        }

        if (dir === 3) {
            var sx = x - dist;
            var sy = y + dist;
        }

        if (dir === 4) {
            var sx = x - dist;
            var sy = y;
        }

        if (dir === 5) {
            var sx = x - dist;
            var sy = y - dist;
        }

        if (dir === 6) {
            var sx = x;
            var sy = y - dist;
        }

        if (dir === 7) {
            var sx = x + dist;
            var sy = y - dist;
        }
        if (size < 1) {
            return ([
                [sx, sy]
            ]);
        }

        if (style === 'cross') {

            p.push([sx, sy]);
            p.push([sx + size, sy]);
            p.push([sx - size, sy]);
            p.push([sx, sy + size]);
            p.push([sx, sy - size]);

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
        return (Math.sqrt(Math.pow(x1 - x2, 2) - Math.pow(y1 - y2, 2)));
    }
}