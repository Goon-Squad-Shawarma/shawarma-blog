<?php

namespace App\Enums;

enum OrganizationRole: string
{
    case ADMIN = 'admin';
    case EDITOR = 'editor';
    case AUTHOR = 'author';
}
