<?php

declare(strict_types=1);

use App\Support\RoomKey;
use PHPUnit\Framework\TestCase;

final class RoomKeyTest extends TestCase
{
    public function testSanitizeReturnsNullForNullOrEmpty(): void
    {
        self::assertNull(RoomKey::sanitize(null));
        self::assertNull(RoomKey::sanitize(''));
        self::assertNull(RoomKey::sanitize('   '));
    }

    public function testSanitizeReplacesUnsafeCharsAndTrims(): void
    {
        self::assertSame('abc', RoomKey::sanitize(' abc '));
        self::assertSame('a_b_c', RoomKey::sanitize('a b/c'));
        self::assertSame('room:1-2_3', RoomKey::sanitize('room:1-2_3'));
    }

    public function testSanitizeTruncatesTo128Chars(): void
    {
        $long = str_repeat('a', 200);
        $sanitized = RoomKey::sanitize($long);

        self::assertNotNull($sanitized);
        self::assertSame(128, strlen($sanitized));
    }
}
