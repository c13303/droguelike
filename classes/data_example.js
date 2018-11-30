module.exports = {
    data_example: {
        'id': 0,
        'name': '',
        'x': 5,
        'y': 5,
        'z': 0,
        'level': 0,
        'life': {
            max: 200,
            now: 200,
        },
        'skin': 1,
        'lang': 'en',
        'movecooling': false,
        'pk': false,
        stats: {
            masse: 0,
            anest: 0,
        },
        powers_inventory: ['slap','ass','foutre'],
        powers_cooldowns: {},
        powers_equiped: {
            auto: {
                k: 'ass',
                cool: 0
            },
            a: {
                k: 'ass',
                cool: 0
            },
            b: {
                k: 'slap',
                cool: 0
            },
            c: {
                k: 'foutre',
                cool: 0
            },
            d: null,
        },
        'equip': {
            'head': 0,
            'body': 0,
            'r_hand': 0,
            'l_hand': 0,
            'legs': 0
        },
        'inv': [{'pot' : 1}],
        'house': {
            x: 0,
            y: 0,
            inv: []
        },
        security: {
            'last': 0,
            'floods': 0,
        }
    }
}