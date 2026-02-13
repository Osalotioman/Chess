<?php

declare(strict_types=1);

namespace App\Support;

final class Json
{
    private function __construct()
    {
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function tryDecodeArray(string $payload): ?array
    {
        $payload = trim($payload);
        if ($payload === '') {
            return null;
        }

        $first = $payload[0] ?? '';
        if ($first !== '{' && $first !== '[') {
            return null;
        }

        $decoded = json_decode($payload, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null;
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }
}
