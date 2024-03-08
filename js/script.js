  function restore_check(){
    if(incheck && piece_turn % 2 == 0){
        coh(rev_cell(-13*-1, 0), rev_cell(-13*-1, 1), checkv)
      }else if(incheck){
        coh(rev_cell(-13*1, 0), rev_cell(-13*1, 1), checkv)
      }
  }
  function coh(file, rank, htype){
    document.getElementById("h"+sv[file]+rank).style = htype
  }
  function clear_ho(){
    for(let n=0; n < 8; n++){
      for(let m=0; m < 8; m++){
        coh(n+1, m+1, clear)
      }
    }
  }
  function clear_highlight(){
    for(let n=0; n < 8; n++){
      for(let m=0; m < 8; m++){
        boardhsq[n][m] = 0
        boardhbd[n][m] = 0
        boardksq[n][m] = 0
        coh(n+1, m+1, clear)
      }
    }
  }
  function cosrc(file, rank, ptype){
    document.getElementById(cellid(file, rank)).src = ptype
  }
  function cop(file, rank, ptype){
    mpm()
    let num1 = cell(file, rank)
    cohcellpmv(rev_cellstatic(num1, 0), rev_cellstatic(num1, 1), 1)
    if(cellid(file, rank) != ""){
      document.getElementById(cellid(file, rank)).style = ptype
    }else{
      shrinkassist = false
    }
  }
  function move_all(file, rank, listf, listr, state, pname){
    for(let i=0; i<listf.length; i++){
      if(file+listf[i] > 0 && file+listf[i]<9 && rank+listr[i] > 0 && rank+listr[i]<9 && pname != "linos"){
        if(pname != "k" && pname != "n" && pname != "kp" && pname != "dng" && pname != "kpd" && pname != "castl1" && pname != "castl2" && pname != "enp"){
          if(state*(cell(file+listf[i], rank+listr[i])) > 0){
            coh(file+listf[i], rank+listr[i], ksq)
            cohcellksq(file+listf[i], rank+listr[i], 1)
            linosep = i
            break
          }else if(cell(file+listf[i], rank+listr[i]) != 0){
            linosep = i
            break
          }
        }
        if(pname != "castl1" && pname != "castl2" && pname != "kp" && pname != "dng" && pname != "enp" && cell(file+listf[i], rank+listr[i]) == 0){
          coh(file+listf[i], rank+listr[i], hsq)
          cohcellhsq(file+listf[i], rank+listr[i], 1)
        }else if((pname == "k" || pname == "n" || pname == "kp" || pname == "kpd") && state*(cell(file+listf[i], rank+listr[i])) > 0){
          coh(file+listf[i], rank+listr[i], ksq)
          cohcellksq(file+listf[i], rank+listr[i], 1)
        }else if(pname == "dng" && (cellhsq(file+listf[i], rank+listr[i]) == 1 || cellksq(file+listf[i], rank+listr[i]) == 1)){
          cohcelldng(b+listf[i], 2+listr[i], 100)
        }else if(pname == "dng" && cellhsq(file+listf[i], rank+listr[i]) == 0 && cellksq(file+listf[i], rank+listr[i]) == 0){
          if(incheck && celldng(b+listf[i], 2+listr[i]) == 200){
            //cohcelldng(b+listf[i], 2+listr[i], 0)
            //alert("I started")
          }else{
            cohcelldng(b+listf[i], 2+listr[i], 0)
          }
        }else if(pname == "castl1" && cell(file+listf[i], rank+listr[i]) == 0){
          coh(file+listf[i], rank+listr[i], csl)
          cohcellhsq(file+listf[i], rank+listr[i], 2)
        }else if(pname == "castl2" && cell(file+listf[i], rank+listr[i]) == 0){
          coh(file+listf[i], rank+listr[i], csl)
          cohcellhsq(file+listf[i], rank+listr[i], 3)
        }else if(pname == "enp"){
          coh(file+listf[i], rank+listr[i], ksq)
          cohcellksq(file+listf[i], rank+listr[i], 4)
        }
      }
    }
    if(incheck && pname != "k"){
      for(let i=0; i<listf.length; i++){
        if(file+listf[i] > 0 && file+listf[i]<9 && rank+listr[i] > 0 && rank+listr[i]<9){
          //alert("Its happening")
          if(pname == "linos"){
            cohcellasq(file+listf[i], rank+listr[i], 0)
          }else if(cellasq(file+listf[i], rank+listr[i]) != 0){
            //file += cellasq(file+listf[i], rank+listr[i])
            coh(file+listf[i], rank+listr[i], clear)
            cohcellksq(file+listf[i], rank+listr[i], 0)
            cohcellhsq(file+listf[i], rank+listr[i], 0)
          }
        }
      }
    }
  }
  function checkmate(){
    for(let f = 1; f < 9; f++){
      for(let r = 1; r < 9; r++){
        piece_psh(f, r, 0)
      }
    }
    let checkmate = true
    for(let f = 1; f < 9; f++){
      for(let r = 1; r < 9; r++){
        if(cellhsq(f, r) !=0 || cellksq(f, r) != 0){
          checkmate = false
        }
      }
    }
    clear_highlight()
    return checkmate
  }
  function stalemate(state){
    //When its your turn to play and you can't bloody move, and you're not on Checkmate
  }
  function manageBoard_pins(state){
    //0 is to clear
    //1 is to clear with intension of reinstatement
    //2 is to reinstate
    if(state == 2){
      for(let i=0; i<16; i++){
        if(pind[i][2][1][0] == 0){
          copcell(pind[i][2][1][0], pind[i][2][1][1], 19*cell(f, r))
          pind[i][2][1][0] = 0
          pind[i][2][1][1] = 0
        }
      }
      return
    }
    let f = 1
    let r = 1
    while(f<9){
      while(r<9){
        if(cell(f, r)%19 == 0){
          if(state == 0){
            copcell(f, r, cell(f, r)/19)
            cellpind(f, r, null, null, null, null, "remove")
          }else if(state == 1){
            copcell(f, r, cell(f, r)/19)
            for(let i=0; i<16; i++){
              if(pind[i][2][1][0] == 0){
                pind[i][2][1][0] = f
                pind[i][2][1][1] = r
              }
            }
          }
        }
        r += 1
      }
      f += 1
      r = 1
    }
  }
  function pin(file, rank){
    let state = -1
    if(cell(file, rank) > 0){
      state = 1
    }
    file = rev_cell(13*state, 0)
    rank = rev_cell(13*state, 1)
    manageBoard_pins(0)
    //queen listf/r_dng- 24, 23, 22, 21, 20, 19, 18, 17
    let ori = ['r', 'r', 'r', 'r', 'b', 'b', 'b', 'b']
    let s1 = false
    let pin = [0, 0, 0]
    for(let n=24; n >= 17; n--){
      for(let i=0; i<listf_dng[n].length; i++){
        if(file+listf_dng[n][i] > 0 && file+listf_dng[n][i]<9 && rank+listr_dng[n][i] > 0 && rank+listr_dng[n][i]<9){
          if(state*cell(file+listf_dng[n][i], rank+listr_dng[n][i]) > 0 && !s1){
            pin[0] = file+listf_dng[n][i]
            pin[1] = rank+listr_dng[n][i]
            pin[2] = i
            s1 = true
          }else if(state*cell(file+listf_dng[n][i], rank+listr_dng[n][i]) < 0 && !s1){
            //console.log(i)
            break
          }else if(state*cell(file+listf_dng[n][i], rank+listr_dng[n][i]) > 0 && s1){
            //console.log(i)
            break
          }else if(state*cell(file+listf_dng[n][i], rank+listr_dng[n][i]) < 0 && s1 && (cellpid(file+listf_dng[n][i], rank+listr_dng[n][i])[cellpid(file+listf_dng[n][i], rank+listr_dng[n][i]).length-1] == ori[n%17] || cellpid(file+listf_dng[n][i], rank+listr_dng[n][i])[cellpid(file+listf_dng[n][i], rank+listr_dng[n][i]).length-1] == 'q')){
            copcell(pin[0], pin[1], 19*cell(pin[0], pin[1]))
            //cellpind(pin[0], pin[1], listf_dng[n].slice(pin[3], i+1), listr_dng[n].slice(pin[3], i+1), "store")
            cellpind(pin[0], pin[1], file, rank, listf_dng[n], listr_dng[n], "store")
            break
          }else if(state*cell(file+listf_dng[n][i], rank+listr_dng[n][i]) < 0 && s1 && (cellpid(file+listf_dng[n][i], rank+listr_dng[n][i])[cellpid(file+listf_dng[n][i], rank+listr_dng[n][i]).length-1] == 'n' || cellpid(file+listf_dng[n][i], rank+listr_dng[n][i])[cellpid(file+listf_dng[n][i], rank+listr_dng[n][i]).length-1] == 'k' || cellpid(file+listf_dng[n][i], rank+listr_dng[n][i])[cellpid(file+listf_dng[n][i], rank+listr_dng[n][i]).length-1] == 'p')){
            //Note, you should store this cellpid(file+listf_dng[n][i], rank+listr_dng[n][i])[cellpid(file+listf_dng[n][i], rank+listr_dng[n][i]).length-1] in a variable
            break
          }
        }
      }
      s1 = false
      //console.log(n)
    }
  }
  function pin_r(file, rank){
    if(!incheck && cell(file, rank) % 19 == 0){
      let frn = cellpind(file, rank, null, null, null, null, "retrieve")
      //console.log(frn)
      incheck = true
      copcell(file, rank, cell(file, rank)/19)
      move_all(pind[frn][2][0][0], pind[frn][2][0][1], pind[frn][1][0], pind[frn][1][1], 0, "linos")//Need to get the file and rank arrays from the pin function
      //Call your piece function with your file, rank
      pawn_check(file, rank)
      knight_check(file, rank)
      king_check(file, rank, 0) //Does the king function even need to be here????comebackhere
      rook_check(file, rank)
      bishop_check(file, rank)
      queen_check(file, rank)
      //Return things to normal
      incheck = false
      reset_asq()
      copcell(file, rank, 19*cell(file, rank))
    }
    //Start, first check if the piece num is divisible by 19 and the game is !incheck
  }
  function linos(state, p){
    for(let n=0; n < binum_dng.length; n++){
      if(boardindex(binum_dng[n]*state)){
        rev_cell1(binum_dng[n]*state)
        for(let i=0; i<npoc; i++){
          move_all(listpc[i][0], listpc[i][1], listf_dng[n], listr_dng[n], state*-1, pname_dng[n])
          move_all(listpc[i][0], listpc[i][1], listf_dng[n], listr_dng[n], state, pname_dng[n])
          move_all(rev_cell(-13*state, 0), rev_cell(-13*state, 1), [0], [0], state, "dng")
          clear_highlight()
          if(celldng(b, 2) != 0 && p == "nk" && (pname_dng[n]=="q" || pname_dng[n]=="r" || pname_dng[n]=="b")){
            incheck = true
            var nlrdng = listr_dng[n].slice(0, linosep)
            var nlfdng = listf_dng[n].slice(0, linosep)
            nlrdng[linosep] = 0
            nlfdng[linosep] = 0
            console.log("nlfdng: "+nlfdng)
            console.log("nlrdng: "+nlrdng)
            move_all(listpc[i][0], listpc[i][1], nlfdng, nlrdng, state, "linos")
            //cohcelldng(b+nlfdng[0], 2+nlrdng[0], 235)
            cohcelldng(b+listf_dng[n][0], 2+listr_dng[n][0], 235)
            console.log("I am here.")
            console.log(boardasq)
            break
          }else if(celldng(b, 2) != 0 && p == "nk"){
            incheck = true
            //move_all(rev_cell((binum_dng[n]*state), 0), rev_cell((binum_dng[n]*state), 1), [0], [0], state, "linos")
            move_all(listpc[i][0], listpc[i][1], [0], [0], state, "linos")
            console.log(boardasq)
            break
          }
        }
      }
    }
    if(checkmate()){
      alert("Checkmate")
    }
  }
  function dngsq(state, p, s){
    let n1 = 0
    while(n1 < 8){
      listr_dng[n1][0] = state
      listr_dng[n1][1] = state
      n1 += 1
    }
    for(let n=0; n < binum_dng.length; n++){
      if(boardindex(binum_dng[n]*state)){
        //console.log(ntpa)
        rev_cell1(binum_dng[n]*state)
        for(let i=0; i<npoc; i++){
          move_all(listpc[i][0], listpc[i][1], listf_dng[n], listr_dng[n], state*-1, pname_dng[n])
          move_all(listpc[i][0], listpc[i][1], listf_dng[n], listr_dng[n], state, pname_dng[n])
        }
      }
    }
    move_all(rev_cell(-13*state, 0), rev_cell(-13*state, 1), [0, 0, 1, -1, 1, 1, -1, -1, 0, -2, 2], [1, -1, 0, 0, 1, -1, 1, -1, 0, 0, 0], state, "dng")
    clear_highlight()
    if(celldng(b, 2) != 0 && p == "nk"){
      //linos(file, rank, state, p)
      linos(state, p)
      //console.log("Linos")
      coh(rev_cell(-13*state, 0), rev_cell(-13*state, 1), checkv)
      if(s != 2){
        check.play()
      }
    }else if(celldng(z, 1) == 100 && s != 2){
      castl.play()
    }else if(p == "nk" && s != 2){
      buttons.play()
    }
    if(checkmate() && !incheck){
      console.log("StaleMate")
    }
  }
  function piece_rec(file, rank, dfile, drank, s){
    manageBoard_pins(1)
    let htype = "left: "+htypef[dfile]+"px;" + "top: "+htyper[drank]+"px;"
    piece_turn += 1
    //cop(cell(file, rank), htype)
    cop(file, rank, htype)
    if(cell(file, rank) < 0 && cell(file, rank) > -9 && drank == 1){
      showPromotionModal("black")
    }else if(cell(file, rank) > 0 && cell(file, rank) < 9 && drank == 8){
      showPromotionModal("white")
    }  
    initialfr[8] = dfile
    initialfr[9] = drank
    cellnew(file, rank, dfile, drank)
    if(incheck){
      incheck = false
      reset_asq()
    }
    manageBoard_pins(2)
    if(cell(dfile, drank) < 0){
      //dngsq(rev_cell(13, 0), rev_cell(13, 1), -1, "nk", s)
      dngsq(-1, "nk", s)
    }else{
      //dngsq(rev_cell(-13, 0), rev_cell(-13, 1), 1, "nk", s)
      dngsq(1, "nk", s)
    }
  }
  if(localStorage.server_state == 1){
    socket.onmessage = function(event) {
      const mg = event.data;
      if(mg == "queen" || mg == "knight" || mg == "bishop" || mg == "rook"){
        handlePromotionSelection(mg, 1)
        //mdl = ""
      }else{
        chessgame(parseInt(mg[0]), parseInt(mg[1]), 1);
      }
      clear_ho();
    };
  }
  function chessgame(file, rank,  s){
    if(cell(file, rank) != 0 && cellhbd(file, rank) == 0 && cellksq(file, rank) == 0){
      clear_highlight()
      coh(file, rank, hbd)
      cohcellhbd(file, rank, 1)
      piece_psh(file, rank, 1)
      if(incheck && piece_turn % 2 == 0){
        coh(rev_cell(-13*-1, 0), rev_cell(-13*-1, 1), checkv)
      }else if(incheck){
        coh(rev_cell(-13*1, 0), rev_cell(-13*1, 1), checkv)
      }
     }else if(cell(file, rank) == 0 && cellhsq(file, rank) == 1){
       clear_highlight()
       piece_rec(initialfr[0], initialfr[1], file, rank, s)
     }else if(cell(file, rank) == 0 && cellhsq(file, rank) == 2){
       clear_highlight()
       cohcelldng(z, 1, 100)
       piece_rec(initialfr[0], initialfr[1], file, rank, s)
       piece_rec(initialfr[2], initialfr[3], file+1, rank, s)
       cohcelldng(z, 1, 0)
       piece_turn -= 1
     }else if(cell(file, rank) == 0 && cellhsq(file, rank) == 3){
       clear_highlight()
       cohcelldng(z, 1, 100)
       piece_rec(initialfr[0], initialfr[1], file, rank, s)
       piece_rec(initialfr[4], initialfr[5], file-1, rank, s)
       cohcelldng(z, 1, 0)
       piece_turn -= 1
     }else if(cell(file, rank) != 0 && cellksq(file, rank) == 1){
       clear_highlight()
       if(cellppa(file, rank) != 0 && cellppa(initialfr[0], initialfr[1]) != 0){
         shrinking = true
         num = cellppa(file, rank)
         //cop(num, shrink)
         cop(file, rank, shrink)
         shrinking = false
       }else if(cellppa(file, rank) != 0){
        num = cellppa(file, rank)
        //cop(num, shrink)
        cop(file, rank, shrink)
       }else{
         shrinking = true
         //cop(cell(file, rank), shrink)
         cop(file, rank, shrink)
         shrinking = false
       }
       shrinkassist = true
       piece_rec(initialfr[0], initialfr[1], file, rank, s)
     }else if(cell(file, rank) == 0 && cellksq(file, rank) == 4){
       clear_highlight()
       //cop(cell(initialfr[6], initialfr[7]), shrink)
       cop(initialfr[6], initialfr[7], shrink)
       kcellnew(initialfr[6], initialfr[7])
       piece_rec(initialfr[0], initialfr[1], file, rank, s)
     }else{
       clear_highlight()
       if(incheck && piece_turn % 2 == 0){
        coh(rev_cell(-13*-1, 0), rev_cell(-13*-1, 1), checkv)
      }else if(incheck){
        coh(rev_cell(-13*1, 0), rev_cell(-13*1, 1), checkv)
      }
     }
     if(s != 2){
      localStorage.test += file
      localStorage.test += rank
     }
     if(s == 0 && localStorage.server_state == 1){
      socket.send(file+""+rank);
     }
     restore_check()
  }
  