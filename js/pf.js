  function knight_check(file, rank){
    if((cell(file, rank) == 10 || cell(file, rank) == 15) && piece_turn % 2 == 0){
      move_all(file, rank, [-1, -1, 1, 1, -2, 2,-2, 2], [2, -2, 2, -2, 1, 1, -1, -1], -1, "n")
    }else if((cell(file, rank) == -10 || cell(file, rank) == -15) && piece_turn % 2 == 1){
      move_all(file, rank, [-1, -1, 1, 1, -2, 2,-2, 2], [2, -2, 2, -2, 1, 1, -1, -1], 1, "n")
    }
  }
  function pawn_check(file, rank){
    if(cell(file, rank) > 0 && cell(file, rank) < 9 && rank+1 > 0 && rank+1 < 9 && piece_turn % 2 == 0){
      if(rank == 2){
        move_all(file, rank, [0,0], [1, 2], 0, "p")
      }else{
        move_all(file, rank, [0], [1], 0, "p")
      }
      move_all(file, rank, [1, -1], [1, 1], -1, "kp")
      if(rank == 5){
        enp(file, rank, 1, 3)
      }
    }else if(cell(file, rank) > -9 && cell(file, rank) < 0 && rank-1 > 0 && rank-1 < 9 && piece_turn % 2 == 1){
      if(rank == 7){
        move_all(file, rank, [0,0], [-1, -2], 0, "p")
      }else{
        move_all(file, rank, [0], [-1], 0, "p")
      }
      move_all(file, rank, [1, -1], [-1, -1], 1, "kp")
      if(rank == 4){
        enp(file, rank, -1, 2)
      }
    }
  }
  function rook_check(file, rank){
    if((cell(file, rank) == 9 || cell(file, rank) == 16) && piece_turn % 2 == 0){
      move_all(file, rank, [0,0,0,0,0,0,0], [1,2,3,4,5,6,7], -1, "r")
      move_all(file, rank, [1,2,3,4,5,6,7], [0,0,0,0,0,0,0], -1, "r")
      move_all(file, rank, [0,0,0,0,0,0,0], [-1,-2,-3,-4,-5,-6,-7], -1, "r")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [0,0,0,0,0,0,0], -1, "r")
    }else if((cell(file, rank) == -9 || cell(file, rank) == -16) && piece_turn % 2 == 1){
      move_all(file, rank, [0,0,0,0,0,0,0], [1,2,3,4,5,6,7], 1, "r")
      move_all(file, rank, [1,2,3,4,5,6,7], [0,0,0,0,0,0,0], 1, "r")
      move_all(file, rank, [0,0,0,0,0,0,0], [-1,-2,-3,-4,-5,-6,-7], 1, "r")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [0,0,0,0,0,0,0], 1, "r")
    }
  }
  function bishop_check(file, rank){
    if((cell(file, rank) == 11 || cell(file, rank) == 14) && piece_turn % 2 == 0){
      move_all(file, rank, [1,2,3,4,5,6,7], [1,2,3,4,5,6,7], -1, "b")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [-1,-2,-3,-4,-5,-6,-7], -1, "b")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [1,2,3,4,5,6,7], -1, "b")
      move_all(file, rank, [1,2,3,4,5,6,7], [-1,-2,-3,-4,-5,-6,-7], -1, "b")
    }else if((cell(file, rank) == -11 || cell(file, rank) == -14) && piece_turn % 2 == 1){
      move_all(file, rank, [1,2,3,4,5,6,7], [1,2,3,4,5,6,7], 1, "b")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [-1,-2,-3,-4,-5,-6,-7], 1, "b")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [1,2,3,4,5,6,7], 1, "b")
      move_all(file, rank, [1,2,3,4,5,6,7], [-1,-2,-3,-4,-5,-6,-7], 1, "b")
    }
  }
  function queen_check(file, rank){
    if(cell(file, rank) == 12 && piece_turn % 2 == 0){
      move_all(file, rank, [1,2,3,4,5,6,7], [1,2,3,4,5,6,7], -1, "q")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [-1,-2,-3,-4,-5,-6,-7], -1, "q")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [1,2,3,4,5,6,7], -1, "q")
      move_all(file, rank, [1,2,3,4,5,6,7], [-1,-2,-3,-4,-5,-6,-7], -1, "q")
      move_all(file, rank, [0,0,0,0,0,0,0], [1,2,3,4,5,6,7], -1, "q")
      move_all(file, rank, [1,2,3,4,5,6,7], [0,0,0,0,0,0,0], -1, "q")
      move_all(file, rank, [0,0,0,0,0,0,0], [-1,-2,-3,-4,-5,-6,-7], -1, "q")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [0,0,0,0,0,0,0], -1, "q")
    }else if(cell(file, rank) == -12 && piece_turn % 2 == 1){
      move_all(file, rank, [1,2,3,4,5,6,7], [1,2,3,4,5,6,7], 1, "q")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [-1,-2,-3,-4,-5,-6,-7], 1, "q")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [1,2,3,4,5,6,7], 1, "q")
      move_all(file, rank, [1,2,3,4,5,6,7], [-1,-2,-3,-4,-5,-6,-7], 1, "q")
      move_all(file, rank, [0,0,0,0,0,0,0], [1,2,3,4,5,6,7], 1, "q")
      move_all(file, rank, [1,2,3,4,5,6,7], [0,0,0,0,0,0,0], 1, "q")
      move_all(file, rank, [0,0,0,0,0,0,0], [-1,-2,-3,-4,-5,-6,-7], 1, "q")
      move_all(file, rank, [-1,-2,-3,-4,-5,-6,-7], [0,0,0,0,0,0,0], 1, "q")
    }
  }
  function king_check(file, rank, toggle_castling){
    if(cell(file, rank) == 13 && piece_turn % 2 == 0){
      console.log(boarddng)
      coh(file, rank, hbd)
      cohcellhbd(file, rank, 1)
      move_all(file, rank, [0+celldng(b, 3), 0+celldng(b, 1), 1+celldng(c, 2), -1+celldng(a, 2), 1+celldng(c, 3), 1+celldng(c, 1), -1+celldng(a, 3), -1+celldng(a, 1)], [1, -1, 0, 0, 1, -1, 1, -1], -1, "k")
      if((cellpmv(e, 1) + celldng(b, 2)) == 0 && toggle_castling == 1){
        castling(e, 1, cellpmv(a, 1), cellpmv(h, 1), 1)
      }
    }else if(cell(file, rank) == -13 && piece_turn % 2 == 1){
      console.log(boarddng)
      coh(file, rank, hbd)
      cohcellhbd(file, rank, 1)
      move_all(file, rank, [0+celldng(b, 3), 0+celldng(b, 1), 1+celldng(c, 2), -1+celldng(a, 2), 1+celldng(c, 3), 1+celldng(c, 1), -1+celldng(a, 3), -1+celldng(a, 1)], [1, -1, 0, 0, 1, -1, 1, -1], 1, "k")
      if((cellpmv(e, 4) + celldng(b, 2)) == 0 && toggle_castling == 1){
        castling(e, 8, cellpmv(a, 4), cellpmv(h, 4), -1)
      }
    }
  }
  function piece_psh(file, rank, toggle_castling){
    initialfr[0] = file
    initialfr[1] = rank
    pin(file, rank)
    pin_r(file, rank)
    pawn_check(file, rank)
    knight_check(file, rank)
    king_check(file, rank, toggle_castling)
    rook_check(file, rank)
    bishop_check(file, rank)
    queen_check(file, rank)
  }