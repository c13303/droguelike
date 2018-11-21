/* file created by charles.torris@gmail.com */

module.exports = {
    data_example: {
        'name': '',
        'x': 0,
        'y': 0,
        'z': 0,
        'level': 0,
        'life': 0,
        'skin': 0,
        cool : 0,
        stats: {
            mass: 0,
            anest: 0,

        },
        'equip': {
            'head': 0,
            'body': 0,
            'r_hand': 0,
            'l_hand': 0,
            'legs': 0
        },
        'inv': [],
        'house': {
            x: 0,
            y: 0,
            inv: []
        }
    },
    formatPeople(ws){
        return({
           name : ws.name,
           x : ws.data.x,
           y : ws.data.y,
           z : ws.data.z,
           skin : ws.data.skin           
        });
    },
    getPeopleInZ(z, wss){
        var here = [];
        var that = this;
        wss.clients.forEach(function each(client) {
            if(client.data.z === z){                
                here.push(that.formatPeople(client));
            }
        });
        return here;        
    },
    updateMyPosition(ws,wss){
        var that = this;
        wss.clients.forEach(function each(client) {
            if(client.data.z === ws.data.z && client.name !== ws.name){                
                ws.send(JSON.stringify({'pud' : that.formatPeople(client)}));
            }
        });
    },
    getArmor: function (p) {
        return 0;
    }
}