// Base Chart module
// const AxisLine = require('./axis/axis_line');
import AxisLine from './axis/axis_line';
// const Annotation = require('./annotation/annotation');
import Annotation from './annotation/annotation';
// const fs = require('fs');
import fs from 'fs';
// const { JSDOM } = require('jsdom');
// const {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} = require('./utils/getBBox');
import {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} from './utils/getBBox';
class Chart {
    constructor(data, meta_data, styles, width, height) {
        this.data = data;
        this.meta_data = meta_data;
        this.styles = styles;
        this.titleStyles = styles.titleStyles?styles.titleStyles:{};
        this.captionStyles = styles.captionStyles?styles.captionStyles:{};
        this.attachStyles = styles.attachStyles?styles.attachStyles:{};
        this.width = width;
        this.height = height;
        this.canvas = null;
        this.d3n = null;
        this.x_axis = null;
        this.y_axis = null;
        this.x_scale = null;
        this.y_scale = null;
        this.orientation = styles.orientation?styles.orientation:'vertical';
        // this.iconDir = "/data1/liduan/generation/chart/iconset/colored_icons_new";
        
        this.iconDir = "/data1/liduan/generation/chart/iconset/colored_icons_final";
        this.rangeFactor = 1/3;
    }
    async preprocess(){
        // check x data and y data type
        const d3 = await import('d3');
        console.log("this.meta_data", this.meta_data);
        const x_type = this.meta_data.x_type;
        const y_type = typeof this.meta_data.y_type === 'string' ? this.meta_data.y_type : this.meta_data.y_type[0];
        const y_isArray = typeof this.meta_data.y_type !== 'string';
        // console.log("y_type", y_type);
        // console.log("y_isArray", y_isArray);
        if (x_type === 'numerical'){
            this.data.sort((a, b) => a.x - b.x);
        }
        if (y_type === 'numerical'){
            this.y_min = 1e5;
            this.y_max = -1e5;
            this.y_range = 0;
            if (y_isArray){
                this.data.forEach(d => {
                    if (d3.sum(d.y) < this.y_min) {
                        this.y_min = d3.sum(d.y);
                    }
                    if (d3.sum(d.y) > this.y_max) {
                        this.y_max = d3.sum(d.y);
                    }
                });
            }
            else{
                this.data.forEach(d => {
                    if (d.y < this.y_min) {
                        this.y_min = d.y;
                    }
                    if (d.y > this.y_max) {
                        this.y_max = d.y;
                    }
                });
            }
            this.y_range = this.y_max - this.y_min;
        }
        // console.log("y_max", this.y_max);
    }
    async configAxis() {
        const d3 = await import('d3');
        // x-axis config
        // console.log(this.meta_data);
        const x_axis_title = this.meta_data.x_axis;
        const x_axis_length = this.orientation === 'vertical' ? this.width/1 : this.height/1;
        if (this.meta_data.x_type === 'categorical' || this.meta_data.x_type === 'temporal') {
            this.x_scale = d3.scaleBand().domain(this.data.map(d => d.x)).range([0, x_axis_length]);
        }
        else {
            this.x_scale = d3.scaleLinear().domain([0, d3.max(this.data, d => d.x)]).range([0, x_axis_length]);
        }
        const x_positions = {x: this.width/2, y: this.height/2};
        const x_styles = {};
        const x_id = "x-axis";
        // x_angle is randomly selected from [0,90,180,-90]
        // const x_angle = [0, 90, 180, -90][Math.floor(Math.random()*4)];
        const x_angle = 0;
        // x_tickFace is randomly selected between "cclw" and "clw"
        // const x_tickFace = Math.random() < 0.5 ? "cclw" : "clw";
        const x_tickFace = "clw";
        var config = {
            angle: x_angle,
            tickFace: x_tickFace,
            textFace: "clw",
            titleTextOrient: "horizontal",
            titleAlign: "middle",
            titleRelativePos: "middle",
            titleFace: "clw",
        };
        this.x_axis = new AxisLine(x_axis_title, this.x_scale, x_positions, x_styles, x_id, config);

        // y-axis config
        const y_axis_title = this.meta_data.y_axis;
        const y_axis_length = this.orientation === 'vertical' ? this.height/1 : this.width/1;
        if (this.meta_data.y_type === 'categorical'|| this.meta_data.x_type === 'temporal') {
            this.y_scale = d3.scaleBand().domain(this.data.map(d => d.y)).range([0, y_axis_length]);
        }
        else if (this.meta_data.y_type === 'numerical') {
            this.y_scale = d3.scaleLinear().domain([0, this.y_max]).range([0, y_axis_length]);
        }
        // else if meta_data.y_type is not a string, it is a array
        else if (typeof this.meta_data.y_type !== 'string') {
            // 按y_type[0]的类型来处理
            if (this.meta_data.y_type[0] === 'categorical'|| this.meta_data.x_type === 'temporal') {
                this.y_scale = d3.scaleBand().domain(this.data.map(d => d.y[0])).range([0, y_axis_length]);
            }
            else {
                this.y_scale = d3.scaleLinear().domain([0, this.y_max]).range([0, y_axis_length]);
            }
        }

        const y_positions = {x: this.width/2, y: this.height/2};
        const y_styles = {};
        const y_id = "y-axis";
        const y_angle = 90;
        const y_tickFace = "cclw";
        config = {
            angle: y_angle,
            tickFace: y_tickFace,
            textFace: "cclw",
            titleTextOrient: "vertical",
            titleAlign: "middle",
            titleRelativePos: "middle",
            titleFace: "clw",
        };
        this.y_axis = new AxisLine(y_axis_title, this.y_scale, y_positions, y_styles, y_id, config);
    }
    async render() {
        // const d3 = await import('d3');
        const D3Node = require('d3-node');
        const d3n = new D3Node();
        this.canvas = d3n.createSVG(this.width, this.height);
        this.svg = this.canvas.append('g').attr('id', 'chart').attr('width', this.width).attr('height', this.height);
        this.d3n = d3n;
        await this.configAxis();
        await this.x_axis.render(this.svg);
        await this.y_axis.render(this.svg);
    }
    
    async configAnnotation(){
        var title = this.meta_data.title;
        var caption = this.meta_data.caption;
        this.captionStyles = this.styles.captionStyles?this.styles.captionStyles:{};

        this.titleStyles = this.styles.titleStyles?this.styles.titleStyles:{};
        // console.log("title", this.titleStyles);

        // first: approxmate the width and height of title and caption:
        var titleHeight = 0;
        var titleWidth = 0;
        titleHeight = await measureTextHeight(title, this.titleStyles.textStyles.textSize);
        titleWidth = await measureTextWidth(title, this.titleStyles.textStyles.textSize);

        // 如果width超过了图表的宽度，就需要调整
        // 调整的方法是：将title分成多行，每行的宽度不超过图表的宽度
        if (titleWidth > this.width*this.rangeFactor){
            var titleWords = title.split(" ");
            var titleLine = "";
            var titleLineHeight = 0;
            var titleLineWidth = 0;
            var titleLines = [];
            for (var i = 0; i < titleWords.length; i++){
                titleLine += " " +titleWords[i];
                titleLineWidth = await measureTextWidth(titleLine, this.titleStyles.textStyles.textSize);
                if (titleLineHeight === 0){
                    titleLineHeight = await measureTextHeight(titleLine, this.titleStyles.textStyles.textSize);
                }
                if (titleLineWidth > this.width*this.rangeFactor){
                    titleLines.push(titleLine);
                    titleLine = "";
                }
            }
            if (titleLine.length > 0){
                titleLines.push(titleLine);
            }
            titleHeight = titleLines.length * titleLineHeight;
            var maxTitleWidth = 0;
            for (var i = 0; i < titleLines.length; i++){
                var lineWidth = await measureTextWidth(titleLines[i], this.titleStyles.textStyles.textSize);
                maxTitleWidth = Math.max(maxTitleWidth, lineWidth);
            }
            titleWidth = maxTitleWidth;
            title = titleLines;
        }


        var captionHeight = 0;
        var captionWidth = 0;
        captionHeight = await measureTextHeight(caption, this.captionStyles.textStyles.textSize);
        captionWidth = await measureTextWidth(caption, this.captionStyles.textStyles.textSize);
        // 如果width超过了图表的宽度，就需要调整
        // 调整的方法是：将caption分成多行，每行的宽度不超过图表的宽度
        if (captionWidth > this.width*this.rangeFactor){
            var captionWords = caption.split(" ");
            var captionLine = "";
            var captionLineHeight = 0;
            var captionLineWidth = 0;
            var captionLines = [];
            for (var i = 0; i < captionWords.length; i++){
                captionLine += " " + captionWords[i];
                captionLineWidth = await measureTextWidth(captionLine, this.captionStyles.textStyles.textSize);
                if (captionLineHeight === 0){
                    captionLineHeight = await measureTextHeight(captionLine, this.captionStyles.textStyles.textSize);
                }
                if (captionLineWidth > this.width*this.rangeFactor){
                    captionLines.push(captionLine);
                    captionLine = "";
                }
            }
            if (captionLine.length > 0){
                captionLines.push(captionLine);
            }
            captionHeight = captionLines.length * captionLineHeight;
            var maxCaptionWidth = 0;
            // captionLines.forEach(async (line) => {
            //     var lineWidth = await measureTextWidth(line, this.captionStyles.textSize);
            //     console.log("lineWidth", lineWidth);
            //     maxCaptionWidth = Math.max(maxCaptionWidth, lineWidth);
            // });
            // the foreach loop should be promise base, so we need to use for loop
            for (var i = 0; i < captionLines.length; i++){
                var lineWidth = await measureTextWidth(captionLines[i], this.captionStyles.textStyles.textSize);
                maxCaptionWidth = Math.max(maxCaptionWidth, lineWidth);
            }
            captionWidth = maxCaptionWidth;
            caption = captionLines;
        }
        this.titleRelativePos = this.styles.titleStyles.relativePos?this.styles.titleStyles.relativePos:'top';
        
        // second: calculate the position of title and caption
        this.svgBBox = await getBBoxGroup(this.svg.node());
        // console.log(captionHeight, titleHeight);
        console.log(this.svgBBox);
        var margin = 20;
        if (this.titleRelativePos === 'top'){
            this.captionPos = {x: this.svgBBox.minX, y: this.svgBBox.minY - captionHeight - margin};
            this.titlePos = {x: this.svgBBox.minX, y: this.captionPos.y - titleHeight - margin/2};
        }
        else if (this.titleRelativePos === 'bottom'){
            this.titlePos = {x: this.svgBBox.minX, y: this.svgBBox.maxY + this.svgBBox.height + margin};
            this.captionPos = {x: this.svgBBox.minX, y: this.titlePos.y + titleHeight + margin/2};
        }

        this.topicIconStyles = this.styles.topicIconStyles?this.styles.topicIconStyles:{};
        // if (this.topicIconStyles){
        //     let iconStyles = this.topicIconStyles.iconStyles?this.topicIconStyles.iconStyles:{};
        //     let layout = iconStyles.layout?iconStyles.layout:'right';
        //     let align = iconStyles.align?iconStyles.align:'middle';
        //     let sizeRatio = iconStyles.sizeRatio?iconStyles.sizeRatio:1;
        //     let icon = this.meta_data.topic_icon;
        //     let chartWidth = this.svgBBox.maxX - this.svgBBox.minX;
        //     let chartHeight = this.svgBBox.maxY - this.svgBBox.minY;
        //     if (layout === 'right' || layout === 'left'){
        //         this.topicIconHeight = chartHeight * sizeRatio;
        //         this.topicIconWidth = this.topicIconHeight;
        //     }
        //     else{
        //         this.topicIconWidth = chartWidth * sizeRatio;
        //         this.topicIconHeight = this.topicIconWidth;
        //     }
        //     let topicIconX = 0;
        //     let topicIconY = 0;
        //     if (layout === 'right' || layout === 'left'){
        //         let middleY = this.svgBBox.minY + chartHeight/2;
        //         if (align === 'top'){
        //             topicIconY = this.svgBBox.minY;
        //         }
        //         else if (align === 'middle'){
        //             topicIconY = middleY - this.topicIconHeight/2;
        //         }
        //         else if (align === 'bottom'){
        //             topicIconY = this.svgBBox.maxY - this.topicIconHeight;
        //         }
        //         if (layout === 'right'){
        //             topicIconX = this.svgBBox.maxX;
        //         }
        //         else if (layout === 'left'){
        //             topicIconX = this.svgBBox.minX - this.topicIconWidth;
        //         }
        //     }
        //     else{
        //         let middleX = this.svgBBox.minX + chartWidth/2;
        //         if (align === 'top'){
        //             topicIconX = this.svgBBox.minX;
        //         }
        //         else if (align === 'middle'){
        //             topicIconX = middleX - this.topicIconWidth/2;
        //         }
        //         else if (align === 'bottom'){
        //             topicIconX = this.svgBBox.maxX - this.topicIconWidth;
        //         }
        //         if (layout === 'bottom'){
        //             topicIconY = this.svgBBox.maxY;
        //         }
        //         else if (layout === 'top'){
        //             topicIconY = this.svgBBox.minY - this.topicIconHeight;
        //         }
        //     }
        //     this.topicIconPos = {x: topicIconX, y: topicIconY, width: this.topicIconWidth, height: this.topicIconHeight};
        //     var topicIcon = new Annotation("", this.meta_data.topic_icon, this.topicIconPos, this.topicIconStyles, "topic-icon");
        //     await topicIcon.render(this.svg);
        // }

        
        // var caption = new Annotation(caption, null, this.captionPos, this.captionStyles, "caption");
        // var title = new Annotation(title, null, this.titlePos, this.titleStyles, "title");
        // await caption.render(this.svg);
        // await title.render(this.svg);
        // TODO
        
    }
    async save(path) {
        // save the chart to a file
        // const svgString = this.canvas.node().outerHTML;
        const svgString = this.d3n.svgString();
        fs.writeFileSync(path, svgString);
    }
    async adjustSVGtoFit() {
        // adjust the svg to fit the content
        // get the bounding box of the svg
        this.svgBBox = await getBBoxGroup(this.svg.node());
        // debug
        // this.svg.append('rect')
        //     .attr('x', this.svgBBox.minX)
        //     .attr('y', this.svgBBox.minY)
        //     .attr('width', this.svgBBox.maxX - this.svgBBox.minX)
        //     .attr('height', this.svgBBox.maxY - this.svgBBox.minY)
        //     .attr('fill', 'none')
        //     .attr('stroke', 'red');
        const minX = this.svgBBox.minX;
        const minY = this.svgBBox.minY;
        const maxX = this.svgBBox.maxX;
        const maxY = this.svgBBox.maxY;
        const width = maxX - minX;
        const height = maxY - minY;
        const scaleX = this.width / width;
        const scaleY = this.height / height;
        const scale = Math.min(scaleX, scaleY)-0.1;
        const translateX = -minX*scale + (this.width - width*scale)/2;
        const translateY = -minY*scale + (this.height - height*scale)/2;
        this.svg.attr('transform', `translate(${translateX}, ${translateY}) scale
        (${scale})`);
    }
    async adjustSVGtoFitCanvas(wholeCanvas) {
        this.svgBBox = await getBBoxGroup(this.svg.node());
        let wholeCanvasBBox = wholeCanvas.node().getBoundingClientRect();
        let canvasWidth = wholeCanvasBBox.width;
        let canvasHeight = wholeCanvasBBox.height;
        console.log('svgBBox', this.svgBBox);
        let canvasAspectRatio = canvasWidth / canvasHeight;
        let svgWidth = this.svgBBox.maxX - this.svgBBox.minX;
        let svgHeight = this.svgBBox.maxY - this.svgBBox.minY;
        let svgAspectRatio = svgWidth / svgHeight;
        let newSvgWidth = 0;
        let newSvgHeight = 0;
        if (canvasAspectRatio > svgAspectRatio){
            newSvgHeight = canvasHeight * 0.9;
            newSvgWidth = svgWidth / svgHeight * canvasHeight;
        }
        else{
            newSvgWidth = canvasWidth * 0.9;
            newSvgHeight = svgHeight / svgWidth * canvasWidth;
        }
        console.log('canvasWidth, canvasHeight, svgWidth, svgHeight, newSvgWidth, newSvgHeight', canvasWidth, canvasHeight, svgWidth, svgHeight, newSvgWidth, newSvgHeight);
        let scaleX = newSvgWidth / svgWidth;
        let scaleY = newSvgHeight / svgHeight;
        let scale = Math.min(scaleX, scaleY);
        let targetMinX = (canvasWidth - newSvgWidth) / 2;
        let targetMinY = (canvasHeight - newSvgHeight) / 2;
        console.log('targetMinX, targetMinY', targetMinX, targetMinY);
        let scaledX = this.svgBBox.minX * scale;
        let scaledY = this.svgBBox.minY * scale;
        let translateX = targetMinX - scaledX;
        let translateY = targetMinY - scaledY;
        // this.svg.attr('height', newSvgHeight).attr('width', newSvgWidth);
        this.svg.attr('transform', `translate(${translateX}, ${translateY}),scale(${scale})`);
        // this.svg.attr('transform',`scale(2)`);
        // console.log('translateX, translateY, scale', translateX, translateY, scale);

    }
}

// module.exports = Chart;

export default Chart;