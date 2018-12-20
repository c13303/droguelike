var slotsTypes = [{
        "fr": "tete",
        "en": "head"
    },
    {
        "fr": "corps",
        "en": "head"
    },
    {
        "fr": "slip",
        "en": "head"
    },
    {
        "fr": "chaussures",
        "en": "head"
    },
    {
        "fr": "epaule gauche",
        "en": "head"
    },
    {
        "fr": "main gauche",
        "en": "head"
    },
    {
        "fr": "epaule droite",
        "en": "head"
    },
    {
        "fr": "main droite",
        "en": "head"
    }
];

var selectedSlotType;
var myItems;
var selectedItemUid;

function stats_refresh(){
    pd.lifemax = pd.life.max;
    pd.lifenow = pd.life.now;



    pd.damage_social = pd.damage.social;
    pd.damage_sex = pd.damage.sex;
    pd.damage_money = pd.damage.money;

    pd.defense_social = pd.defense.social;
    pd.defense_sex = pd.defense.sex;
    pd.defense_money = pd.defense.money;

    pd.damage_social_mod = pd.damage.social_mod;
    pd.damage_sex_mod = pd.damage.sex_mod;
    pd.damage_money_mod = pd.damage.money_mod;

    pd.defense_social_mod = pd.defense.social_mod;
    pd.defense_sex_mod = pd.defense.sex_mod;
    pd.defense_money_mod = pd.defense.money_mod;

    console.log(pd);

    $('.stat').each(function(){
        var stat = $(this).data('stat');
        var html = stat;
        var val = pd[stat];
       
        $(this).html(val);
    });
}




$(document).ready(function () {

    /* selection slot dans le bonhomme */
    $('.slot').click(function () {
        /*
        $('#disableFilter').show();
        if ($(this).html() == "") {
            $('.slot').removeClass('selected');
            selectedSlotType = $(this).data('pos');
            tools.inventoryReorder();
            $(this).addClass('selected');
            $('.item:not(.equiped)').hide();
            $('.itemDetails').html('');
            $('.slottype_' + selectedSlotType).show();
        }
        */
    });

    $(document).on('click', '.equip', function () {
        var slot = $(this).attr('data-slottype');
        selectedSlotType = 0;
        $('#disableFilter').hide();
        $('.itemDetails').html('');
        tools.itemEquip(null, slot);
    });

    $(document).on('click', '.item', function () {
        $('.selectedItem').removeClass('selectedItem');
        $(this).addClass('selectedItem');
        selectedItemUid = $(this).data('uid');
        tools.displayItemInfo();
    });


    
    $('#disableFilter').hide();
    $('#disableFilter').click(function () {
        $('#disableFilter').hide();
        $('.selected').removeClass('selected');
        selectedSlotType = 0;
        tools.inventoryReorder();
    });


    $(document).on('click', '.desequip', function () {
        var uid = $(this).attr('data-uid');
        myItems['item' + uid].isEquiped = 0;
        
        ws.send(JSON.stringify({
            'dequip': uid,
            'slot': $(this).attr('data-slottype')
        }));

        selectedSlotType = 0;
        $('#disableFilter').hide();
        tools.inventoryReorder();
    });

    $(document).on('mouseenter', '.item', function () {

    });




    
});