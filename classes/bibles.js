/* file created by charles.torris@gmail.com */

module.exports = {
    powers: [],
    mobs: [],
    init: function () {
        var pow = {};

        pow.ass = {
            type: 'trig',
            duration: 500,
            powercool: 500,
            movecool: 500,
            sprite : 0,
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
                humil: 1,
            },
            offensive: 3,
        };

        pow.slap = {
            type: 'trig',
            duration: 1000,
            powercool: 1500,
            movecool: 1000,
            sprite : 0,
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
                physical: 1,
                humil: 1,
            },
            offensive: 3,
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
    }

}