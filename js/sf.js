  function enp(file, rank, state, rstate){
    if(file+1<9 && file+1>0 && rank<9 && rank>0){
      if((cell(file+1, rank) < 9 && cell(file+1, rank) > 0) || (cell(file+1, rank) > -9 && cell(file+1, rank) < 0)){
        if(cellpmv(file+1, rstate) == 1){
          initialfr[6] = file+1
          initialfr[7] = rank
          move_all(file, rank, [1], [state], 0, "enp")
        }
      }
    }
    if(file-1<9 && file-1>0 && rank<9 && rank>0){
      if((cell(file-1, rank) < 9 && cell(file-1, rank) > 0) || (cell(file-1, rank) > -9 && cell(file-1, rank) < 0)){
        if(cellpmv(file-1, rstate) == 1){
          initialfr[6] = file-1
          initialfr[7] = rank
          move_all(file, rank, [-1], [state], 0, "enp")
        }
      }
    }
  }
  function castling(file, rank, r1c, r2c, state){
    if(boardindex(9*state) && r1c == 0 && cellhsq(file-1, rank) == 1 && cellksq(file-1, rank) == 0 && cell(file-3, rank) == 0){
      initialfr[2] = rev_cell(9*state, 0)
      initialfr[3] = rev_cell(9*state, 1)
      move_all(file, rank, [-2+celldng(z, 2)+celldng(a, 2)], [0], 1, "castl1")
    }
    if(boardindex(16*state) && r2c == 0 && cellhsq(file+1, rank) == 1 && cellksq(file+1, rank) == 0){
      initialfr[4] = rev_cell(16*state, 0)
      initialfr[5] = rev_cell(16*state, 1)
      console.log("King position: ("+file+", "+rank+")")
      console.log("State: "+state)
      console.log("Rook position: ("+initialfr[4]+", "+initialfr[5]+")")
      move_all(file, rank, [2+celldng(d, 2)+celldng(c, 2)], [0], 1, "castl2")
    }
  }