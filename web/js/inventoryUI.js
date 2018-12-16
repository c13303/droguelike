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