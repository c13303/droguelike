<?php
$version = '0.2';
$statut = '';

$v = time();
$title = 'Droguelike';
$isdev = filter_input(INPUT_GET, "dev", FILTER_SANITIZE_NUMBER_INT);
$message = filter_input(INPUT_GET, "message", FILTER_SANITIZE_STRING);
$reconnect = filter_input(INPUT_GET, "reconnect", FILTER_SANITIZE_STRING);
$disablereconnect = filter_input(INPUT_GET, "disablereconnect", FILTER_SANITIZE_STRING);

if ($disablereconnect) {
    $reconnect = 0;
}

if ($isdev) {
    $title .= " Dev";
    $v = time();
    $devclass = "dev";
}
?>
<!DOCTYPE html>
<html>

<head>
    <title>
        <?=strip_tags($title);?>
    </title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?=strip_tags($title);?>" />
    <script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
        crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js"></script>
    <link rel="icon" type="image/png" href="favicon.png" />
    <script src="//cdn.jsdelivr.net/npm/phaser@3.15.1/dist/phaser.min.js"></script>
    <script src="js/clitools.js?v=<?=$v;?>"></script>
    <script src="js/draw.js?v=<?=$v;?>"></script>
    <script src="js/dial.js?v=<?=$v;?>"></script>
    <script src="js/vars.js?v=<?=$v;?>"></script>
    <script src="js/client.js?v=<?=$v;?>"></script>
    <link rel="stylesheet" type="text/css" href="style/reset.css">
    <link rel="stylesheet" type="text/css" href="lib/bootstrap/bootstrap.min.css"><!-- couillestrap looool -->
    <script src="lib/bootstrap/bootstrap.min.js"></script>
    <link rel="stylesheet" type="text/css" href="style/style.css?v=<?=$v;?>">

</head>

<body class="<?=$isdev ? " dev " : " ";?>">
    <div id="logo">
        <img src="img/logo.png" alt="droguelike logo" />
    </div>
    <form id="connect">
        <div class="error">
            <?=$message;?>
        </div>
        <input type="text" id="username" placeholder="username" />
        <input type="password" placeholder="password" id="password" />
        <input type="submit" id="submit" value="login" />
        <div class="info">Log in or create account</div>
    </form>
    <div id="autoreconnect" class="centered hidden">
        Reconnexion in progress !
    </div>
    <div id="game" class="hidden">
        <form id="chatte" autocomplete="off">
            <input type="text" id="chat" />
            <input type="submit" class="hidden" />
        </form>
        <div id="console"></div>
        <div id="sidepanel">
            <div class="notice">
                <div class="keynum">T</div> target selection
                <br />
                <div class="keynum">K</div> toggle player killer mode
            </div>
            <div id="target"></div>
            <img src="img/question.png" class="helper" data-info="infopowers" />
            <div id="powers">
            </div>
            <div class="coords"></div>
        </div>


    </div>
    <input type="hidden" id="isdev" value="<?=dev;?>" />

    <input type="hidden" id="reconnect" value="<?=$disablereconnect ? 0 : $reconnect;?>" />



    <div class="modal fade" id="modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-body">

                </div>
            </div>
        </div>
    </div>
    <div class="info" id="infopowers">
        <h2>Target</h2>
        <p>Mobs are auto-targetted when in range</p>
        <p>Players must be targetted with T key (press until you get your target), then you can set as "enemy" to
            auto-attack it</p>
        <h2>Powers</h2>
        <p>AUTO : The power used as auto-attack melee (when you bump into ennemy)</p>
        <p>Slots 1-4 : the powers will trig with keys 1,2,3 or 4 </p>
    </div>
    <div class="powerinventory">
    </div>
    <div class="playerfiche">
        <div class="container">
            <div class="slot slot1"></div>
            <div class="slot slot2"></div>
            <div class="slot slot3"></div>
            <div class="slot slot4"></div>
            <div class="slot slot5"></div>
            <div class="slot slot6"></div> 
            <div class="slot slot7"></div> 
            <div class="slot slot8"></div>
        </div>
    </div>


</body>

</html>