/* file created by charles.torris@gmail.com */

module.exports = {
    powers: [],
    mobs: [],
    init: function (tools) {
        var pow = {};

        pow.ass = {
            type: 'trig',
            duration: 3,
            powercool: 500,
            movecool: 100,
            sprite: 1,
            name: {
                fr: 'main au cul',
                en: 'hand to ass',
            },
            surface: {
                dist: 1,
                style: 'cross',
                size: 0
            },
            desc: {
                fr: 'La paume de votre main sur cul de votre adversaire',
                en: 'The palm of your hand on the ass of your opponent'
            },
            damage: {
                physical: 1,
                humiliation: 1,
                sex: 0,
                sanity: 0,
                karma: 0,
                money: 0
            },
            offensive: 3,
            depth: 1,
        };

        pow.slap = {
            type: 'trig',
            duration: 1,
            powercool: 1500,
            movecool: 100,
            sprite: 0,
            name: {
                fr: 'gifle',
                en: 'slap',
            },
            surface: {
                dist: 1,
                style: 'cross',
                size: 1
            },
            desc: {
                fr: 'La paume de votre main sur le visage de votre adversaire',
                en: 'The palm of your hand on the face of your opponent'
            },
            damage: {
                physical: 10,
                humiliation: 5,
                sex: 0,
                sanity: 0,
                karma: 0,
                money: 0
            },
            offensive: 3,
            depth: 1,
        };

        pow.foutre = {
            type: 'trig',
            duration: 10,
            powercool: 5000,
            movecool: 2000,
            sprite: 2,
            name: {
                fr: 'foutrage',
                en: 'foutrage',
            },
            surface: {
                dist: 1,
                style: 'cross',
                size: 1
            },
            desc: {
                fr: 'La paume de votre main sur le visage de votre adversaire',
                en: 'The palm of your hand on the face of your opponent'
            },
            damage: {
                physical: 1,
                humiliation: 5,
                sex: 5,
                sanity: 0,
                karma: 0,
                money: 0
            },
            offensive: 3,
            depth: 1,
        };




        this.powers = pow;





        var mobs = {};

        mobs.punkache = {
            name: {
                fr: 'punk à chien',
                en: 'gutter punk',
            },
            desc: {
                fr: '',
                en: ''
            },
            offensive: 1,
            defensive: 1
        };


        mobs.giletjaune = {
            name: {
                fr: 'gilet jaune',
                en: 'gutter punk',
            },
            desc: {
                fr: 'le fameux manifestant pro-carburant',
                en: 'a protester that claims the right for cheap fuel'
            },
        };


        this.mobs = mobs;

        bibles = this;
        tools.saveFile('bibles.cio', JSON.stringify(bibles), null);


    }

}