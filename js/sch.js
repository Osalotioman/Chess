function setboard(prmv){
    let mdl = ""
    for(let i=0; i<prmv.length/2; i++){
        if(prmv[2*i] != "#"){
            chessgame(eval(prmv[2*i]), eval(prmv[2*i+1]), 2)
        }else{
          mdl += prmv[2*i+1]
          if(mdl == "queen" || mdl == "knight" || mdl == "bishop" || mdl == "rook"){
            handlePromotionSelection(mdl, 1)
            mdl = ""
          }
        }
    }
}
function hashstring(st){
  let stn = ""
  for(let i=0; i<st.length; i++){
    stn += "#"+st[i]
  }
  return stn
}
function rs(){
  localStorage.test = ""
  window.location.reload()
}
function rhf(){
  let cl = ["", "green"]
  let hl = [["border: 10px solid white;", ""], 
            ["border: 10px solid green;", ""], 
            ["border: 10px solid yellow;", ""], 
            ["border: 10px solid purple;", ""], 
            ["border: 10px solid red;", ""]]
  document.getElementById("rh").style = "background-color: "+ cl[rhc % 2]+";"
  //hbd = hl[0][rhc % 2]
  hsq = hl[1][rhc % 2]
  ksq = hl[2][rhc % 2]
  csl = hl[3][rhc % 2]
  //checkv = hl[4][rhc % 2]
  //alert("I work")
  rhc += 1
}
function po(){
  let cn = [["rotate(0deg)", "rotate(0deg)"], 
            ["rotate(180deg)", "rotate(180deg)"],
            ["rotate(180deg)", "rotate(0deg)"]]
  let wp = document.getElementsByClassName("white_pieces")
  let bp = document.getElementsByClassName("black_pieces")
  for(let i=0; i<bp.length; i++){
    bp[i].style.transform = cn[poc % 3][0]
    wp[i].style.transform = cn[poc % 3][1]
  }
  //alert("I work")
  poc += 1
}
setboard(localStorage.test)
//rh()
//alert(localStorage.test)