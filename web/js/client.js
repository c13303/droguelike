var ws;
var player;
var autoreco;
var button;
var game;
var dev;
var consolage = null;
var canvas = document.getElementById("gamecanvas");
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    canvas: canvas,
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};
var caseX;
var caseY;
var level;
var layer;
var tiles;
var tilesize = 32;
var pd = {}; //playerData lol

var laginput = 50; //ms to stay sync with server

var lang = 'fr';
var drawnPeopleIndex = [];
var peoplehere = [];
var killingPile = [];

var drawnPeople = {};
var tweenplayer;
var powersbible = [];
var mobsbible = [];
var spawners = [];
var mobs = {};

$.get("data/powers.json?v="+Date.now(), function (data) {    
    powersbible = data;
});
$.get("data/mobs.json?v="+Date.now(), function (data) {    
    mobsbible = data;
});
$.get("data/spawners.json?v="+Date.now(), function (data) {  
    spawners = data;
});




var map;
var tilefx;
var labelOffset = 32;
var lifebarOffsetX = 16;
var lifebarOffsetY = 53;
var traiting = false;

cooldowntimers = {};
cooldowns = {};
cooldownbible = {};

var emptylevel;

var cursor;
var lastUpdate = Date.now();
var damageLabels = {};








$(document).ready(function () {





    dev = $('#isdev').val() ? true : false;
    console.log('DrOgUeLIkE bY ChArLEs ToRRiS');


    // UI //


    $('#connect').submit(function (e) {
        e.preventDefault();
        connect();
    });



    

    if ($('#reconnect').val() == 1) {
        var user = Cookies.get('user');
        var token = Cookies.get('token');
        console.log('Try to reco ' + user + $('#reconnect').val());
        $('#reconnect').val(0);
        if (user && token) {
            $('#password').val(token);
            $('#username').val(user);
            $('#connect').hide();
            $('#autoreconnect').removeClass('hidden');
            autoreco = setTimeout(function () {
                connect();
            }, 3000);

        }
    }
    $('body').on('click', 'canvas', function (e) {
        $('#chat').blur();
    });






    $('body').on('contextmenu', 'canvas', function (e) {
        return false;
    });



    $('.helper').click(function () {
        var id = $(this).data('info');
        var content = $("#" + id).html();
        $('.modal-body').html(content);
        $('#modal').modal('show');
    })

}); /* end of domready */



  