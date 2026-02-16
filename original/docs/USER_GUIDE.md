# User Guide and Tutorial

Welcome to the **Chess** game user guide! This document will help you get started with playing the game, making moves, and using various features.

## Getting Started

### Starting a Game

1. Open the game in your browser by navigating to the following URL:
    ```
    http://localhost:8000/html/
    ```

2. Choose your preferred mode:
    - **Local Multiplayer:** Play against a friend on the same device.
    - **Online Multiplayer:** Play against an opponent over the internet.

### Making Moves

1. Select a piece by clicking on it. The valid moves for the selected piece will be highlighted on the board.
2. Click on a highlighted square to move the piece to that position.
3. If the move results in a capture, the opponent's piece will be removed from the board.

### Special Moves

- **Castling:** Move the king two squares towards a rook, then move the rook to the square next to the king.
- **En Passant:** Capture a pawn that has moved two squares forward from its starting position, as if it had only moved one square.
- **Pawn Promotion:** When a pawn reaches the opposite end of the board, it can be promoted to a queen, rook, bishop, or knight.

## Game Features

### Multiplayer Mode

- **Local Multiplayer:** Play against a friend on the same device.
- **Online Multiplayer:** Play against an opponent over the internet using a PHP WebSocket server.

### Responsive Design

- The game is designed to work seamlessly on desktops, tablets, and mobile devices.

### Real-time Gameplay

- The game uses WebSocket technology to provide smooth, lag-free interaction in online multiplayer mode.

## Troubleshooting

### Common Issues

- **Connection Problems:** Ensure that your internet connection is stable and that the PHP WebSocket server is running.
- **Piece Movement Issues:** Make sure you are selecting valid moves for the pieces. If a piece cannot move, it may be blocked or in check.

### Getting Help

If you encounter any issues or have questions, please refer to the [Contribution Guidelines](CONTRIBUTING.md) for instructions on reporting issues and seeking assistance.

We hope you enjoy playing the **Chess** game! Happy playing!
