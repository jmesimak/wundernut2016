import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as pngjs from 'pngjs';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imgString: ""
    }
    this.directions = {
      '7 84 19': 'go-up',
      '139 57 137': 'go-left',
      '51 69 169': 'stop',
      '182 149 72': 'turn-right',
      '123 131 154': 'turn-left'
    };

    this.bounds = {};
  }

  handleFile(fileChooseEvent) {
    let file = fileChooseEvent.target.files[0];
    let fr = new FileReader();

    fr.onload = (fileReadEvent) => {
      let bytes = new Uint8Array(fileReadEvent.target.result);
      let PNG = pngjs.PNG;
      let pngHandler = new PNG().parse(bytes, (err, parseResult) => {
        this.bounds.x = parseResult.width;
        this.bounds.y = parseResult.height;
        let rgbCodes = parseResult.data;
        console.log(rgbCodes)
        let pixels = [];
        for (var i = 0; i < rgbCodes.length; i += 4) {
          pixels.push([rgbCodes[i], rgbCodes[i+1], rgbCodes[i+2]]);
        }

        let imageMatrix = [];
        for (var i = 0; i < parseResult.height; i++) {
          let row = [];
          for (var j = 0; j < parseResult.width; j++) {
            let pad = i * parseResult.width;
            let curPix = pixels[j + pad];
            row.push(curPix);
          }
          imageMatrix.push(row); 
        }



        for (var rowIdx = 0; rowIdx < imageMatrix.length; rowIdx++) {
          let row = imageMatrix[rowIdx];
          for (var pixelIdx = 0; pixelIdx < row.length; pixelIdx++) {
            let pixel = row[pixelIdx];
            let instruction = this.directions[pixel.join(' ')];
            if (instruction) {
              // console.log(`Handling instruction at ${pixelIdx}, ${rowIdx}`)
              // console.log(instruction);
              switch (instruction) {
                case 'go-up': this.goUp(pixelIdx, rowIdx, imageMatrix);
                case 'go-left': this.goLeft(pixelIdx, rowIdx, imageMatrix);
              }              
            }
          }          
        }

      //   console.log('hooha');
        
        let newPixels = imageMatrix.reduce((acc, row) => {
          let rowPixels = row.reduce((rAcc, pixel) => {
            return rAcc.concat(pixel.concat([255]));
          }, []);
          return acc.concat(rowPixels);
        }, []);

        
        let newPng = new PNG({width: 180, height: 60})
        newPng.data = newPixels
        console.log(pd)
        var pd = PNG.sync.read(newPng.data)
        console.log(pd)
        console.log(newPng.pack(newPixels, 180, 60))
        let base64String = btoa(String.fromCharCode(...newPng.data));
        this.setState({
          imgString: 'data:image/png;base64,'+base64String
        })
      });
    }

    fr.readAsArrayBuffer(file);

  }

  goUp(x, y, imageMatrix) {
    console.log(`Got cordinates ${x} and ${y}, going up`);
    let pixel = imageMatrix[y][x]
    do {
      imageMatrix[y][x] = [0,0,0]
      y -= 1;
      pixel = imageMatrix[y][x]
    } while (!this.directions[pixel.join(' ')] && y > 0);

    let instruction = this.directions[pixel.join(' ')];
    if (instruction === 'stop') return;
    if (instruction === 'turn-right') {
      this.goRight(x, y, imageMatrix);
    }
    if (instruction === 'turn-left') {
      this.goLeft(x, y, imageMatrix);
    }
  }

  goLeft(x, y, imageMatrix) {
    console.log(`Got cordinates ${x} and ${y}, going left`);

    let pixel = imageMatrix[y][x]
    do {
      imageMatrix[y][x] = [0,0,0]
      x -= 1;
      pixel = imageMatrix[y][x]
    } while (!this.directions[pixel.join(' ')] && x > 0);

    let instruction = this.directions[pixel.join(' ')];
    if (instruction === 'stop') return;
    if (instruction === 'turn-right') {
      this.goUp(x, y, imageMatrix);
    }
    if (instruction === 'turn-left') {
      this.goDown(x, y, imageMatrix);
    }
  }

  goRight(x, y, imageMatrix) {
    console.log(`Got cordinates ${x} and ${y}, going right`);
    let pixel = imageMatrix[y][x]
    do {
      imageMatrix[y][x] = [0,0,0]
      x += 1;
      pixel = imageMatrix[y][x]
    } while (!this.directions[pixel.join(' ')] && x < this.bounds.x);

    let instruction = this.directions[pixel.join(' ')];
    if (instruction === 'stop') return;
    if (instruction === 'turn-right') {
      this.goDown(x, y, imageMatrix);
    }
    if (instruction === 'turn-left') {
      this.goUp(x, y, imageMatrix);
    }
  }

  goDown(x, y, imageMatrix) {
    console.log(`Got cordinates ${x} and ${y}, going down`);
    let pixel = imageMatrix[y][x]
    do {
      imageMatrix[y][x] = [0,0,0]
      y += 1;
      pixel = imageMatrix[y][x]
    } while (!this.directions[pixel.join(' ')] && y > this.bounds.y);

    let instruction = this.directions[pixel.join(' ')];
    if (instruction === 'stop') return;
    if (instruction === 'turn-right') {
      this.goLeft(x, y, imageMatrix);
    }
    if (instruction === 'turn-left') {
      this.goRight(x, y, imageMatrix);
    }
  }

  drawLineReduceAxis(rowIdx, pixelIdx, axis, imageMatrix) {
    imageMatrix[rowIdx][pixelIdx] = [0, 0, 0];
    let pixel = imageMatrix[rowIdx][pixelIdx];

    if (axis === 'y') {
      rowIdx -= 1;
      while (!this.directions[pixel.join(' ')]) {
        imageMatrix[rowIdx][pixelIdx] = [0, 0, 0];
      }
    } else {
      pixelIdx -= 1;
      while (!this.directions[pixel.join(' ')]) {
        imageMatrix[rowIdx][pixelIdx] = [0, 0, 0];
      }
    }

    let instruction = this.directions[pixel.join(' ')];
    switch (instruction) {
      case 'turn-right': (() => {
        switch (axis) {
          case 'y': this.drawLineIncreaseAxis(rowIdx, pixelIdx, 'x', imageMatrix);
          case 'x': this.drawLineReduceAxis(rowIdx, pixelIdx, 'y', imageMatrix);
        }
      }).call(this);

      case 'turn-left': (() => {
        if (axis === 'y') {
          this.drawLineReduceAxis(rowIdx, pixelIdx, 'x', imageMatrix);
        } else {
          this.drawLineIncreaseAxis(rowIdx, pixelIdx, 'y', imageMatrix);
        }
      }).call(this);
    }      
  }

  drawLineIncreaseAxis(rowIdx, pixelIdx, axis, imageMatrix) {
    imageMatrix[rowIdx][pixelIdx] = [0, 0, 0];
    let pixel = imageMatrix[rowIdx][pixelIdx];

    if (axis === 'y') {
      rowIdx += 1;
      while (!this.directions[pixel.join(' ')]) {
        imageMatrix[rowIdx][pixelIdx] = [0, 0, 0];
      }
    } else {
      pixelIdx += 1;
      while (!this.directions[pixel.join(' ')]) {
        imageMatrix[rowIdx][pixelIdx] = [0, 0, 0];
      }
    }

    let instruction = this.directions[pixel.join(' ')];
    switch (instruction) {
      case 'turn-right': (() => {
        switch (axis) {
          case 'y': this.drawLineReduceAxis(rowIdx, pixelIdx, 'x', imageMatrix);
          case 'x': this.drawLineIncreaseAxis(rowIdx, pixelIdx, 'y', imageMatrix);
        }
      }).call(this);

      case 'turn-left': (() => {
        if (axis === 'y') {
          this.drawLineIncreaseAxis(rowIdx, pixelIdx, 'x', imageMatrix);
        } else {
          this.drawLineReduceAxis(rowIdx, pixelIdx, 'y', imageMatrix);
        }
      }).call(this);
    }      
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <br />
        <input type="file" name="png-input" onChange={this.handleFile.bind(this)} />
        <div>
          <img id="dec" src={this.state.imgString} />
        </div>
      </div>
    );
  }
}

export default App;
