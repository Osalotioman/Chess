  function cell(file, rank){
    return board[(7-(rank-1))][(file - 1)]
  }
  function cellid(file, rank){
    return boardid[(7-(rank-1))][(file - 1)]
  }
  function cellstatic(file, rank){
    return boardstatic[(3-(rank-1))][(file-1)]
  }
  function cellppa(file, rank){
    return boardppa[(7-(rank-1))][(file - 1)]
  }
  function cellpid(file, rank){
    return boardpid[(7-(rank-1))][(file - 1)]
  }
  function rev_cell1(num){  
      let f = 1
      let r = 1
      npoc = 0
      while(f<9){
        while(r<9){
          if(cell(f, r) == num){
            listpc[npoc][0] = f
            listpc[npoc][1] = r
            npoc += 1
          }
          r += 1
        }
        f += 1
        r = 1
      }
  }
  function rev_cell(num, p){  
      let f = 1
      let r = 1
      while(f<9){
        while(r<9){
          if(cell(f, r) == num){
            if(p == 0){
              return f
            }else if(p == 1){
              return r
            }
          }
          r += 1
        }
        f += 1
        r = 1
      }
  }
  function rev_cellrc(coor, p){
  	if(p == 0){
  		if(coor == 35){
  		 return a
  		}else if(coor == 152){
  			return b
  		}else if(coor == 267){
  			return c
  		}else if(coor == 384){
  			return d
  		}else if(coor == 501){
  			return e
  		}else if(coor == 618){
  			return f
  		}else if(coor == 735){
  			return g
  		}else if(coor == 852){
  			return h
  		}
  	}else if(p == 1){
  		if(coor == 1144){
  		 return 1
  		}else if(coor == 1027){
  			return 2
  		}else if(coor == 910){
  			return 3
  		}else if(coor == 793){
  			return 4
  		}else if(coor == 676){
  			return 5
  		}else if(coor == 559){
  			return 6
  		}else if(coor == 442){
  			return 7
  		}else if(coor == 325){
  			return 8
  		}
  	}else if(p == 2){
  		if(coor == a){
  		 return 35
  		}else if(coor == b){
  			return 152
  		}else if(coor == c){
  			return 267
  		}else if(coor == d){
  			return 384
  		}else if(coor == e){
  			return 501
  		}else if(coor == f){
  			return 618
  		}else if(coor == g){
  			return 735
  		}else if(coor == h){
  			return 852
  		}
  	}else if(p == 3){
  		if(coor == 1){
  		 return 1144
  		}else if(coor == 2){
  			return 1027
  		}else if(coor == 3){
  			return 910
  		}else if(coor == 4){
  			return 793
  		}else if(coor == 5){
  			return 676
  		}else if(coor == 6){
  			return 559
  		}else if(coor == 7){
  			return 442
  		}else if(coor == 8){
  			return 325
  		}
  	}
  }
  function rev_cellppa(num, p){
    let f = 1
    let r = 1
    while(f<9){
      while(r<9){
        if(cellppa(f, r) == num){
          if(p == 0){
            return f
          }else if(p == 1){
            return r
          }
        }
        r += 1
      }
      f += 1
      r = 1
    }
  }
  function rev_cellstatic(num, p){
    let f = 1
    let r = 1
    while(f<9){
      while(r<5){
        if(cellstatic(f, r) == num){
          if(p == 0){
            return f
          }else if(p == 1){
            return r
          }
        }
        r += 1
      }
      f += 1
      r = 1
    }
  }
  function boardindex(piecenum){
    ntpa = 0
    let n = 0
    let bool = false
    while(n<8){
      if(board[n].indexOf(piecenum) != -1){
        bool = true
        ntpa += 1
      }
      n += 1
    }
    return bool
  }
  function celldng(file, rank){
    return boarddng[(2-(rank-1))][(file)]
  }
  function cellpmv(file, rank){
    return boardpmv[(3-(rank-1))][(file-1)]
  }
  function cellhbd(file, rank){
    return boardhbd[(7-(rank-1))][(file - 1)]
  }
  function cellasq(file, rank){
    return boardasq[(7-(rank-1))][(file - 1)]
  }
  function cellhsq(file, rank){
    return boardhsq[(7-(rank-1))][(file - 1)]
  }
  function cellksq(file, rank){
    return boardksq[(7-(rank-1))][(file - 1)]
  }
  function cellnew(file, rank, dfile, drank){
    board[(7-(drank-1))][(dfile - 1)] = board[(7-(rank-1))][(file - 1)]
    board[(7-(rank-1))][(file - 1)] = 0
    boardppa[(7-(drank-1))][(dfile - 1)] = boardppa[(7-(rank-1))][(file - 1)]
    boardppa[(7-(rank-1))][(file - 1)] = 0
    boardid[(7-(drank-1))][(dfile - 1)] = boardid[(7-(rank-1))][(file - 1)]
    boardid[(7-(rank-1))][(file - 1)] = ""
    boardpid[(7-(drank-1))][(dfile - 1)] = boardpid[(7-(rank-1))][(file - 1)]
    boardpid[(7-(rank-1))][(file - 1)] = ""
  }
  function kcellnew(file, rank){
    board[(7-(rank-1))][(file - 1)] = 0
    boardppa[(7-(rank-1))][(file - 1)] = 0
    boardid[(7-(rank-1))][(file - 1)] = ""
    boardpid[(7-(rank-1))][(file - 1)] = ""
  }
  function cellpind(file, rank, kf, kr, frn1, frn2, state){
    if(state == "store"){
      for(let i=0; i<8; i++){
        if(pind[i][0] == cellpid(file, rank)){
          break
        }else if(pind[i][0] == ""){
          pind[i][0] = cellpid(file, rank)
          pind[i][1][0] = frn1
          pind[i][1][1] = frn2
          pind[i][2][0][0] = kf
          pind[i][2][0][1] = kr
          pind[i][2][1][0] = file
          pind[i][2][1][1] = rank
          break
        }
      }
    }else if(state == "retrieve"){     
      for(let i=0; i<8; i++){
        if(cellpid(file, rank) == pind[i][0]){
          return i
        }
      }
    }else if(state == "remove"){
      for(let i=0; i<8; i++){
        if(cellpid(file, rank) == pind[i][0]){
          pind[i][0] = ""
        }
      }
    }
  }
  function copcellppa(file, rank, state){
    boardppa[(7-(rank-1))][(file - 1)] = state
  }
  function cohcellpmv(file, rank, state){
    boardpmv[(3-(rank-1))][(file-1)] += state
  }
  function cohcelldng(file, rank, state){
    boarddng[(2-(rank-1))][(file)] = state
  }
  function cohcellhbd(file, rank, state){
    boardhbd[(7-(rank-1))][(file - 1)] = state
  }
  function copcell(file, rank, state){
    board[(7-(rank-1))][(file - 1)] = state
  }
  function cohcellhsq(file, rank, state){
    boardhsq[(7-(rank-1))][(file - 1)] = state
  }
  function cohcellksq(file, rank, state){
    boardksq[(7-(rank-1))][(file - 1)] = state
  }
  function cohcellasq(file, rank, state){
    boardasq[(7-(rank-1))][(file - 1)] = state
  }
  function copcellpid(file, rank, state){
    boardpid[(7-(rank-1))][(file - 1)] += state
  }
  function reset_asq(){
    for(let n=0; n < 8; n++){
      for(let m=0; m < 8; m++){
        boardasq[n][m] = 99
      }
    }
  }
  function clear_dng(){
    for(let n=0; n<3; n++){
      for(let m=0; m<5; m++){
        boarddng[n][m] = 0
      }
    }
  }
  function mpm(){
    let pf = 1
    let pr = 1
    while(pr < 5){
      while(pf < 9){
        if(cellpmv(pf, pr) == 1){
          cohcellpmv(pf, pr, 1)
        }
        pf += 1
      }
      pr += 1
      pf = 1
    }
  }