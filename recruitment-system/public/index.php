<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Check If The Application Is Under Maintenance
|--------------------------------------------------------------------------
|
| If The application is in maintenance / demo mode via the "down" command
| we will require this file so that any functions or classes are available
| for use and we can properly display the maintenance mode connector.
|
*/

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

/*
|--------------------------------------------------------------------------
| Register The Auto Loader
|--------------------------------------------------------------------------
|
| We rely on Composer to autoload our files. We will just require it here
| so that we don't have to worry about manually loading any of our classes
| later on. The starting point for most applications comes right here.
|
*/

require __DIR__.'/../vendor/autoload.php';

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
|
| Once we have the application ready, we can handle the incoming request
| through the kernel's handle method, which will execute the middleware
| stack and send the response back to the client's browser below.
|
*/

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = tap($kernel->handle(
    $request = Illuminate\Http\Request::capture()
))->send();

$kernel->terminate($request, $response);
