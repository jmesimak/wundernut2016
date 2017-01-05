import React, { Component } from 'react';
import './App.css';
import * as pngjs from 'pngjs';
import Dropzone from 'react-dropzone';
import { chunk } from 'lodash';

class App extends Component {
  constructor() {
    super()
    this.directions = {
      '7 84 19': 'go-up',
      '139 57 137': 'go-left',
      '51 69 169': 'stop',
      '182 149 72': 'turn-right',
      '123 131 154': 'turn-left'
    }
    this.canvas = []
    this.bounds = {}
  }

  _initCanvas(width, height) {
    this.canvas = Array(height).fill().map(() => Array(width).fill([255, 255, 255]))
  }

  _createPixels(rgbCodes) {
    return chunk(rgbCodes, 4).map((pixel) => pixel.slice(0, pixel.length - 1))
  }

  _convertPixelsToImageMatrix(pixels, width, height) {
    return chunk(pixels, width)
  }

  _isDirection(pixel) {
    return !!this.directions[pixel.join(' ')]
  }

  _drawByControlpixels(imageMatrix) {
    imageMatrix.forEach((row, rowIdx) => {
      row.forEach((pixel, pixelIdx) => {
        switch (this.directions[pixel.join(' ')]) {
          case 'go-up': this._drawLine('up', {x: pixelIdx, y: rowIdx}, this._moveFn('up'), imageMatrix); break;
          case 'go-left': this._drawLine('left', {x: pixelIdx, y: rowIdx}, this._moveFn('left'), imageMatrix); break;
          default: break;
        }              
      })
    })
  }

  _paintHere(pixel) {
    return !this.directions[pixel.join(' ')]
  }

  _moveFn(dir) {
    switch (dir) {
      case 'left': return (coords) => { coords.x -= 1 }
      case 'right': return (coords) => { coords.x += 1 }
      case 'up': return (coords) => { coords.y -= 1 }
      case 'down': return (coords) => { coords.y += 1 }
      default: return () => {}
    }
  }

  _directionChange(pixel, coords, left, right, imageMatrix) {
    let leftFn = this._moveFn(left)
    let rightFn = this._moveFn(right)
    switch (this.directions[pixel.join(' ')]) {
      case 'turn-right': this._drawLine(right, coords, rightFn, imageMatrix); break;
      case 'turn-left': this._drawLine(left, coords, leftFn, imageMatrix); break;
      default: break;
    }
  }

  _drawLine(dir, coords, move, imageMatrix) {
    move(coords)
    let pixel = imageMatrix[coords.y][coords.x]
    while (this._paintHere(pixel)) {
      this.canvas[coords.y][coords.x] = [0,0,0]
      move(coords)
      pixel = imageMatrix[coords.y][coords.x]
    }
    switch (dir) {
      case 'up': this._directionChange(pixel, coords, 'left', 'right', imageMatrix); break;
      case 'down': this._directionChange(pixel, coords, 'right', 'left', imageMatrix); break;
      case 'left': this._directionChange(pixel, coords, 'down', 'up', imageMatrix); break;
      case 'right': this._directionChange(pixel, coords, 'up', 'down', imageMatrix); break;
      default: break;
    }
  }
  
  _printMtx(m) {
    let answ = m.map((row) => 
      row.map((pixel) => 
        pixel.join(' ') === '255 255 255' ? ' ' : 'X')
      .join(''))
    .join('\n')

    /* Ugly hack because this has taken enough time already */
    document.getElementById('dropzone').remove()
    let line = document.createElement('pre')
    line.setAttribute('class', 'animated fadeIn')
    line.appendChild(document.createTextNode(answ))
    document.getElementById('answ').appendChild(line)
  }

  _fillInControlPixels(imageMatrix) {
    imageMatrix.forEach((row, rowIdx) => {
      row.forEach((pixel, pixelIdx) => {
        if (this._isDirection(pixel)) this.canvas[rowIdx][pixelIdx] = [0,0,0]
      })
    })
  }

  handleFile(acceptedFiles, rejectedFiles) {
    let file = acceptedFiles[0]
    let fr = new FileReader()

    fr.onload = (fileReadEvent) => {
      let bytes = new Uint8Array(fileReadEvent.target.result)
      let PNG = pngjs.PNG
      new PNG().parse(bytes, (err, parseResult) => {
        this.bounds.x = parseResult.width
        this.bounds.y = parseResult.height
        const rgbCodes = parseResult.data
        const pixels = this._createPixels(rgbCodes)
        const imageMatrix = this._convertPixelsToImageMatrix(pixels, this.bounds.x, this.bounds.y)
        this._initCanvas(this.bounds.x, this.bounds.y)
        this._drawByControlpixels(imageMatrix)
        this._fillInControlPixels(imageMatrix)
        this._printMtx(this.canvas)
      })
    }

    fr.readAsArrayBuffer(file)
  }

  render() {
    const dropStyle = {
      margin: '0 auto',
      border: '1px solid grey',
      width: '25em',
      height: '25em',
      padding: '2em',
      backgroundColor: '#a8a8a8',
      color: 'white'
    }

    return (
      <div className="App">
        <h1>Wunder🥜 2016 decrypter</h1>
        <Dropzone onDrop={this.handleFile.bind(this)} id="dropzone" style={dropStyle}>
          <h2>Drop the image here and I guarantee you'll be amazed! <br/> (p.s. no error checking)</h2>
        </Dropzone>
        
        <div id="answ"></div>
      </div>
    )
  }
}

export default App
