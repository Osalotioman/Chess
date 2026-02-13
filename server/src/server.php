<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\WebSocket\ChessWebSocketServer;
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Loop;
use React\Socket\SocketServer;

$host = getenv('WS_HOST');
$host = is_string($host) && $host !== '' ? $host : '0.0.0.0';

$portEnv = getenv('WS_PORT');
$port = is_string($portEnv) && ctype_digit($portEnv) ? (int) $portEnv : 8080;

$loop = Loop::get();
$socket = new SocketServer($host . ':' . $port, [], $loop);

$app = new ChessWebSocketServer();
$server = new IoServer(new HttpServer(new WsServer($app)), $socket, $loop);

fwrite(STDOUT, '[' . date('c') . "] WS listening on ws://{$host}:{$port}" . PHP_EOL);
$server->run();

