  function getRandomCharTriplet() {
    const characters = 'abcdefghijklmnopqrstuvwxyz'  
    let res = ''
    for(let i=1; i <= 3; i++) {
      res += characters.charAt(Math.floor(Math.random()*26))
    }
    return res;
  }
  
function generateRoomId() {
    let generatedId = ''
    for(let i=1; i <= 3; i++) {
      generatedId += getRandomCharTriplet();
      if(i!=3) generatedId+='-';
    }
    return generatedId
}

export {
  generateRoomId
}