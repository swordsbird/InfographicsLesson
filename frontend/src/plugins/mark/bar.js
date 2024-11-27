
import baseMark from './baseMark';
// import { processImage } from '../utils/iconHelpers';
import { measureTextWidth, measureTextHeight } from '../utils/getBBox';
// const path = require('path');


class Bar extends baseMark {
    constructor(data, styles, x, y, width, height, id, angle, annotateData) {
        super(data, styles, annotateData);
        this.x = x;
        this.y = y;
        this.id = id;
        this.width = width;
        this.height = height;
        this.type = 'bar';
        this.g = null;
        this.element = null;
        this.fillColor = this.fillStyles.fillColor?this.fillStyles.fillColor:'steelblue';
        this.strokeWidth = this.strokeStyles.strokeWidth?this.strokeStyles.strokeWidth:2;
        this.strokeColor = this.strokeStyles.strokeColor?this.strokeStyles.strokeColor:'black';

        this.angle = angle?angle:0;
        this.attachMethod = this.attachStyles.attachMethod?this.attachStyles.attachMethod:'attach'; // attach, unit, multiple
        this.attachSide = this.attachStyles.attachSide?this.attachStyles.attachSide:'outer';
        this.attachRelativePos = this.attachStyles.RelativePos?this.attachStyles.RelativePos:'end';
        

        this.annotateWidth = 0;
        this.annotateHeight = 0;
    }
    async render(g) {
        // console.log("x, y, width, height", this.x, this.y, this.width, this.height);
        // console.log("fillColor, strokeColor, strokeWidth", this.fillColor, this.strokeColor, this.strokeWidth);
        // console.log("data", this.data);
        this.g = g;
        this.element = await g.append('rect')
            .attr('id', this.id)
            .attr('class', 'bar')
            .attr('x', this.x)
            .attr('y', this.y)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('fill', this.fillColor);
        if (this.annotateData) {
            let textAnchor = 'middle';
            if (this.angle === 90||this.angle === -90) {
                textAnchor = 'middle';
            }
            else if (this.angle === 0) {
                textAnchor = 'start';
            }
            else if (this.angle === 180) {
                textAnchor = 'end';
            }
            let alignmentBaseline = 'middle';
            if (this.angle === 90 || this.angle === -90) {
                alignmentBaseline = 'hanging';
            }
            else{
                alignmentBaseline = 'middle';
            }
            let textX = 0;
            let textY = 0;
            let margin = 0;
            let annotateDataTextSize = this.textStyles.textSize;
            let numberTextSize = annotateDataTextSize.split('px')[0];
            let text = this.data.y.toString();
            let textWidth = await measureTextWidth(text, numberTextSize);
            let textHeight = await measureTextHeight(text, numberTextSize);
            // console.log('this.height, textHeight', this.height, textHeight);
            // console.log('text', text);
            // console.log('this.annotateStyles.attachSide', this.annotateStyles.attachSide);
            // if bar width or height is smaller than text width or height, then should lower the text size
            if (this.angle === 90 || this.angle === -90) {
                if (this.width < textWidth) {
                    // numberTextSize = this.textStyles.textSize.split('px')[0];
                    numberTextSize = parseInt(numberTextSize);
                    numberTextSize = numberTextSize * this.width / textWidth;
                    annotateDataTextSize = numberTextSize + 'px';
                }
                if (this.annotateStyles.attachSide==='inner'){
                    if (this.height < textHeight) {
                        // not to show text
                        // console.log('not to show text');
                        return; 
                    }
                }
            }
            else {
                if (this.height < textHeight) {
                    // numberTextSize = this.annotateData.textSize.split('px')[0];
                    numberTextSize = parseInt(numberTextSize);
                    numberTextSize = numberTextSize * this.height / textHeight;
                    annotateDataTextSize = numberTextSize + 'px';
                }
                if (this.annotateStyles.attachSide=='inner'){
                    if (this.width < textWidth) {
                        // not to show text
                        return;
                    }
                }
            }

            textWidth = await measureTextWidth(text, numberTextSize);
            textHeight = await measureTextHeight(text, numberTextSize);
            this.annotateWidth = textWidth;
            this.annotateHeight = textHeight;
            if (this.annotateStyles.attachSide === 'inner') {
                this.annotateWidth = 0;
                this.annotateHeight = 0;
            }
            if (this.angle === 90||this.angle === -90) {
                textX = this.x + this.width / 2;
                if (this.angle === 90) {
                    if (this.annotateStyles.attachRelativePos === 'end') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textY = this.y + margin;
                        }
                        else{
                            textY = this.y - textHeight - margin;
                        }
                    }
                    else if (this.annotateStyles.attachRelativePos === 'start') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textY = this.y + this.height - textHeight - margin;
                        }
                        else {
                            textY = this.y + margin;
                        }
                    }
                    else {
                        textY = this.y + (this.height - textHeight) / 2;
                    }
                }
                else {
                    if (this.annotateStyles.attachRelativePos === 'start') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textY = this.y + margin;
                        }
                        else {
                            textY = this.y + this.height + margin;
                        }
                    }
                    else if (this.annotateStyles.attachRelativePos === 'end') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textY = this.y + this.height - textHeight - margin;
                        }
                        else {
                            textY = this.y + this.height + margin;
                        }
                    }
                    else {
                        textY = this.y + (this.height - textHeight) / 2;
                    }
                }
            }
            else {
                textY = this.y + this.height / 2;
                if (textWidth > this.width) {
                    // console.log('textWidth > this.width');
                    this.annotateStyles.attachRelativePos = 'end';
                    this.annotateStyles.attachSide = 'outer';
                }
                if (this.angle === 0) {
                    if (this.annotateStyles.attachRelativePos === 'end') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textX = this.x + this.width - textWidth - margin;
                        }
                        else{
                            textX = this.x + this.width + margin;
                        }
                    }
                    else if (this.annotateStyles.attachRelativePos === 'start') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textX = this.x + margin;
                        }
                        else {
                            textX = this.x + this.width - textWidth - margin;
                        }
                    }
                    else {
                        textX = this.x + (this.width - textWidth) / 2;
                    }
                }
                else {
                    if (this.annotateStyles.attachRelativePos === 'start') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textX = this.x + margin;
                        }
                        else {
                            textX = this.x - textWidth - margin;
                        }
                    }
                    else if (this.annotateStyles.attachRelativePos === 'end') {
                        if (this.annotateStyles.attachSide === 'inner') {
                            textX = this.x + this.width - textWidth - margin;
                        }
                        else {
                            textX = this.x + margin;
                        }
                    }
                    else {
                        textX = this.x + (this.width - textWidth) / 2;
                    }
                }
            }

            // console.log("textX, textY", textX, textY);
            // console.log("textHeight", textHeight);
            // append text
            // console.log('this.annotateStyles', this.annotateStyles);
            this.g.append('text')
                .attr('x', textX)
                .attr('y', textY)
                .attr('font-size', annotateDataTextSize)
                .attr('text-anchor', textAnchor)
                .attr('font-family', this.textStyles.textFont)
                .attr('fill', this.textStyles.textColor)
                .attr('alignment-baseline', alignmentBaseline)
                .text(text);
        }
    }
    // async attachIcon(iconPath) {
    //     if (iconPath[0]!='/'){
    //         iconPath = path.join("/data1/liduan/generation/chart/iconset/colored_icons_final", iconPath);
    //     }
    //     let iconImage = await processImage(iconPath, this.fillColor);
    //     let iconOriginalWidth = iconImage.info.width;
    //     let iconOriginalHeight = iconImage.info.height;
    //     let iconAspectRatio = iconOriginalWidth / iconOriginalHeight;
    //     let iconWidth = 0;
    //     let iconHeight = 0;
    //     let iconX = 0;
    //     let iconY = 0;
    //     let margin = 5;
    //     // console.log('this.width', this.width);
    //     if (this.attachStyles.attachMethod === 'attach') {
    //         if (this.angle === 90||this.angle === -90) {
    //             iconWidth = this.width*this.attachStyles.attachSizeRatio;
    //             iconHeight = iconWidth / iconAspectRatio;
    //             iconX = this.x + (this.width - iconWidth) / 2;
    //             if (this.angle === 90) {
    //                 if (this.attachStyles.attachRelativePos === 'end') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconY = this.y + margin;
    //                     }
    //                     else{
    //                         iconY = this.y - iconHeight - margin - this.annotateHeight;
    //                     }
    //                 }
    //                 else if (this.attachStyles.attachRelativePos === 'start') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconY = this.y + this.height - iconHeight - margin;
    //                     }
    //                     else{
    //                         iconY = this.y + this.height + margin;
    //                     }
    //                 }
    //                 else {
    //                     iconY = this.y + (this.height - iconWidth) / 2;
    //                 }
    //             }
    //             else {
    //                 if (this.attachStyles.attachRelativePos === 'start') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconY = this.y + margin;
    //                     }
    //                     else{
    //                         iconY = this.y + this.height + margin + this.annotateHeight;
    //                     }
    //                 }
    //                 else if (this.attachStyles.attachRelativePos === 'end') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconY = this.y + this.height - iconHeight - margin;
    //                     }
    //                     else{
    //                         iconY = this.y - iconHeight - margin;
    //                     }
    //                 }
    //                 else {
    //                     iconY = this.y + (this.height - iconWidth) / 2;
    //                 }
    //             }
    //         }
    //         else {
    //             iconHeight = this.height*this.attachStyles.attachSizeRatio;
    //             iconWidth = iconHeight * iconAspectRatio;
    //             iconY = this.y + (this.height - iconHeight) / 2;
    //             if (this.angle === 0) {
    //                 if (this.attachStyles.attachRelativePos === 'end') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconX = this.x + this.width - iconWidth - margin;
    //                     }
    //                     else{
    //                         iconX = this.x + this.width + margin + this.annotateWidth;
    //                     }
    //                 }
    //                 else if (this.attachStyles.attachRelativePos === 'start') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconX = this.x + margin;
    //                     }
    //                     else {
    //                         iconX = this.x + this.width - iconWidth - margin - this.annotateWidth;
    //                     }
    //                 }
    //                 else {
    //                     iconX = this.x + (this.width - iconWidth) / 2;
    //                 }
    //             }
    //             else {
    //                 if (this.attachStyles.attachRelativePos === 'start') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconX = this.x + margin;
    //                     }
    //                     else {
    //                         iconX = this.x - iconWidth - margin - this.annotateWidth;
    //                     }
    //                 }
    //                 else if (this.attachStyles.attachRelativePos === 'end') {
    //                     if (this.attachStyles.attachSide === 'inner') {
    //                         iconX = this.x + this.width - iconWidth - margin;
    //                     }
    //                     else {
    //                         iconX = this.x + margin + this.annotateWidth;
    //                     }
    //                 }
    //                 else {
    //                     iconX = this.x + (this.width - iconWidth) / 2;
    //                 }
    //             }
    //         }
    //         // append icon
    //         this.g.append('image')
    //             .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`)
    //             .attr('x', iconX)
    //             .attr('y', iconY)
    //             .attr('width', iconWidth)
    //             .attr('height', iconHeight);
    //     }
    //     else if (this.attachMethod==='unit') {
    //         let iconX = this.x;
    //         let iconY = this.y;
    //         let iconWidth = this.width;
    //         let iconHeight = this.height;
    //         this.g.append('image')
    //             .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`)
    //             .attr('x', iconX)
    //             .attr('y', iconY)
    //             .attr('width', iconWidth)
    //             .attr('height', iconHeight)
    //             // preserveAspectRatio="none"
    //             .attr('preserveAspectRatio', 'none');
    //         // set this element to be invisible
    //         this.element.attr('fill', 'none');
    //     }
    //     else if (this.attachStyles.attachMethod){ //mutliple
    //         const numberRepeat = this.attachStyles.attachMethod;
    //         let iconXList = [];
    //         let iconYList = [];
    //         let iconWidthList = [];
    //         let iconHeightList = [];
    //         let iconWidth = 0;
    //         let iconHeight = 0;
    //         if (this.angle === 90||this.angle === -90) {
    //             iconWidth = this.width/numberRepeat;
    //             iconHeight = iconWidth / iconAspectRatio;
    //             let numberStack = Math.ceil(this.height / iconHeight);
    //             for (let i = 0; i<numberRepeat;i++){
    //                 iconXList.push(this.x + i * iconWidth);
    //                 iconWidthList.push(iconWidth);
    //             }
    //             for (let i = 0; i<numberStack;i++){
    //                 if (this.angle === 90) {
    //                     if (i === numberStack-1){
    //                         iconYList.push(this.y);
    //                         iconHeightList.push(this.height-i*iconHeight);
    //                     }
    //                     else {
    //                         iconYList.push(this.y + this.height - i * iconHeight);
    //                         iconHeightList.push(iconHeight);
    //                     }
    //                 }
    //                 else {
    //                     iconYList.push(this.y + i * iconHeight);
    //                     if (i === numberStack-1){
    //                         iconHeightList.push(this.height-i*iconHeight);
    //                     }
    //                     else {
    //                         iconHeightList.push(iconHeight);
    //                     }
    //                 }
    //             }
    //         }
    //         else {
    //             iconHeight = this.height/numberRepeat;
    //             iconWidth = iconHeight * iconAspectRatio;
    //             let numberStack = Math.ceil(this.width / iconWidth);
    //             for (let i = 0; i<numberRepeat;i++){
    //                 iconYList.push(this.y + i * iconHeight);
    //                 iconHeightList.push(iconHeight);
    //             }
    //             for (let i = 0; i<numberStack;i++){
    //                 if (this.angle === 0) {
    //                     iconXList.push(this.x+ i*iconWidth);
    //                     if (i === numberStack-1){
    //                         iconWidthList.push(this.width-i*iconWidth);
    //                     }
    //                     else {
    //                         iconWidthList.push(iconWidth);
    //                     }
    //                 }
    //                 else {
    //                     if (i === numberStack-1){
    //                         iconXList.push(this.x);
    //                         iconWidthList.push(this.width-i*iconWidth);
    //                     }
    //                     else {
    //                         iconXList.push(this.x + this.width - i * iconWidth);
    //                         iconWidthList.push(iconWidth);
    //                     }
    //                 }
    //             }
    //         }
    //         for (let i = 0; i<iconXList.length;i++){
    //             for (let j = 0; j<iconYList.length;j++){
    //                 this.g.append('image')
    //                     .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`)
    //                     .attr('x', iconXList[i])
    //                     .attr('y', iconYList[j])
    //                     .attr('width', iconWidthList[i]*this.attachStyles.attachSizeRatio)
    //                     .attr('height', iconHeightList[j]*this.attachStyles.attachSizeRatio)
    //                     .attr('preserveAspectRatio', 'none');
    //             }
    //         }
    //         this.element.attr('fill', 'none');

    //     }
    // }
}

// module.exports = Bar;
export default Bar;