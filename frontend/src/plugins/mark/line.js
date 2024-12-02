// const baseMark = require('./baseMark');
// const { processImage } = require('../utils/iconHelpers');
import baseMark from './baseMark';
// import { processImage } from '../utils/iconHelpers';

class Line extends baseMark {
    constructor(data, styles, positionList, id, attachStyles, annotateData) {
        super(data, styles, annotateData);
        this.id = id;
        this.type = 'line';
        this.g = null;
        this.element = null;

        console.log("styles", styles);
        this.positionList = positionList;
        this.strokeColor = styles.strokeStyles.strokeColor;
        this.strokeWidth = styles.strokeStyles.strokeWidth;
        this.fillColor = styles.fillStyles.fillColor;
        this.attachStyles = attachStyles;
    }
    async render(g) {
        this.g = g;
        const d3 = await import('d3');
        // line position list
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y);
        console.log("positionList", this.positionList);
        this.element = await g.append('path')
            .datum(this.positionList)
            .attr('id', this.id)
            .attr('class', 'line')
            .attr('d', line)
            .attr('stroke', this.strokeColor)
            .attr('stroke-width', this.strokeWidth)
            .attr('fill', 'none');
    }
    // async attachIcon(iconPath) {
    //     let iconImage = await processImage(iconPath, this.fillColor);
    //     let iconOriginalWidth = iconImage.info.width;
    //     let iconOriginalHeight = iconImage.info.height;
    //     let iconAspectRatio = iconOriginalWidth / iconOriginalHeight;
    //     let iconWidth = 0;
    //     let iconHeight = 0;
    //     let iconX = 0;
    //     let iconY = 0;
    //     let margin = 5;
    // }
}

// module.exports = Line;
export default Line;