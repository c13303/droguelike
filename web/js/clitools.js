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
        for (bi = 0; bi < peoplehere.length; bi++) {
            if (peoplehere[bi].id === id) {
                peoplehere[bi][key] = value;
            }
        }
    },
    createCharacter(that, name, skin, x, y, isMob = false) {
        var oriX = layer.tileToWorldX(x);
        var x = oriX + tilesize / 2;
        var y = layer.tileToWorldY(y);
        var char = that.add.sprite(x, y, 'skinssheet', skin);

        drawnPeopleIndex.push(name);
        drawnPeople[name] = {};
        drawnPeople[name].sprite = char;
        if (!isMob) {
            /* drawnPeople[name].label = that.add.text(oriX, y + labelOffset, name, {
                 fontFamily: 'cioFont',
                 fontSize : "12px",
                 align: "center",
                 fill: '#dcf5ff'
             });
             */

            drawnPeople[name].label = that.add.bitmapText(oriX, y + labelOffset, 'pixelfont', name);
            drawnPeople[name].label.setDepth(100);
        }
        drawnPeople[name].lifebar = that.add.sprite(oriX + lifebarOffsetX, y + lifebarOffsetY, 'fxtiles', 0);
        drawnPeople[name].lifebar.setScale(1, 0.25);
        drawnPeople[name].lifebar.setDepth(-0.1);
        return (char);
    },
    updatePlayer(pud) {
        var found = false;
        for (PeopleUpdateIndex = 0; PeopleUpdateIndex < peoplehere.length; PeopleUpdateIndex++) {
            if (pud.id === peoplehere[PeopleUpdateIndex].id) {
                if (pud.name === pd.name) { // if player 1
                    pd.x = pud.x;
                    pd.y = pud.y;
                    pd.holding = pud.isH ? true : false;
                }

                if (pud.isH) { /*holding power and shake delay */
                    // console.log(pud.isH);
                    peoplehere[PeopleUpdateIndex].release = null;
                    peoplehere[PeopleUpdateIndex].holdDrawTrigger = true;
                    peoplehere[PeopleUpdateIndex].cursorDelayTrigger = pud.isH.delay;
                    peoplehere[PeopleUpdateIndex].aim = pud.isH.aim;
                }

                $.each(pud, function (key, value) {
                    peoplehere[PeopleUpdateIndex][key] = value;
                });
                found = true;
            }
        }
        if (!found) { //newplayer
            peoplehere.push(pud);
        }
    },
    killMobs(killingPile) {
        console.log(peoplehere);
        console.log(killingPile);

        /*
        for (dmi = 0; dmi < peoplehere.length; dmi++) {
            for (dmj = 0; dmj < killingPile.length; dmj++) {
                if (killingPile[dmj] === peoplehere[dmi].id) {
                    console.log('KillMobs : killing ' + peoplehere[dmi].name);
                    peoplehere[dmi].killMob = true;
                    killingPile.splice(dmj,1);
                }
            }
        }*/
        $.each(peoplehere, function (indexKeum, keum) {
            $.each(killingPile, function (indexKill, kill) {
                if (kill === keum.id) {
                    keum.killMob = true;
                    killingPile.splice(indexKill, 1);
                }
            });
        });
    },
    notice(c) {
        var wtf = $('#console');
        wtf.append('<br/>' + c);
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    },
    fluidmove(object, px, py) {
        var dt = 2;
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
    },
    killDurations(durationsLib) {
        if (durationsLib) {
            for (durIndex = 0; durIndex < durationsLib.length; durIndex++) {
                durationsLib[durIndex].timeleft = durationsLib[durIndex].timeleft - updateRate;
                if (durationsLib[durIndex].timeleft <= 0) {
                    /* destroy all powers*/
                    for (spriteArrayIndex = 0; spriteArrayIndex < durationsLib[durIndex].spriteArray.length; spriteArrayIndex++) {
                        durationsLib[durIndex].spriteArray[spriteArrayIndex].destroy();
                    }
                }
            }
        }
    },
    inventoryReorder() {
        $('.invslot').html("");
        $('.slot').html("");
        $('#invslot0').html('<div class="unequip"></div>');
        $('.invslot').removeClass("occupied");

        var pos = 1;
        var that = this;

        $.each(myItems, function (invkey) {

            var item = myItems[invkey];
            var loot = lootbible[item.id];
            var slots = '';



            var showme = false;

            for (u = 0; u < loot.slot.length; u++) {
                slots += ' slottype_' + loot.slot[u];
                if (!selectedSlotType || selectedSlotType == loot.slot[u] || item.isEquiped) {
                    showme = true;
                }
            }


            //console.log(item.id + ' : '+item.isEquiped);
            if (showme) {
                pos++;
                var frame = loot.sprite * -64;
                var style = "background-position: " + frame + "px 0px";
                /* TODO split cols spritesheet */
                var icon = '<div class="looticon" style="' + style + '"></div>';
                var htmlItem = '<div class="item item' + item.uid + ' ' + slots + '" data-uid="' + item.uid + '" data-id="' + item.id + '" data-position="' + pos + '">' + icon + '</div>';
                var inventorySlot = $('#invslot' + pos);
                if (!item.isEquiped) {
                    //console.log('show in inv ' + pos + ' ' + item.id);
                    that.inventoryPutInSlot(inventorySlot, htmlItem);
                } else {
                    //console.log('show in equip ' + item.id);
                    $("#the_slot_type_" + item.isEquiped).html(htmlItem);
                    tools.itemEquip(item);
                }
            }




        });
    },
    inventoryPutInSlot(inventorySlot, htmlItem) {
        inventorySlot.html(htmlItem).addClass('occupied');
    },
    displayItemInfo() {
        var itemElement = $('.item' + selectedItemUid);
        var key = itemElement.attr('data-id');
        var loot = lootbible[key];
        var div = $('.itemDetails');
        //console.log(loot);
        div.html("<h2>" + loot.name.fr + '<h2>');
        div.append('<p>' + loot.desc.fr + '</p>');

        div.append('<h3>Powers : </h3>');
        for (s = 0; s < loot.powers.length; s++) {
            var sk = loot.powers[s];
            var power = powersbible[sk];
            div.append('<p> ' + power.name.fr + '</p>');
        }
        /*
        div.append('<h2>ACTIONS</h2>');
        if (selectedSlotType)
            div.append('<a href="#" class="equip">Equip</a>');
        else
            div.append('Select SLOT to equip');
*/

        div.append('<h3>EQUIP :  </h3>');
        for (s = 0; s < loot.slot.length; s++) {
            var sk = loot.slot[s] - 1;
            div.append('<p><a href="#" class="equip" data-slottype="' + loot.slot[s] + '">' + slotsTypes[sk].fr + '</a></p>');
        }

        var item = myItems['item' + selectedItemUid];
        if (item.isEquiped) {
            div.append('<p><a href="#" class="desequip" data-uid="' + selectedItemUid + '" data-slottype="' + item.isEquiped + '">Unequip</a></p>');
        }



    },
    itemEquip(autoEquip = null, slot = null) {
        var uid = selectedItemUid;
        if (autoEquip) {
            uid = autoEquip.uid;
            console.log('AutoEquip ' + autoEquip.id);
        } else {
            console.log('Manual Equip ' + uid);
        }
        var itemElement = $('.item' + uid);

        itemElement.removeClass('selectedItem');
        /* equipage dun item */
        if (1) {

            if (selectedSlotType) slotType = selectedSlotType;
            if (autoEquip) slotType = autoEquip.isEquiped;
            if (slot) slotType = slot;

            console.log('into slot' + slotType);

            var slotTypeElement = $('#the_slot_type_' + slotType);

            if (!autoEquip) {
                var olDuid = slotTypeElement.attr('data-uid');
                if (olDuid) {
                    // console.log('unequipe' + olDuid);
                    myItems['item' + olDuid].isEquiped = 0;
                }
                $('#the_slot_type_' + slotType).html(itemElement);
            }


            // console.log('item ' + uid + ' selected to slotType ' + slotType);
            itemElement.addClass('equiped');
            var invslot = itemElement.parents('.invslot');
            invslot.removeClass('occupied');

            $('#the_slot_type_' + slotType).attr('data-uid', uid);
            myItems['item' + uid].isEquiped = slotType;

            if (!autoEquip) {

                ws.send(JSON.stringify({
                    'equip': uid,
                    'slot': slotType
                }));
                tools.inventoryReorder();
            }


        }
    }



};