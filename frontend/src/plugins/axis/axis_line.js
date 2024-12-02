// const AxisBase = require('./axis_base');
import AxisBase from './axis_base';
// const TextToSVG = require('text-to-svg');
// import TextToSVG from 'text-to-svg';
// const textToSVG = TextToSVG.loadSync();
// const {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} = require('../utils/getBBox');
import {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} from '../utils/getBBox';
// const {processImage} = require('../utils/iconHelpers');
// import { processImage } from '../utils/iconHelpers';
// Base AxisLine module
class AxisLine extends AxisBase {
    constructor(title, scale, positions, styles, id, icons) {
        super(title, scale, positions, styles, id);

        // Axis
        this.angle = this.styles.angle?this.styles.angle:0; // Angle of the axis line

        // Tick
        this.tickFace = this.styles.tickFace?this.styles.tickFace:"cclw"; // Face of the tick
        this.textFace = this.styles.textFace?this.styles.textFace:"cclw"; // Face of the text
        this.tickLength = this.styles.tickLength?this.styles.tickLength:5; // Length of the tick
        this.tickInnerLength = this.styles.tickInnerLength?this.styles.tickInnerLength:this.tickLength;
        this.tickOuterLength = this.styles.tickOuterLength!==undefined?this.styles.tickOuterLength:this.tickLength*1.5;
        this.tickTextSize = this.textStyles.textSize?this.textStyles.textSize:"12px";
        this.tickNumber = this.styles.tickNumber?this.styles.tickNumber:5; // Number of ticks
        this.tickFont = this.textStyles.font?this.textStyles.font:"Arial"; // Font of tick text

        this.strokeColor = this.styles.strokeColor?this.styles.strokeColor:"black"; // Color of the axis line
        this.strokeWidth = this.styles.strokeWidth!==undefined?this.styles.strokeWidth:1; // Width of the axis line

        // Title
        this.titleFace = this.styles.titleFace?this.styles.titleFace:"cclw"; // Face of title
        // this.titleTextOrient = this.styles.titleTextOrient?this.styles.titleTextOrient:"horizontal"; // orientation of title
        this.titleRelativePos = this.styles.titleRelativePos?this.styles.titleRelativePos:"middle"; // Relative position of title
        this.titleAlign = this.styles.titleAlign?this.styles.titleAlign:"middle"; // Align of title
        this.titleTextSize = this.textStyles.textSize?this.textStyles.textSize:this.tickTextSize; // Size of title
        this.titleFont = this.textStyles.font?this.textStyles.font:"Arial"; // Font of title

        // Tick BBox
        this.tickBBox = [];

        this.icons = icons;
        // axis start
        this.start_x = this.positions.x;
        this.start_y = this.positions.y;
    }
    async checkOverlap(bbox1, bbox2) {
        var overlap = false;
        if (bbox1.maxX < bbox2.minX || bbox1.minX > bbox2.maxX || bbox1.maxY < bbox2.minY || bbox1.minY > bbox2.maxY) {
            overlap = false;
        } else {
            overlap = true;
        }
        return overlap;
    }
    async isOverlap(text1, text2) {
        var rect1 = text1.getBoundingClientRect();
        var rect2 = text2.getBoundingClientRect();
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }
    async render(svg) {
        const d3 = await import('d3');
        console.log(`Rendering axis line with title: ${this.title}`);
        var axisGenerator = null;
        if (this.angle == 0){
            if (this.tickFace == "cclw") {
                axisGenerator = d3.axisTop(this.scale);
            }
            else{
                axisGenerator = d3.axisBottom(this.scale);
            }
        }
        else if (this.angle == 90){
            this.scale.range(this.scale.range().reverse());
            if (this.tickFace == "cclw") {
                axisGenerator = d3.axisLeft(this.scale);
            }
            else{
                axisGenerator = d3.axisRight(this.scale);
            }
            this.start_y = this.positions.y - this.scale.range()[0];
        }
        else if (this.angle == 180 || this.angle == -180){
            // reverse the scale
            this.scale.range(this.scale.range().reverse());
            if (this.tickFace == "cclw") {
                axisGenerator = d3.axisBottom(this.scale);
            }
            else{
                axisGenerator = d3.axisTop(this.scale);
            }
            this.start_x = this.positions.x - this.scale.range()[0];
        }
        else if (this.angle == -90){
            if (this.tickFace == "clw") {
                axisGenerator = d3.axisLeft(this.scale);
            }
            else{
                axisGenerator = d3.axisRight(this.scale);
            }
        }
        // 90, 180, -180: scaleRange is reverted.

        // console.log('this.tickInnerLength:', this.tickInnerLength);
        // console.log('this.tickOuterLength:', this.tickOuterLength);
        // TODO add styles
        axisGenerator.tickSizeInner(this.tickInnerLength) // inner tick size
            .tickSizeOuter(this.tickOuterLength) // outer tick size
            .ticks(this.tickNumber); // number of ticks
            // edit stroke color and width

        // textSize

        const axisGroup = svg.append("g")
            .attr("class", "axis")
            .attr("id", this.id)
            .attr("transform", `translate(${this.start_x}, ${this.start_y})`)
            .call(axisGenerator);

        // 修改轴线的颜色和宽度
        axisGroup.selectAll("path").attr("stroke", this.strokeColor).attr("stroke-width", this.strokeWidth);
        // 修改刻度的颜色和宽度
        axisGroup.selectAll("line").attr("stroke", this.strokeColor).attr("stroke-width", this.strokeWidth);
        // 修改字体
        axisGroup.attr("font-size", this.tickTextSize);
        axisGroup.attr("font-family", this.tickFont);

        if (this.tickFace != this.textFace) {
            var offset = 7;
            const origin_y = axisGroup.selectAll(".tick text").attr("y");
            const origin_x = axisGroup.selectAll(".tick text").attr("x");

            // Position labels based on tick length and textFace
            axisGroup.selectAll(".tick text")
                .attr("y", () => {
                    if (this.angle === 0) {
                        return this.textFace === "cclw" ? `-${this.tickLength + offset*2}px` : `${this.tickLength + offset*2}px`;
                    }
                    else if (this.angle === 180 || this.angle === -180) {
                        return this.textFace === "cclw" ? `${this.tickLength + offset*2}px` : `-${this.tickLength + offset}px`;
                    }
                    else return origin_y;
                })
                .attr("x", () => {
                    if (this.angle === 90) {
                        return this.textFace === "cclw" ? `-${this.tickLength}px` : `${this.tickLength + offset}px`;
                    }
                    else if (this.angle === -90) {
                        return this.textFace === "cclw" ? `-${this.tickLength}px` : `${this.tickLength + offset}px`;
                    }
                    else return origin_x;
                })
                .attr("text-anchor", () => {
                    if (this.angle === 90) {
                        return this.textFace === "cclw" ? "end" : "start";
                    }
                    else if (this.angle === -90) {
                        return this.textFace === "cclw" ? "end" : "start";
                    }
                });
        }
        var ticks = axisGroup.selectAll('.tick');
        const axisGroupNode = axisGroup.node();
        var fontSize = parseFloat(axisGroupNode.getAttribute('font-size'));
        var textAnchor = axisGroupNode.getAttribute('text-anchor');
        // change font size
        // let bboxes = [];
        let that = this;
        const bboxes = await Promise.all(
            ticks.nodes().map(async function(node) {
                const parentTransform = d3.select(node).attr('transform');
                const textElement = d3.select(node).select('text').node();
                const matrix = await parseTransform(parentTransform);
                const bbox = await getBBoxText(textElement, textAnchor, fontSize);
                const newBBox = await applyTransform(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY, matrix);
                return newBBox;
            })
        );
        // check overlap
        var overlap = false;
        for (var i = 0; i < bboxes.length; i++) {
            for (var j = i + 1; j < bboxes.length; j++) {
                if (await this.checkOverlap(bboxes[i], bboxes[j])) {
                    var overlap = true;
                    break;
                }
            }
        }
        // if (false) {
        if (overlap && (this.angle ==0||this.angle==180)) {
            // get text height
            var textHeight = await measureTextHeight("M", fontSize);
            var scaleFactor = 0;
            // 如果this.scale 是一个band scale，那么bandWidth是每个band的宽度
            var bandWidth = 0;
            try {
                bandWidth = this.scale.bandwidth();
            }
            catch (e) {
                console.log('this.scale is not a band scale');
            }
            if (bandWidth > 0) {
                scaleFactor = bandWidth / textHeight;
            }
            else {
                scaleFactor = 1;
            }
            console.log('scaleFactor:', scaleFactor);
            
            // var angleList = [-45,-90];
            var angleList = [-45];
            var angle = angleList[Math.floor(Math.random() * angleList.length)];
            var translateX = 0;
            var translateY = 0;
            // Note 1029: 现在还没处理竖直轴的文本重合情况。
            var shiftFactor = 0;
            if (angle === -45) {
                shiftFactor = 1.0;
            }
            else if (angle === -90) {
                shiftFactor = 0.5;
            }
            if (this.angle === 0) {
                if (this.textFace === "cclw") {
                    axisGroup.attr('text-anchor', 'start');
                    if (angle === -90){
                        translateX = -fontSize*shiftFactor;
                        translateY = fontSize*shiftFactor*2;
                    }
                }
                else {
                    axisGroup.attr('text-anchor', 'end');
                    if (angle === -45){
                        translateX = 0;
                        translateY = -fontSize*shiftFactor;
                    }
                    else if (angle === -90){
                        translateX = fontSize*shiftFactor;
                        translateY = -fontSize*shiftFactor*2;
                    }
                }
            }
            else if (this.angle === 180 || this.angle === -180) {
                if (this.textFace === "cclw") {
                    axisGroup.attr('text-anchor', 'end');
                    translateX = -fontSize*shiftFactor;
                    translateY = fontSize*shiftFactor;
                }
                else {
                    axisGroup.attr('text-anchor', 'start');
                    translateX = -fontSize*shiftFactor;
                    translateY = -fontSize*shiftFactor;
                }
            }
            ticks.each(function(d) {
                d3.select(this).select('text').attr('transform', ` translate(${translateY}, ${translateX}), rotate(${angle})`);
                if (scaleFactor < 1) {
                    d3.select(this).select('text').attr('font-size', fontSize * scaleFactor);
                }
            });
        }
        let maxTickTextMoveX = 0;
        let maxTickTextMoveY = 0;
        // if (this.attachStyles.attachMethod === 'attach'){
        //     // if this.scale is a band scale, then the band width is the width of each band
        //     if (this.scale.bandwidth){
        //         let tickTextMoveX = 0;
        //         let tickTextMoveY = 0;
        //         let bandWidth = this.scale.bandwidth();
        //         // get number of values in the domain
        //         let domainLength = this.scale.domain().length;
        //         let tickValues = this.scale.domain();
        //         for (let i = 0; i < domainLength; i++){
        //             let iconPath = this.icons[i];
        //             let tickValue = tickValues[i];
        //             let iconImage = await processImage(iconPath, null);
        //             let iconOriginalWidth = iconImage.info.width;
        //             let iconOriginalHeight = iconImage.info.height;
        //             let iconAspectRatio = iconOriginalWidth / iconOriginalHeight;
        //             let iconWidth = 0;
        //             let iconHeight = 0;
        //             let iconX = 0;
        //             let iconY = 0;
        //             if (this.angle == 90 || this.angle == -90) {
        //                 iconHeight = bandWidth*this.attachStyles.attachSizeRatio;
        //                 iconWidth = iconHeight * iconAspectRatio;
        //                 if (this.angle == 90) {
        //                     iconY = await this.pos(tickValue) + (bandWidth- iconHeight)/2;
        //                     if (this.tickFace == "cclw") {
        //                         iconX = this.start_x - this.tickInnerLength - iconWidth;
        //                         tickTextMoveX = -iconWidth;
        //                     }
        //                     else {
        //                         iconX = this.start_x + this.tickInnerLength;
        //                         tickTextMoveX = iconWidth;
        //                     }
        //                 }
        //                 else if (this.angle == -90) {
        //                     iconY = await this.pos(tickValue) + (bandWidth- iconHeight)/2;
        //                     if (this.tickFace == "cclw") {
        //                         iconX = this.start_x + this.tickInnerLength;
        //                         tickTextMoveX = iconWidth;
        //                     }
        //                     else {
        //                         iconX = this.start_x - this.tickInnerLength - iconWidth;
        //                         tickTextMoveX = -iconWidth;
        //                     }
        //                 }
        //             }
        //             else if (this.angle == 0 || this.angle == 180 || this.angle == -180) {
        //                 iconWidth = bandWidth*this.attachStyles.attachSizeRatio;
        //                 iconHeight = iconWidth / iconAspectRatio;
        //                 if (this.angle == 0) {
        //                     iconX = await this.pos(tickValue) + (bandWidth - iconWidth)/2;
        //                     if (this.tickFace == "cclw") {
        //                         iconY = this.start_y - this.tickInnerLength - iconHeight;
        //                         tickTextMoveY = -iconHeight;
        //                     }
        //                     else {
        //                         iconY = this.start_y + this.tickInnerLength;
        //                         tickTextMoveY = iconHeight;
        //                     }
        //                 }
        //                 else if (this.angle == 180 || this.angle == -180) {
        //                     iconX = await this.pos(tickValue) + (bandWidth - iconWidth)/2;
        //                     if (this.tickFace == "cclw") {
        //                         iconY = this.start_y + this.tickInnerLength;
        //                         tickTextMoveY = iconHeight;
        //                     }
        //                     else {
        //                         iconY = this.start_y - this.tickInnerLength - iconHeight;
        //                         tickTextMoveY = -iconHeight;
        //                     }
        //                 }
        //             }
        //             // // append icon
        //             // svg.append('image')
        //             //     .attr('x', iconX)
        //             //     .attr('y', iconY)
        //             //     .attr('width', iconWidth)
        //             //     .attr('height', iconHeight)
        //             //     .attr('preserveAspectRatio', 'none')
        //             //     .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`);
        //             // if (Math.abs(tickTextMoveX) > maxTickTextMoveX) {
        //             //     maxTickTextMoveX = tickTextMoveX;
        //             // }
        //             // if (Math.abs(tickTextMoveY) > maxTickTextMoveY) {
        //             //     maxTickTextMoveY = tickTextMoveY;
        //             // }
        //         }
        //         await ticks.each(async function(d) {
        //             const tickText = d3.select(this).select('text');
        //             const currentTransform = tickText.attr('transform');
        //             if (currentTransform!==null){
        //                 tickText.attr('transform', ` translate(${maxTickTextMoveX}, ${maxTickTextMoveY}), `+currentTransform);
        //             }
        //             else {
        //                 tickText.attr('transform', `translate(${maxTickTextMoveX}, ${maxTickTextMoveY})`);
        //             }
        //             // d3.select(this).select('text').attr('transform', ` translate(${translateY}, ${translateX}), rotate(${angle})`);
        //         });
        //     }

        // }

        // compute the bbox of the axisGroup
        const axisBBox = await getBBoxGroup(axisGroupNode, null, null, svg);
        // if (maxTickTextMoveX > 0) {
        //     axisBBox.maxX += maxTickTextMoveX;
        // }
        // else {
        //     axisBBox.minX += maxTickTextMoveX;
        // }
        // if (maxTickTextMoveY > 0) {
        //     axisBBox.maxY += maxTickTextMoveY;
        // }
        // else {
        //     axisBBox.minY += maxTickTextMoveY;
        // }
        // console.log('axisBBox:', axisBBox);

        // add title
        let titleX = 0;
        let titleY = 0;
        // let titleBBoxX = 0;
        // let titleBBoxY = 0;
        let titleHeight = 0;
        let titleWidth = 0;
        let titleMargin = 5;
        let titleTextSizeNum = parseFloat(this.titleTextSize);

        if (this.angle === 0 || this.angle === 180 || this.angle === -180) {
            this.titleTextOrient = "horizontal";
        }
        else if (this.angle === 90 || this.angle === -90) {
            this.titleTextOrient = "vertical";
        }
        if (this.titleTextOrient === "vertical") {
            titleWidth = await measureTextHeight(this.title, titleTextSizeNum);
            titleHeight = await measureTextWidth(this.title, titleTextSizeNum);
            // 如果title高度超过了轴的长度，调整title字体大小
            if (titleHeight > axisBBox.maxY - axisBBox.minY) {
                titleTextSizeNum = titleTextSizeNum * (axisBBox.maxY - axisBBox.minY) / titleHeight;
                titleWidth = await measureTextHeight(this.title, titleTextSizeNum);
                titleHeight = await measureTextWidth(this.title, titleTextSizeNum);
            }
            this.titleTextSize = titleTextSizeNum + 'px';
            // titleWidth = await measureTextWidth(this.title, titleTextSizeNum);
            // titleHeight = await measureTextHeight(this.title, titleTextSizeNum);
        }
        else {
            titleWidth = await measureTextWidth(this.title, titleTextSizeNum);
            titleHeight = await measureTextHeight(this.title, titleTextSizeNum);
            // 如果title宽度超过了轴的长度，调整title字体大小
            if (titleWidth > axisBBox.maxX - axisBBox.minX) {
                titleTextSizeNum = titleTextSizeNum * (axisBBox.maxX - axisBBox.minX) / titleWidth;
                titleWidth = await measureTextWidth(this.title, titleTextSizeNum);
                titleHeight = await measureTextHeight(this.title, titleTextSizeNum);
            }
            this.titleTextSize = titleTextSizeNum + 'px';
        } 
        // 确定title的初始位置
        if (this.angle === 0) {
            if (this.titleRelativePos === "start") titleX = axisBBox.minX;
            else if (this.titleRelativePos === "end") titleX = axisBBox.maxX;
            else titleX = (axisBBox.minX + axisBBox.maxX) / 2;
            if (this.titleFace === "cclw") titleY = axisBBox.minY - titleHeight - titleMargin;
            else titleY = axisBBox.maxY + titleMargin;
        }
        else if (this.angle === 90) {
            if (this.titleRelativePos === "start") titleY = axisBBox.minY;
            else if (this.titleRelativePos === "end") titleY = axisBBox.maxY;
            else titleY = (axisBBox.minY + axisBBox.maxY) / 2;
            if (this.titleFace === "cclw") titleX = axisBBox.maxX + titleMargin;
            else titleX = axisBBox.minX - titleMargin;
        }
        else if (this.angle === 180 || this.angle === -180) {
            if (this.titleRelativePos === "start") titleX = axisBBox.maxX;
            else if (this.titleRelativePos === "end") titleX = axisBBox.minX;
            else titleX = (axisBBox.minX + axisBBox.maxX) / 2;
            if (this.titleFace === "cclw") titleY = axisBBox.maxY + titleHeight + titleMargin;
            else titleY = axisBBox.minY - titleMargin;
        }
        else if (this.angle === -90) {
            if (this.titleRelativePos === "start") titleY = axisBBox.maxY;
            else if (this.titleRelativePos === "end") titleY = axisBBox.minY;
            else titleY = (axisBBox.minY + axisBBox.maxY) / 2;
            if (this.titleFace === "cclw") titleX = axisBBox.minX - titleMargin;
            else titleX = axisBBox.maxX + titleWidth + titleMargin;
        }
        const titleText = svg.append("text")
            .attr("id", "title"+this.id)
            .attr("x", titleX)
            .attr("y", titleY)
            .attr("text-anchor", this.titleAlign)
            .text(this.title)
            .attr("font-size", this.titleTextSize)
            .attr("font-family", this.titleFont);
        if (this.titleTextOrient === "vertical") {
            titleText.attr("transform", `rotate(-90, ${titleX}, ${titleY})`);
        }

        const titleBBox = await getBBoxText(titleText.node(), this.titleAlign, titleTextSizeNum);
        const titleBBoxX = titleBBox.minX;
        const titleBBoxY = titleBBox.minY;
        const titleBBoxWidth = titleBBox.maxX - titleBBox.minX;
        const titleBBoxHeight = titleBBox.maxY - titleBBox.minY;
        let directionX = null;
        let directionY = null;
        if (this.angle === 0) {
            if (this.titleFace === "cclw") {
                directionY = 'up';
            }
            else {
                directionY = 'down';
            }
        }
        else if (this.angle === 90) {
            if (this.titleFace === "cclw") {
                directionX = 'left';
            }
            else {
                directionX = 'right';
            }
        }
        else if (this.angle === 180 || this.angle === -180) {
            if (this.titleFace === "cclw") {
                directionY = 'down';
            }
            else {
                directionY = 'up';
            }
        }
        else if (this.angle === -90) {
            if (this.titleFace === "cclw") {
                directionX = 'right';
            }
            else {
                directionX = 'left';
            }
        }


        // console.log('directionX:', directionX, 'directionY:', directionY);        
        const res = await calculateMinimumMovement(axisBBox, titleBBox, directionX, directionY);
        // // // debug: draw the axis bbox
        // svg.append('rect')
        //     .attr('x', axisBBox.minX)
        //     .attr('y', axisBBox.minY)
        //     .attr('width', axisBBox.maxX - axisBBox.minX)
        //     .attr('height', axisBBox.maxY - axisBBox.minY)
        //     .attr('fill', 'none')
        //     .attr('stroke', 'red')
        //     .attr('stroke-width', 1);
        const moveX = res.x;
        const moveY = res.y;
        let moveX1 = 0;
        let moveY1 = 0;
        // 根据title相对于轴的位置，调整title的位置
        if (this.angle === 0 || this.angle === 180 || this.angle === -180) {
            if (this.titleRelativePos === "start") moveX1 = moveX;
            else if (this.titleRelativePos === "end") moveX1 = moveX;
            else moveY1 = moveY;
        }
        else if (this.angle === 90 || this.angle === -90) {
            // if (this.titleRelativePos === "start") titleY += moveY;
            // else if (this.titleRelativePos === "end") titleY += moveY;
            // else titleX += moveX;
            if (this.titleRelativePos === "start") moveY1 = moveY;
            else if (this.titleRelativePos === "end") moveY1 = moveY;
            else moveX1 = moveX;
        }
        let margin = 5;
        if (moveX1 > 0) {
            moveX1 += margin;
        }
        else if (moveX1 < 0) {
            moveX1 -= margin;
        }
        if (moveY1 > 0) {
            moveY1 += margin;
        }
        else if (moveY1 < 0) {
            moveY1 -= margin;
        }

        // Note 1030: rotate时位置不对
        const currentTransform = titleText.attr('transform');
        if (currentTransform) {
            titleText.attr('transform', `translate(${moveX1}, ${moveY1}) ${currentTransform} `);
        }
        else {
            titleText.attr('transform', `translate(${moveX1}, ${moveY1})`);
        }
        // console.log('moveX:', moveX1, 'moveY:', moveY1);

    }
    async pos(val) {
        // given a value val, return the position on the axis
        if (this.angle == 0 || this.angle == 180 || this.angle == -180){
            return this.start_x + this.scale(val);
        }
        else if (this.angle == 90 || this.angle == -90){
            return this.start_y + this.scale(val);
        }
    }
    async basePos() {
        if (this.angle == 0 ){
            return this.start_x;
        }
        else if (this.angle == 180 || this.angle == -180){
            return this.start_x+this.scale.range()[0];
        }
        else if (this.angle == 90){
            return this.start_y+this.scale.range()[0];
        }
        else if (this.angle == -90){
            return this.start_y;
        }
    }
    async bandWidth() {
        return this.scale.bandwidth();
    }

    async tickPoses() {
        
        var bandWidth = 0;
        try {
            bandWidth = this.scale.bandwidth();
        }
        catch (e) {
            console.log('this.scale is not a band scale');
        }
        if (bandWidth > 0) {
            var domainLength = this.scale.domain().length;
            var tickValues = this.scale.domain();
            var tickPoses = [];
            for (let i = 0; i < domainLength; i++){
                let tickValue = tickValues[i];
                let tickPos = await this.pos(tickValue) + bandWidth/2 + this.strokeStyles.strokeWidth/2;
                tickPoses.push(tickPos);
            }
            return tickPoses;
        }
        else {
            var ticks = this.scale.ticks(this.tickNumber);
            var tickPoses = [];
            for (let i = 0; i < ticks.length; i++){
                let tickPos = await this.pos(ticks[i]) + this.strokeStyles.strokeWidth/2;
                tickPoses.push(tickPos);
            }
            return tickPoses;
        }
    }
}

export default AxisLine;