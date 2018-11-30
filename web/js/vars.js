var ws;
var player = camera = null;
var autoreco;
var deltaTime = 0;
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

$.get("data/powers.json?v=" + Date.now(), function (data) {
    powersbible = data;
});
$.get("data/mobs.json?v=" + Date.now(), function (data) {
    mobsbible = data;
});
$.get("data/spawners.json?v=" + Date.now(), function (data) {
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
var cursorPowerDelayed = null;
var cursorPowerDelayedSprite;
var cursorDelayTrigger;

var wallLayer = wallData = null;

$.get("data/wallz.json?v=" + Date.now(), function (data) {
    wallData = data.layers[0].data;
    var reformat = [];
    var limit = 64;
    var index = 0;
    var line = 0;
    for (wiiX = 0; wiiX < wallData.length; wiiX++) {
        if(index >= limit){
            index = 0;
            line++;
        }
        if(!reformat[index]){
            reformat.push([]);
        }
        reformat[line].push(wallData[wiiX]-1);
        index++;

    }
    wallData = reformat;
    console.log(reformat);
    

});