// const Bar = require('../mark/bar');
// const { processImage } = require('../utils/iconHelpers');
// const {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} = require('../utils/getBBox');

import Bar from './bar';
// import { measureTextWidth, measureTextHeight } from '../utils/iconHelpers';


class StackedBar extends Bar {
    constructor(data, styles, x, y, width, height, id, angle, annotateData) {
        super(data, styles, x, y, width, height, id, angle, annotateData);
        this.type = 'stackedbar';
        this.barList = [];
    }

    async render(g) {
        const d3 = await import('d3');
        this.g = g;
        // sum of the y values
        let sum = this.data.y.reduce((a, b) => a + b, 0);
        console.log("sum", sum);
        let stackScale = d3.scaleLinear();
        if (this.angle === 90){
            stackScale.domain([0, sum]).range([0, this.height]);
        }
        else if (this.angle === -90){
            stackScale.domain([0, sum]).range([0, this.height]);
        }
        else if (this.angle === 0){
            stackScale.domain([0, sum]).range([0, this.width]);
        }
        else if (this.angle === 180){
            stackScale.domain([0, sum]).range([0, this.width]);
        }
        console.log("this.angle", this.angle);
        console.log('this.data', this.data);
        let total_y = 0;
        for (let i = 0; i < this.data.y.length; i++){
            total_y += this.data.y[i];
        }
        if (this.angle === 0 || this.angle === 180){
            let currentX = this.x;
            for (let i = 0; i < this.data.y.length; i++){
                let dataX = this.data.x;
                let dataY = this.data.y[i];
                this.styles.fillStyles.fillColor = this.data.color[i];
                let datum = {x: dataX, y: dataY};
                if (this.styles.annotateStyles.eachAnnotate=='percentage'){
                    datum.y = dataY/total_y*100;
                    //保留两位小数 加上百分号
                    datum.y = datum.y.toFixed(2) + '%';
                }
                let x = this.x;
                let width = stackScale(dataY);
                let bar = new Bar(datum, this.styles, currentX, this.y, width, this.height, this.id+i, this.angle, this.annotateData);
                await bar.render(this.g);
                this.barList.push(bar);
                currentX += width;
            }
            if (this.attachStyles.totalAnnotate){
                let text = total_y;
                let annotateDataTextSize = this.textStyles.textSize;
                let numberTextSize = this.textStyles.numberTextSize;
                let textWidth = await measureTextWidth(text, numberTextSize);
                let textHeight = await measureTextHeight(text, numberTextSize);
                if (this.height < textHeight){
                    numberTextSize = parseInt(numberTextSize);
                    numberTextSize = numberTextSize * this.width / textWidth;
                    annotateDataTextSize = numberTextSize + 'px';
                }
                let textY = this.y + this.height/2;
                let textX = this.x + this.width/2;
                let textAnchor = 'middle';
                if (this.angle === 180){
                    textX = this.x;
                    textAnchor = 'end';
                }
                if (this.angle === 0){
                    textX = this.x + this.width;
                    textAnchor = 'start';
                }
                this.g.append('text')
                    .attr('x', textX)
                    .attr('y', textY)
                    .attr('font-size', numberTextSize)
                    .attr('fill', this.textColor)
                    .attr('text-anchor', textAnchor)
                    .attr('alignment-baseline', 'middle')
                    .text(text);
            }
        }
        else if (this.angle === 90 || this.angle === -90){
            let currentY = this.y;
            for (let i = 0; i < this.data.y.length; i++){
                let dataX = this.data.x;
                let dataY = this.data.y[i];
                this.styles.fillStyles.fillColor = this.data.color[i];
                let datum = {x: dataX, y: dataY};
                let y = this.y;
                let height = stackScale(dataY);
                if (this.styles.annotateStyles.eachAnnotate=='percentage'){
                    datum.y = dataY/total_y*100;
                    //保留两位小数 加上百分号
                    datum.y = datum.y.toFixed(2) + '%';
                }
                let bar = new Bar(datum, this.styles, this.x, currentY, this.width, height, this.id+i, this.angle, this.annotateData);
                await bar.render(this.g);
                // await bar.attachIcon(this.data.y_icons[i]);
                this.barList.push(bar);
                currentY += height;
            }
            if (this.attachStyles.totalAnnotate){
                let text = total_y;
                let annotateDataTextSize = this.textStyles.textSize;
                let numberTextSize = this.textStyles.numberTextSize;
                let textWidth = await measureTextWidth(text, numberTextSize);
                let textHeight = await measureTextHeight(text, numberTextSize);
                if (this.width < textWidth){
                    numberTextSize = parseInt(numberTextSize);
                    numberTextSize = numberTextSize * this.width / textWidth;
                    annotateDataTextSize = numberTextSize + 'px';
                }
                let textY = this.y + this.height/2;
                let textX = this.x + this.width/2;
                let textAnchor = 'middle';
                if (this.angle === 90){
                    textY = this.y;
                    textAnchor = 'end';
                }
                if (this.angle === -90){
                    textY = this.y + this.height;
                    textAnchor = 'start';
                }
                this.g.append('text')
                    .attr('x', textX)
                    .attr('y', textY)
                    .attr('font-size', numberTextSize)
                    .attr('fill', this.textColor)
                    .attr('text-anchor', textAnchor)
                    .attr('alignment-baseline', 'middle')
                    .text(text);
            }
        }
    }
    async attachIcon(iconPath){
        if (this.attachStyles.stackAttach === 'max'){
            let max_y_idx = this.data.y.indexOf(Math.max(...this.data.y));
            if (this.angle==0 || this.angle==-90){
                await this.barList[this.barList.length-1].attachIcon(this.data.y_icons[max_y_idx]);
            }
            else{
                await this.barList[0].attachIcon(this.data.y_icons[max_y_idx]);
            }    
        }
        else{
            for (let i = 0; i < this.data.y.length; i++){
                await this.barList[i].attachIcon(this.data.y_icons[i]);
            }
        }
    }
}

// module.exports = StackedBar;
export default StackedBar;