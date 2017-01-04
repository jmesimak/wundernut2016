var fs = require('fs')
var PNG = require('pngjs').PNG

const directions = {
  '7 84 19': 'go-up',
  '139 57 137': 'go-left',
  '51 69 169': 'stop',
  '182 149 72': 'turn-right',
  '123 131 154': 'turn-left'
}

var bounds = {}
var canvas = []

function createPixels(rgbCodes) {
    let pixels = []
    for (var i = 0; i < rgbCodes.length; i += 4) {
      pixels.push([rgbCodes[i], rgbCodes[i+1], rgbCodes[i+2]])
    }
    return pixels
}

function convertPixelsToImageMatrix(pixels, width, height) {
  let imageMatrix = []
  for (var i = 0; i < height; i++) {
    let row = []
    for (var j = 0; j < width; j++) {
      let pad = i * width
      let curPix = pixels[j + pad]
      row.push(curPix)
    }
    imageMatrix.push(row)
  } 
  return imageMatrix
}

function initCanvas(width, height) {
  for (var i = 0; i < height; i++) {
    var row = []
    for (var j = 0; j < width; j++) {
      row.push([255, 255, 255])
    }
    canvas.push(row)
  }
}

function drawByControlpixels(imageMatrix) {
  for (var rowIdx = 0; rowIdx < imageMatrix.length; rowIdx++) {
    let row = imageMatrix[rowIdx]
    for (var pixelIdx = 0; pixelIdx < row.length; pixelIdx++) {
      let pixel = row[pixelIdx]
      let instruction = directions[pixel.join(' ')]
      if (instruction) {
        switch (instruction) {
          case 'go-up': goUp(pixelIdx, rowIdx, imageMatrix); break;
          case 'go-left': goLeft(pixelIdx, rowIdx, imageMatrix); break;
        }              
      }
    }
  }
}

function fillInControlPixels(controlPixels) {
    controlPixels.forEach((cp) => {
      canvas[cp[0]][cp[1]] = [0,0,0]
    });
}

fs.createReadStream('img.png')
  .pipe(new PNG())
  .on('parsed', function() {
    let rgbCodes = this.data
    bounds.width = this.width
    bounds.height = this.height
    let pixels = createPixels(rgbCodes)
    let imageMatrix = convertPixelsToImageMatrix(pixels, bounds.width, bounds.height)
    let controlPixels = listInstructions(imageMatrix)
    initCanvas(bounds.width, bounds.height)
    drawByControlpixels(imageMatrix)
    fillInControlPixels(controlPixels)
    printMtx(canvas)
  });

function printMtx(m) {
  for (var i = 0; i < m.length; i++) {
    let str = ""
    for (var j = 0; j < m[i].length; j++) {
      m[i][j].join(' ') === '255 255 255' ? str += ' ' : str += 'X'
    }
    console.log(str);
  }
}

function listInstructions(mtx) {
  let pxls = []
  for (var i = 0; i < mtx.length; i++) {
    for (var j = 0; j < mtx[i].length; j++) {
      let dir = directions[mtx[i][j].join(' ')]
      if (dir) pxls.push([i, j])
    }
  }
  return pxls
}

function paintHere(pixel) {
  const pStr = directions[pixel.join(' ')]
  return !pStr
}

function directionChange(pixel, x, y, left, right, imageMatrix) {
  switch (directions[pixel.join(' ')]) {
    case 'turn-right': right(x, y, imageMatrix); break;
    case 'turn-left': left(x, y, imageMatrix); break;
  }
}

function goUp(x, y, imageMatrix) {
  y -= 1
  let pixel = imageMatrix[y][x]
  while (paintHere(pixel) && y > 0) {
    canvas[y][x] = [0,0,0]
    y -= 1
    pixel = imageMatrix[y][x]
  }
  directionChange(pixel, x, y, goLeft, goRight, imageMatrix)
}

function goLeft(x, y, imageMatrix) {
  x -= 1
  let pixel = imageMatrix[y][x]
  while (paintHere(pixel) && x > 0) {
    canvas[y][x] = [0,0,0]
    x -= 1;
    pixel = imageMatrix[y][x]
  }
  directionChange(pixel, x, y, goDown, goUp, imageMatrix)
}

function goRight(x, y, imageMatrix) {
  x += 1
  let pixel = imageMatrix[y][x]
  while (paintHere(pixel) && x <= bounds.width) {
    canvas[y][x] = [0,0,0]
    x += 1
    pixel = imageMatrix[y][x]
  }
  directionChange(pixel, x, y, goUp, goDown, imageMatrix)
}

function goDown(x, y, imageMatrix) {
  y += 1
  let pixel = imageMatrix[y][x]
  while (paintHere(pixel) && y < bounds.height) {
    canvas[y][x] = [0,0,0]
    y += 1;
    pixel = imageMatrix[y][x]
  }
  directionChange(pixel, x, y, goRight, goLeft, imageMatrix)
}
