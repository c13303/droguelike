<?php
$version = '0.2';
$statut = '';

$v = time();
$title = '';
$isdev = filter_input(INPUT_GET, "dev", FILTER_SANITIZE_NUMBER_INT);
$message = filter_input(INPUT_GET, "message", FILTER_SANITIZE_STRING);
$reconnect = filter_input(INPUT_GET, "reconnect", FILTER_SANITIZE_STRING);
$disablereconnect = filter_input(INPUT_GET, "disablereconnect", FILTER_SANITIZE_STRING);

if ($isdev) {
    $title .= " Dev";
    $v = time();
    $devclass = "dev";
}
?><!DOCTYPE html>
<html>
    <head>
        <title><?= strip_tags($title); ?></title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="<?= strip_tags($title); ?>" />
        <script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js"></script>
        <link rel="icon" type="image/png" href="favicon.png" />   
        <script src="//cdn.jsdelivr.net/npm/phaser@3.15.1/dist/phaser.min.js"></script>
        <script src="js/client.js?v=<?= $v; ?>"></script>
        <link rel="stylesheet" type="text/css" href="css/style.css?v=<?= $v; ?>">

    </head>
    <body class="<?= $isdev ? "dev" : ""; ?>">

        <form id="connect">
            <input type="text" id="username" placeholder="username" />
            <input type="password" placeholder="password" id="password" />
            <input type="submit" id="submit" value="login" />
            <div class="info">Log in or create account</div>
        </form> 
                <input type="hidden" id="isdev" value="<?= dev; ?>" />

        <input type="hidden" id="reconnect" value="<?= $reconnect; ?>" />
    </body>
</html>
