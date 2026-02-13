<?php

declare(strict_types=1);

use App\Support\Json;
use PHPUnit\Framework\TestCase;

final class JsonTest extends TestCase
{
    public function testTryDecodeArrayReturnsNullForNonJson(): void
    {
        self::assertNull(Json::tryDecodeArray('hello'));
        self::assertNull(Json::tryDecodeArray(''));
        self::assertNull(Json::tryDecodeArray(" \n\t"));
    }

    public function testTryDecodeArrayDecodesValidJsonObject(): void
    {
        $decoded = Json::tryDecodeArray('{"type":"ping"}');
        self::assertIsArray($decoded);
        self::assertSame('ping', $decoded['type']);
    }

    public function testTryDecodeArrayReturnsNullForInvalidJson(): void
    {
        self::assertNull(Json::tryDecodeArray('{"type":'));
    }
}
