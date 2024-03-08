  function showPromotionModal(pcol) {
    if(pcol == "white"){
      qrpp.src = "../img/w_rook.png"
      qbpp.src = "../img/w_bishop.png"
      qnpp.src = "../img/w_knight.png"
      qpp.src = "../img/w_queen.png"
    }else{
      qrpp.src = "../img/b_rook.png"
      qbpp.src = "../img/b_bishop.png"
      qnpp.src = "../img/b_knight.png"
      qpp.src = "../img/b_queen.png"
    }
    promotionModal.style.display = "block";
  }
  function hidePromotionModal(){
    promotionModal.style.display = "none";
  }
  function handlePromotionSelection(piece, shps) {
    if(shps == 0){
      localStorage.test += hashstring(piece)
      promote.play()
      socket.send(piece)
    }
    let state = 0
    if(cell(initialfr[8], initialfr[9]) > 0){
      state = 1
      cosrc(initialfr[8], initialfr[9], "../img/w_"+piece+".png")
    }else{
      state = -1
      cosrc(initialfr[8], initialfr[9], "../img/b_"+piece+".png")
    }
    if(piece == "queen"){
      copcellppa(initialfr[8], initialfr[9], cell(initialfr[8], initialfr[9]))
      copcell(initialfr[8], initialfr[9], 12*state)
      copcellpid(initialfr[8], initialfr[9], "q")
      qnc += 1
    }else if(piece == "knight"){
      copcellppa(initialfr[8], initialfr[9], cell(initialfr[8], initialfr[9]))
      copcell(initialfr[8], initialfr[9], 10*state)
      nnc += 1
    }else if(piece == "bishop"){
      copcellppa(initialfr[8], initialfr[9], cell(initialfr[8], initialfr[9]))
      copcell(initialfr[8], initialfr[9], 11*state)
      copcellpid(initialfr[8], initialfr[9], "b")
      bnc += 1
    }else if(piece == "rook"){
      copcellppa(initialfr[8], initialfr[9], cell(initialfr[8], initialfr[9]))
      copcell(initialfr[8], initialfr[9], 9*state)
      copcellpid(initialfr[8], initialfr[9], "r")
      rnc += 1
    }
    dngsq(state, "nk", 2)
    hidePromotionModal();
  }