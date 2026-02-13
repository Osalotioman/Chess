<?php

declare(strict_types=1);

namespace App\WebSocket;

use App\Support\Json;
use App\Support\RoomKey;
use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;

final class ChessWebSocketServer implements MessageComponentInterface
{
    /** @var \SplObjectStorage<ConnectionInterface, array{room:?string, role:?string}> */
    private \SplObjectStorage $clients;

    /** @var array<string, array<int, ConnectionInterface>> */
    private array $rooms = [];

    public function __construct()
    {
        $this->clients = new \SplObjectStorage();
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        $meta = ['room' => null, 'role' => null];

        // Optional: join via query string, e.g. ws://host:8080?room=abc&role=white
        $query = $this->getQueryParams($conn);
        if (isset($query['room'])) {
            $meta['room'] = RoomKey::sanitize($query['room']);
        }
        if (isset($query['role']) && $query['role'] !== '') {
            $meta['role'] = strtolower($query['role']);
        }

        $this->clients->attach($conn, $meta);

        if ($meta['room'] !== null) {
            $this->joinRoom($conn, $meta['room']);
        }

        $this->log('OPEN', $conn, $meta['room']);
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        $payload = is_string($msg) ? trim($msg) : '';
        if ($payload === '') {
            return;
        }

        $decoded = Json::tryDecodeArray($payload);
        if (is_array($decoded)) {
            $this->handleJsonMessage($from, $decoded);
            return;
        }

        // Raw protocol (current frontend):
        // - moves: "<file><rank>" e.g. "34"
        // - promotions: "queen" | "rook" | "bishop" | "knight"
        // - host signals: 12345 / -12345
        // Server behavior: broadcast raw payload to other clients (prefer same room).
        $room = $this->getClientMeta($from)['room'] ?? null;
        $this->broadcastRaw($from, $payload, is_string($room) ? $room : null);
    }

    public function onClose(ConnectionInterface $conn): void
    {
        $meta = $this->getClientMeta($conn);
        if (isset($meta['room']) && is_string($meta['room'])) {
            $this->leaveRoom($conn, $meta['room']);
        }

        if ($this->clients->contains($conn)) {
            $this->clients->detach($conn);
        }

        $this->log('CLOSE', $conn, $meta['room'] ?? null);
    }

    public function onError(ConnectionInterface $conn, \Exception $e): void
    {
        $this->log('ERROR', $conn, null, $e->getMessage());
        $conn->close();
    }

    /** @return array<string, mixed> */
    private function getClientMeta(ConnectionInterface $conn): array
    {
        if ($this->clients->contains($conn)) {
            $meta = $this->clients[$conn];
            if (is_array($meta)) {
                return $meta;
            }
        }
        return ['room' => null, 'role' => null];
    }

    /** @param array<string, mixed> $decoded */
    private function handleJsonMessage(ConnectionInterface $from, array $decoded): void
    {
        $type = isset($decoded['type']) && is_string($decoded['type']) ? strtolower($decoded['type']) : '';

        if ($type === 'ping') {
            $this->sendJson($from, ['type' => 'pong', 't' => time()]);
            return;
        }

        if ($type === 'join') {
            $room = null;
            if (isset($decoded['room']) && is_string($decoded['room'])) {
                $room = $decoded['room'];
            } elseif (isset($decoded['game']) && is_string($decoded['game'])) {
                $room = $decoded['game'];
            }

            $room = RoomKey::sanitize($room);
            if ($room === null) {
                $this->sendJson($from, ['type' => 'error', 'message' => 'Missing room/game']);
                return;
            }

            $meta = $this->getClientMeta($from);
            if (isset($meta['room']) && is_string($meta['room']) && $meta['room'] !== '' && $meta['room'] !== $room) {
                $this->leaveRoom($from, $meta['room']);
            }

            $meta['room'] = $room;
            if (isset($decoded['role']) && is_string($decoded['role'])) {
                $meta['role'] = strtolower($decoded['role']);
            }
            if ($this->clients->contains($from)) {
                $this->clients[$from] = $meta;
            }

            $this->joinRoom($from, $room);
            $this->sendJson($from, ['type' => 'joined', 'room' => $room, 'clients' => count($this->rooms[$room] ?? [])]);
            $this->broadcastJson($from, ['type' => 'peer_joined', 'room' => $room], $room);
            return;
        }

        if ($type === 'move' || $type === 'promote' || $type === 'chat' || $type === 'state') {
            $meta = $this->getClientMeta($from);
            $room = isset($meta['room']) && is_string($meta['room']) ? $meta['room'] : null;
            if ($room === null) {
                $this->sendJson($from, ['type' => 'error', 'message' => 'Not in a room']);
                return;
            }
            $decoded['t'] = time();
            $this->broadcastJson($from, $decoded, $room);
            return;
        }

        $this->sendJson($from, ['type' => 'error', 'message' => 'Unknown type']);
    }

    private function broadcastRaw(ConnectionInterface $from, string $payload, ?string $room): void
    {
        if ($room !== null && isset($this->rooms[$room])) {
            foreach ($this->rooms[$room] as $conn) {
                if ($conn !== $from) {
                    $conn->send($payload);
                }
            }
            return;
        }

        foreach ($this->clients as $client) {
            if ($client !== $from) {
                $client->send($payload);
            }
        }
    }

    /** @param array<string, mixed> $data */
    private function sendJson(ConnectionInterface $to, array $data): void
    {
        $to->send((string) json_encode($data, JSON_UNESCAPED_SLASHES));
    }

    /** @param array<string, mixed> $data */
    private function broadcastJson(ConnectionInterface $from, array $data, string $room): void
    {
        $encoded = (string) json_encode($data, JSON_UNESCAPED_SLASHES);
        foreach ($this->rooms[$room] ?? [] as $conn) {
            if ($conn !== $from) {
                $conn->send($encoded);
            }
        }
    }

    private function joinRoom(ConnectionInterface $conn, string $room): void
    {
        if (!isset($this->rooms[$room])) {
            $this->rooms[$room] = [];
        }

        foreach ($this->rooms[$room] as $existing) {
            if ($existing === $conn) {
                return;
            }
        }

        $this->rooms[$room][] = $conn;
        $this->log('JOIN', $conn, $room);
    }

    private function leaveRoom(ConnectionInterface $conn, string $room): void
    {
        if (!isset($this->rooms[$room])) {
            return;
        }

        $this->rooms[$room] = array_values(array_filter(
            $this->rooms[$room],
            static fn (ConnectionInterface $c): bool => $c !== $conn
        ));

        if (count($this->rooms[$room]) === 0) {
            unset($this->rooms[$room]);
        }

        $this->log('LEAVE', $conn, $room);
    }

    /** @return array<string, string> */
    private function getQueryParams(ConnectionInterface $conn): array
    {
        try {
            if (isset($conn->httpRequest)) {
                $uri = $conn->httpRequest->getUri();
                $query = $uri->getQuery();
                $out = [];
                parse_str($query, $out);
                return array_map('strval', is_array($out) ? $out : []);
            }
        } catch (\Throwable $e) {
            // ignore
        }
        return [];
    }

    private function log(string $event, ConnectionInterface $conn, ?string $room, ?string $extra = null): void
    {
        $rid = property_exists($conn, 'resourceId') ? (string) $conn->resourceId : 'unknown';
        $msg = '[' . date('c') . "] {$event} rid={$rid}";
        if ($room !== null) {
            $msg .= " room={$room}";
        }
        if ($extra !== null) {
            $msg .= ' ' . $extra;
        }
        fwrite(STDOUT, $msg . PHP_EOL);
    }
}
