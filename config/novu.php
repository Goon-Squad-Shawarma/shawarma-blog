<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Novu Application Identifier
    |--------------------------------------------------------------------------
    |
    | This is your Novu application identifier, used to identify your
    | application when communicating with the Novu API.
    |
    */

    'application_identifier' => env('APPLICATION_IDENTIFIER'),

    /*
    |--------------------------------------------------------------------------
    | Novu Secret Key
    |--------------------------------------------------------------------------
    |
    | This secret key is used for server-side operations such as creating
    | subscribers, triggering notifications, and managing workflows.
    |
    */

    'secret_key' => env('NOVU_SECRET_KEY'),

];
