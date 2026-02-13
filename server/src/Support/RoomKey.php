<?php

declare(strict_types=1);

namespace App\Support;

final class RoomKey
{
    private function __construct()
    {
    }

    public static function sanitize(?string $room): ?string
    {
        if ($room === null) {
            return null;
        }

        $room = trim($room);
        if ($room === '') {
            return null;
        }

        $room = preg_replace('/[^a-zA-Z0-9_\-:.]/', '_', $room);
        if (!is_string($room) || $room === '') {
            return null;
        }

        return substr($room, 0, 128);
    }
}
