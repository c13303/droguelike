
function timer(callback, delay) {
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
}

var tools = {
    peoplehere: null,
    getRandomInt: function (max) {
        return Math.floor(Math.random() * Math.floor(max));
    },
    cooldown: function (key, time) {
        if (cooldowntimers[key]) {
            clearTimeout(cooldowntimers[key]);
        }
        cooldowns[key] = true;
        cooldowntimers[key] = setTimeout(function () {
            cooldowns[key] = false;
        }, time + laginput);
    },
    updateKeumById(id, key, value) {
        for (i = 0; i < peoplehere.length; i++) {
            if (peoplehere[i].id === id) {
                peoplehere[i][key] = value;
                // return (peoplehere[i]); // fait planter quand trop rapproché 4 some reason o_O
            }
        }
    },
    createCharacter(that, name, skin, x, y,isMob = false) {
        var x = layer.tileToWorldX(x) + tilesize / 2;
        var y = layer.tileToWorldY(y);
        // var char = that.add.sprite(x + tilesize / 2, y, skin);
        if(!isMob){
            var char = that.add.sprite(x + tilesize / 2, y, 'skinssheet', skin);
        } else {
            var char = that.add.sprite(x + tilesize / 2, y + tilesize / 2, 'mobs', skin);
        }        

        drawnPeopleIndex.push(name);
        drawnPeople[name] = {};
        drawnPeople[name].sprite = char;
        drawnPeople[name].label = that.add.text(x, y + labelOffset, name, {
            font: '14px Arial',
            align: "center",
            fill: '#ffffff'
        });
        drawnPeople[name].label.setAlign('center');
        drawnPeople[name].lifebar = that.add.sprite(x + lifebarOffsetX, y + lifebarOffsetY, 'fxtiles', 0);
        drawnPeople[name].lifebar.setScale(1, 0.25);

        drawnPeople[name].label.setDepth(100);
        drawnPeople[name].lifebar.setDepth(100);
        return (char);
    },
    updatePlayer(pud) {
        
        var found = false;
        for (i = 0; i < peoplehere.length; i++) {
            if (pud.id === peoplehere[i].id) {
                if (pud.name === pd.name) { // if player 1
                    pd.x = pud.x;
                    pd.y = pud.y;
                }
                $.each(pud, function (key, value) {
                    peoplehere[i][key] = value;
                });
                found = true;  
            }
        }
        if (!found) { //newplayer
            peoplehere.push(pud);
        }
    },
    notice(c) {
        var wtf = $('#console');
        wtf.append('<br/>' + c);
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    },
    fluidmove(object, px, py) {
        var dt = 4;
        if (px > object.x)
            object.x += dt;
        if (px < object.x)
            object.x -= dt;
        if (py > object.y)
            object.y += dt;
        if (py < object.y)
            object.y -= dt;
    },
    
    checkKey(evt) {
        var keyID = (evt.charCode) ? evt.charCode : ((evt.which) ? evt.which : evt.keyCode);
        return (keyID);
    },
    matrix(rows, cols, defaultValue) {
        var arr = [];
        for (var i = 0; i < rows; i++) {
            arr.push([]);
            arr[i].push(new Array(cols));
            for (var j = 0; j < cols; j++) {
                arr[i][j] = defaultValue;
            }
        }
        return arr;
    }
    
    
};
