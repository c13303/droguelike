var ws;
var player = camera = null;
var autoreco;
var deltaTime = 0;
var button;
var game;
var dev;
var consolage = null;
var canvas = document.getElementById("gamecanvas");

var ZOOM = 2;
var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
console.log('screen size : ' + w + ',' + h);

//if (h < 800) ZOOM = 1;

var canvasW = w - 128;
var canvasH = h - 64


var config = {
    type: Phaser.AUTO,
    width: Math.round(canvasW / 2),
    height: Math.round(canvasH / 2),
    pixelArt: true,
    callbacks: {
        postBoot: function (game) {

            var config = game.config;
            var style = game.canvas.style;
            style.width = (ZOOM * config.width) + 'px';
            style.height = (ZOOM * config.height) + 'px';

        }
    },

    scene: {
        preload: preload,
        create: create,
        update: update,
    },

};
var caseX;
var caseY;
var level;
var layer;
var tiles = floorz = null;
var tilesize = 32;
var pd = {}; //playerData lol

var laginput = 50; //ms to stay sync with server

var lang = 'fr';

var drawnPeopleIndex = [];
var peoplehere = [];
var killingPile = [];
var drawnPeople = {};
var drawnItems = {};
var tweenplayer;



var powersbible = [];
var mobsbible = [];
var spawners = [];
var mobs = {};
var ticrate = null;
var lootbible = [];
$.get("data/powers.json?v=" + Date.now(), function (data) {
    powersbible = data;
});
$.get("data/mobs.json?v=" + Date.now(), function (data) {
    mobsbible = data;
});
$.get("data/spawners.json?v=" + Date.now(), function (data) {
    spawners = data;
});

$.get("data/lootbible.json?v=" + Date.now(), function (data) {
    lootbible = data;
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
var cursor;
var lastUpdate = Date.now();
var damageLabels = {};
var cursorPowerDelayed = null;
var cursorPowerDelayedSprite;
var cursorDelayTrigger;
var wallLayer = wallData = null;


$.get("data/formatedLevels/level0_floor.json?v=" + Date.now(), function (data) {
    level = data;
    // console.log(level.length);
});

$.get("data/formatedLevels/level0_wallz.json?v=" + Date.now(), function (data) {
    wallData = data;
    //  console.log(wallData.length);
});