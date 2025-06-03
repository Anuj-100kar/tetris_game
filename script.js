const shapes = [

    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[1, 1, 1], [0, 1, 0], [0, 0, 0]],
    [[1, 1], [1, 1]]
];

const colors = [
    "#fff", "#ff0000", "#3cb371", "#ffa500",
    "#ee82ee", "#6a5acd", "#0000ff", "#ffba8d"
];

const rows = 20;
const cols = 10;


let canvas = document.querySelector("#tetris");
let scoreboard=document.querySelector("h2");
let ctx = canvas.getContext("2d");
ctx.scale(30, 30);

let pieceObj = null;
// // console.log(pieceObj);
let grid=creategrid();
let score=0;
// console.log(grid);

function generateRandomPiece() {
    let ran = Math.floor(Math.random() * shapes.length);
    return {
        piece: shapes[ran],
        x: 4,
        y: 0,
        colorIndex: ran + 1
    };
}

function newgamestate(){
    checkgrid();
    if(pieceObj==null){
        pieceObj=generateRandomPiece();
        renderPiece();
    }
    moveDown();
}

function checkgrid(){
    let count=0;
    for(let i=0;i<grid.length;i++){
        let allfilled=true;
        for(let j=0;j<grid[i].length;j++){
            if(grid[i][j]==0){
                return false;
            }
        }
        if(allfilled){
            grid.slice(i,1);
            grid.unshift([0,0,0,0,0,0,0,0,0,0]);
            count++;
        }
    }
    if(count==1){
        score+=10;
    }
    else if(count==2){
        score+=30;
    }else if(count==3){
        score+=50;
    }else if(count>3){
        score+=100;
    }
    scoreboard.innerHTML="score:"+score;
}
function renderPiece() {
    if(!pieceObj) return;
    let{ piece, x, y, colorIndex }=pieceObj;

    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            if (piece[i][j] === 1) {
                ctx.fillStyle = colors[colorIndex];
                ctx.fillRect(x + j, y + i, 1, 1);
            }
        }
    }
}


// //as we have down the tetrics then after that we have remove the previous because it is canvas.
// // moveDown();
function moveDown(){

    if(!collision(pieceObj.x,pieceObj.y+1))
     pieceObj.y+=1;
   
    else{
        for(let i=0;i<pieceObj.piece.length;i++){
            for(let j=0;j<pieceObj.piece[i].length;j++){
                if(pieceObj.piece[i][j]==1){
                    let p=pieceObj.x+j;
                    let q=pieceObj.y+i;
                    grid[q][p]=pieceObj.colorIndex;
                }
            }
        }
        if(pieceObj.y==0){
            alert("game over");
            grid=creategrid();
            score=0;
        }
        pieceObj=null;
        
    }
    rendergrid();
    
 }
 
 function moveLeft(){

     if(!collision(pieceObj.x-1,pieceObj.y))
     pieceObj.x-=1;
     rendergrid();
 }
 function moveRight(){
     if(!collision(pieceObj.x+1,pieceObj.y))
     pieceObj.x+=1;
     rendergrid();
 }

// //grid is nothing but the representation of our whole canvas.
function creategrid(){
    let grid=[];
    for(let i=0;i<rows;i++){
        grid.push([]);
            for(let j=0;j<cols;j++){
                grid[i].push(0);
            }
    }
    return grid;

}

function rendergrid(){
    for(let i=0;i<grid.length;i++){
        for(let j=0;j<grid[i].length;j++){
            ctx.fillStyle=colors[grid[i][j]];
            ctx.fillRect(j,i,1,1);
        }
    }
    renderPiece();
}
// function rotate() {
//     const newPiece = pieceObj.piece[0].map((val, index) =>
//         pieceObj.piece.map(row => row[index]).reverse()
//     );

//     pieceObj.piece = newPiece;
//     rendergrid();
// }

function rotate(){
    let rotatedpiece=[];
    let piece=pieceObj.piece;
    for(let i=0;i<piece.length;i++){
        rotatedpiece.push([]);
        for(let j=0;j<piece[i].length;j++){
            rotatedpiece[i].push(0);
        }
    }
    for(let i=0;i<piece.length;i++){
        for(let j=0;j<piece[i].length;j++){
            rotatedpiece[i][j]=piece[j][i];
        }
    }
    for(let i=0;i<rotatedpiece.length;i++){
        rotatedpiece[i]=rotatedpiece[i].reverse();
    }
    if(!collision(pieceObj.x,pieceObj.y,rotatedpiece))
        pieceObj.piece=rotatedpiece;
    rendergrid();
    
}
function collision(x,y,rotatedpiece){
    let piece=rotatedpiece || pieceObj.piece;
    for(let i=0;i<piece.length;i++){
        for(let j=0;j<piece[i].length;j++){
            if(piece[i][j]==1){
                let p=x+j;
                let q=y+i;
                if(p>=0 && p<cols && q>=0 && q<rows){
                    if(grid[q][p]>0){
                    return true;
                    }
                }else{
                    return true;
                }
            }
        }
    }
    return false;
}
// //by applying event listener , it simply rotate them.

document.addEventListener("keydown",function(e){
    let key=e.code;
    if(key=="ArrowDown"){
        moveDown();
    }else if(key=="ArrowLeft"){
        moveLeft();
    }else if(key=="ArrowRight"){
        moveRight();
    }else if(key=="ArrowUp"){
        rotate();
    }
});


setInterval(newgamestate, 500);
pieceObj = generateRandomPiece();
renderPiece();
