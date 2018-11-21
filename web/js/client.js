/* file created by charles.torris@gmail.com */

var ws;
var player;
var autoreco;
var button;
var game;
var dev;
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};


var level;
var layer;
var tiles;
var tilesize = 32;
var pd; //playerData lol
var cooldown = false;
var cooldowntime = 200;

var peoplehere = [];


var tools = {
    cooldown : function(){
    cooldown = true;
    setTimeout(function(){
        cooldown = false;
    },cooldowntime);
}
};


function preload()
{
    this.load.image('heros', 'img/sprites/foutreman1.png');
    this.load.image('button', 'img/sprites/foutreman1.png');
    this.load.image("tiles", "img/tilesettest.png");
    
    
}

function create()
{
    map = this.make.tilemap({data: level, tileWidth: 32, tileHeight: 32});
    tiles = map.addTilesetImage("tiles");
    layer = map.createDynamicLayer(0, tiles, 0, 0);
    player = this.add.sprite(layer.tileToWorldX(pd.x) + tilesize / 2,layer.tileToWorldY(pd.y), 'heros');  
    
    button = this.add.sprite(100, 400, 'button');
    button.setInteractive();
    button.on('pointerover', () => { button_over(button); });
    button.on('pointerdown', () => { ws.send(JSON.stringify({'command':'test'})); });

}

function update()
{
    const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
    if (this.input.manager.activePointer.isDown) {
       
       // layer.putTileAtWorldXY(353, worldPoint.x, worldPoint.y);
       var tx = pd.x;
       var ty = pd.y;
       
       var caseX = layer.worldToTileX(worldPoint.x);
              var caseY = layer.worldToTileY(worldPoint.y);

        if (caseX > pd.x) {
            tx = pd.x + 1;
        }
        if (caseX< pd.x) {
            tx = pd.x  - 1;
        }
        if (caseY > pd.y) {
            ty = pd.y + 1;
        }
        if (caseY< pd.y) {
            ty = pd.y - 1;
        }
         if(!cooldown && (tx != pd.x || ty != pd.y)){
             tools.cooldown();
             ws.send(JSON.stringify({'move': [tx,ty]})); 
         }

    }
    
     player.x = layer.tileToWorldX(pd.x) + tilesize/2;
     player.y = layer.tileToWorldY(pd.y);
}



function getTileX(x){
    return layer.tileToWorldX(layer.worldToTileX(x));
}
function getTileY(y){
    return layer.tileToWorldY(layer.worldToTileY(y));
}
function button_over(button){
    button.alpha = 0.5;
}

 




$(document).ready(function () {

    
    


    dev = $('#isdev').val() ? true : false;
    console.log('poutrelle');
   

    // UI //


    $('#connect').submit(function (e) {
        e.preventDefault();
        connect();
    });



    // WS //
    /*
     * 
     * CONNEXION
     */
    function connect() {
        clearTimeout(autoreco);
        token = $('#password').val();
        user = $('#username').val();
        var regex = /^([a-zA-Z0-9_-]+)$/;
        if (!regex.test(user) || !regex.test(token)) {
            alert('Please use only alphanumeric characters and underscores for user and pass');
            return false;
        }
        var port = 8088;
        Cookies.set('user', user);
        Cookies.set('token', token);
        console.log('connecting '+user);
        try {
            var url = 'rogueserver.5tfu.org';
            if (dev) {
                isdev = 'dev=1&';
                ws = new WebSocket('wss://' + url + ':' + port + '/' + token + '-' + user);
            } else {
                ws = new WebSocket('wss://' + url + ':' + port + '/' + token + '-' + user);
            }
        } catch (e) {
            alert(e);
        }
        ws.onerror = function (e) {
            console.log(e);
            window.location.replace("/?" + isdev + "message=Login Failed&disablereconnect=1");

        };
        
        
        /*
         * 
         * COMMUNICATION STARTING ! 
         */
        
        
        
        ws.onmessage = function (event) {
            var d = JSON.parse(event.data);
            console.log(d);
            if (d.startgame && d.level) {
                $('#connect').remove();
                
                level = d.level;
                pd = d.mydata;
                game = new Phaser.Game(config);
                if(d.granu)
                cooldowntime = d.granu;
            
                
            
            }

            if(d.moved){
                var tx = d.moved[0]; var ty = d.moved[1];
               pd.x = tx; pd.y = ty;
            }
            
            if(d.pud){ // someone send update
                
            }

        }




        function ping() {
            setTimeout(function () {
                if (ws.readyState === ws.CLOSED) {
                    window.location.replace("/?" + isdev + "reconnect=1&message=Serveur has updated ! Please Relog !");
                } else {
                    ping();
                }
            }, 1000);
        }

        ping();




        /* login */
        $('#pname').submit(function (e) {
            e.preventDefault();
            ws.send(JSON.stringify({command: 'submitproduct', value: $('#prod').val()}));
        });

        $('#hacksubmit').click(function () {
            ws.send(JSON.stringify({command: 'hack', what: $('#hack').val(), value: $('#hackvalue').val()}));
        });






    }

    if ($('#reconnect').val()) {
        var user = Cookies.get('user');
        var token = Cookies.get('token');
        console.log('Try to reco ' + user);
        $('#reconnect').val(0);
        if (user && token) {
            $('#password').val(token);
            $('#username').val(user);
            $('#connect').hide();
            $('.autoreconnect').removeClass('hidden');
            autoreco = setTimeout(function () {
                connect();
            }, 3000);

        }
    }







});