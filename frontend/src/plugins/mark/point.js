// const baseMark = require('./baseMark');
// const { processImage } = require('../utils/iconHelpers');

import baseMark from './baseMark';
// import { processImage } from '../utils/iconHelpers';

class Point extends baseMark {
    constructor(data, strokeStyles, fillStyles, x, y, r, id, attachStyles) {
        super(data, strokeStyles, fillStyles);
        this.x = x;
        this.y = y;
        this.r = r;
        this.id = id;
        this.type = 'point';
        this.g = null;
        this.element = null;
        this.strokeStyles = strokeStyles?strokeStyles:{};
        this.fillStyles = fillStyles?fillStyles:{};
        this.fillColor = this.fillStyles.fillColor?this.fillStyles.fillColor:'steelblue';
        this.strokeWidth = this.strokeStyles.strokeWidth?this.strokeStyles.strokeWidth:2;
        this.strokeColor = this.strokeStyles.strokeColor?this.strokeStyles.strokeColor:'black';

        this.attachStyles = attachStyles?attachStyles:{};
        this.attachMethod = this.attachStyles.attachMethod?this.attachStyles.attachMethod:'attach'; // attach, unit, multiple
        this.attachSide = this.attachStyles.attachSide?this.attachStyles.attachSide:'outer';
        this.attachPosition = this.attachStyles.attachPosition?this.attachStyles.attachPosition:'end';
    }
    async render(g) {
        this.g = g;
        this.element = await g.append('circle')
            .attr('id', this.id)
            .attr('class', 'point')
            .attr('cx', this.x)
            .attr('cy', this.y)
            .attr('r', this.r)
            .attr('fill', this.fillColor)
            .attr('stroke', this.strokeColor)
            .attr('stroke-width', this.strokeWidth);
    }
    async attachIcon(iconPath) {
        // let iconImage = await processImage(iconPath, this.fillColor);
        // let iconOriginalWidth = iconImage.info.width;
        // let iconOriginalHeight = iconImage.info.height;
        // let iconAspectRatio = iconOriginalWidth / iconOriginalHeight;
        // let iconWidth = 0;
        // let iconHeight = 0;
        // let iconX = 0;
        // let iconY = 0;
        // let margin = 5;
    }
}

// module.exports = Point;

export default Point;