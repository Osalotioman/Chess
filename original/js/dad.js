var foundspot = false
var findingspot = false
var infocus = false
function findSmallestNumber(numbers) {
    let smallest = numbers[0];  
    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] < smallest) {
            smallest = numbers[i];
          }
    }
    return smallest;
}
function findClosestToZero(numbers) {
    let closestNumber = numbers[0]; // Assume the first number is the closest to zero
    for (let i = 1; i < numbers.length; i++) {
        if (Math.abs(numbers[i]) < Math.abs(closestNumber)) {
            closestNumber = numbers[i]; // Found a number closer to zero
        } else if (Math.abs(numbers[i]) === Math.abs(closestNumber) && numbers[i] === 0) {
            closestNumber = numbers[i]; // Found zero itself
        }
    }
    return closestNumber;
}
const numbers = [7, -3, 2, 6, -1, 4, -5, 6];
const closestNumber = findClosestToZero(numbers);
//alert(closestNumber)
dplist = ["wqr", "wqn", "wqb", "wq", "wk", "wkb", "wkn", "wkr","bqr", "bqn", "bqb", "bq", "bk", "bkb", "bkn", "bkr","bqrp", "bqnp", "bqbp", "bqp", "bkp", "bkbp", "bknp", "bkrp","wqrp", "wqnp", "wqbp", "wqp", "wkp", "wkbp", "wknp", "wkrp"]
for(let i=0; i<dplist.length; i++){
    document.addEventListener('DOMContentLoaded', () => {
        const element = document.getElementById(dplist[i]);
        let isDragging = false;
        let offset = { x: 0, y: 0 };
            /*
            element.addEventListener('mousedown', handleMouseDown);
            element.addEventListener('mouseup', handleMouseUp);
            element.addEventListener('mousemove', handleMouseMove);
            */
        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchend', handleTouchEnd);
        element.addEventListener('touchmove', handleTouchMove);          
        function handleTouchStart(e) {
            if(infocus) return;
            isDragging = true;
            let coorx1 = [0,0,0,0,0,0,0,0]
            let coory1 = [0,0,0,0,0,0,0,0]
            for(let i=0; i<coorx1.length; i++){
                coorx1[i] = Math.round(element.getBoundingClientRect().left) - coorx[i]
                coory1[i] = Math.round(element.getBoundingClientRect().top) - coory[i]
            }
            let rleft = coorx[coorx1.indexOf(findClosestToZero(coorx1))]
            let ftop = coory[coory1.indexOf(findClosestToZero(coory1))]
            try{
                chessgame(rev_cellrc(rleft, 0), rev_cellrc(ftop, 1))
            }
            catch(err){
                isDragging = false
            }
        }
        function handleTouchEnd(){
            let coorx1 = [0,0,0,0,0,0,0,0]
            let coory1 = [0,0,0,0,0,0,0,0]
            for(let i=0; i<coorx1.length; i++){
                coorx1[i] = Math.round(element.getBoundingClientRect().left) - coorx[i]
                coory1[i] = Math.round(element.getBoundingClientRect().top) - coory[i]
            }
            let rleft = coorx[coorx1.indexOf(findClosestToZero(coorx1))]
            let ftop = coory[coory1.indexOf(findClosestToZero(coory1))]
            try{
                findingspot = true
                chessgame(rev_cellrc(rleft, 0), rev_cellrc(ftop, 1))
                findingspot = false
            }
            catch(err){
                foundspot = false
            }
            if(!foundspot){
              element.style.left = rev_cellrc(initialfr[0], 2) + 'px'
              element.style.top = rev_cellrc(initialfr[1], 3) + 'px'
            }
        }
        function handleTouchMove(e) {
            if (!isDragging) return;
            if(!foundspot){
                element.style.left = `${e.touches[0].clientX - offset.x}px`;
                element.style.top = `${e.touches[0].clientY - offset.y}px`;
            }
        }
        function handleMouseDown(e) {
              /*isDragging = true;
              offset.x = e.offsetX;
              offset.y = e.offsetY;
              //alert("I started")*/
            handleTouchStart(e)
        }
        function handleMouseUp() {
              /*isDragging = false;*/
            handleTouchEnd()
        }
        function handleMouseMove(e) {
              /*if (!isDragging) return;
              element.style.left = `${e.pageX - offset.x}px`;
              element.style.top = `${e.pageY - offset.y}px`;*/
            handleTouchMove(e)
        }
    });
}