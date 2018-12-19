$(document).ready(function () {





    dev = $('#isdev').val() ? true : false;
    console.log('DrOgUeLIkE bY ChArLEs ToRRiS');


    // UI //


    $('#connect').submit(function (e) {
        e.preventDefault();
        connect();
        musicContainer.as[0].play();
        musicContainer.as[0].setVolume(musicContainer.volume);
    });





    if ($('#reconnect').val() == 1) {
        var user = Cookies.get('user');
        var token = Cookies.get('token');
        console.log('Try to reco ' + user + $('#reconnect').val());
        $('#reconnect').val(0);
        if (user && token) {
            $('#password').val(token);
            $('#username').val(user);
            $('#connect').hide();
            $('#autoreconnect').removeClass('hidden');
            autoreco = setTimeout(function () {
                connect();
            }, 3000);

        }
    }

    function resetFocus(){
        let scrollTop = document.body.scrollTop;
        let body = document.body;
        let tmp = document.createElement('input');
        tmp.style.opacity = 0;
        body.appendChild(tmp);
        tmp.focus();
        body.removeChild(tmp);
        body.scrollTop = scrollTop;
    }

    $('body').on('click', 'canvas', function (e) {
        resetFocus();
    });






    $('body').on('contextmenu', 'canvas', function (e) {
        return false;
    });



    $('.helper').click(function () {
        var id = $(this).data('info');
        var content = $("#" + id).html();
        $('.modal-body').html(content);
        $('#modal').modal('show');
    })

}); /* end of domready */

