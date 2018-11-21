/* file created by charles.torris@gmail.com */

module.exports = {
    params : null,
    fs : null,
    connection : null,
    setup : function(){
        this.params = require('../params.js');
        this.fs = require('fs');
    },
    saveFile(filename,data,callback){
        this.fs.writeFile(this.params.datapath+filename,data,(err)=>{
            if(err)
                this.report(err);
            else
                callback();
        });
    },
    loadFile(fnam,callback){
        console.log('Loading file : '+this.params.datapath+fnam);
         this.fs.readFile(this.params.datapath+fnam, (err,data) => {
            if(err)
                this.report(err);
            else
                callback(data);
         });
    },
    report: function (e) {
        
        var currentdate = new Date();
        var day = currentdate.getDate() + "-"
                + (currentdate.getMonth() + 1) + "-"
                + currentdate.getFullYear();
        var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
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
    matrix: function (rows, cols, defaultValue) {

        var arr = [];
        for (var i = 0; i < rows; i++) {
            arr.push([]);
            arr[i].push(new Array(cols));
            for (var j = 0; j < cols; j++) {
                defaultValue = this.getRandomInt(4);
                arr[i][j] = defaultValue;
            }
        }
        return arr;
    },
    getRandomInt: function (max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
}