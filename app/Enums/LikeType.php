<?php

namespace App\Enums;

enum LikeType: string
{
    case Like = 'like';
    case ThumbsUp = 'thumbsup';
    case ThumbsDown = 'thumbsdown';
}
