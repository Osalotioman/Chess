# API Documentation

This document provides detailed API documentation for the **Chess** project. It includes explanations for functions, classes, and modules used in the project.

## Functions

### `restore_check()`

Restores the check status on the board.

### `coh(file, rank, htype)`

Highlights a square on the board.

### `clear_ho()`

Clears all highlights on the board.

### `clear_highlight()`

Clears all highlights and resets the highlight arrays.

### `cosrc(file, rank, ptype)`

Sets the source of an image element on the board.

### `cop(file, rank, ptype)`

Sets the position of a piece on the board.

### `move_all(file, rank, listf, listr, state, pname)`

Moves a piece to all valid positions based on the provided lists.

### `checkmate()`

Checks if the current position is a checkmate.

### `stalemate(state)`

Checks if the current position is a stalemate.

### `manageBoard_pins(state)`

Manages the pins on the board.

### `pin(file, rank)`

Pins a piece on the board.

### `pin_r(file, rank)`

Restores a pinned piece on the board.

### `linos(state, p)`

Handles the logic for line of sight checks.

### `dngsq(state, p, s)`

Handles the logic for danger squares.

### `piece_rec(file, rank, dfile, drank, s)`

Records a piece's movement.

### `chessgame(file, rank, s)`

Handles the main game logic for a move.

### `enp(file, rank, state, rstate)`

Handles the logic for en passant moves.

### `castling(file, rank, r1c, r2c, state)`

Handles the logic for castling moves.

## Classes

### `ChessGame`

The main class for the chess game.

#### Methods

- `startGame()`: Starts a new game.
- `makeMove()`: Makes a move in the game.
- `checkStatus()`: Checks the status of the game.

## Modules

### `board.js`

Handles the board logic and rendering.

### `pieces.js`

Handles the logic for individual pieces.

### `game.js`

Handles the main game logic.

## Code Comments

The code includes comments explaining the logic and purpose of each function and class. These comments are intended to help developers understand the code and make modifications as needed.

For more detailed information, please refer to the source code files in the repository.

We hope this documentation helps you understand the **Chess** project's API. If you have any questions or need further assistance, please feel free to reach out.
