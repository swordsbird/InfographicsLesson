// const baseMark = require('./baseMark');
// const { processImage } = require('../utils/iconHelpers');
import baseMark from './baseMark';
// import { processImage } from '../utils/iconHelpers';

class Arc extends baseMark {
    constructor(data, strokeStyles, fillStyles, cx, cy, startAngle, endAngle, innerRadius, outerRadius, id, attachStyles) {
        super(data, strokeStyles, fillStyles);
        this.cx = cx;
        this.cy = cy;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.id = id;
        this.type = 'arc';
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
        const d3 = await import('d3');
        this.g = g;
        this.element = await g.append('path')
            .attr('id', this.id)
            .attr('class', 'arc')
            .attr('d', d3.arc()
                .innerRadius(this.innerRadius)
                .outerRadius(this.outerRadius)
                .startAngle(this.startAngle)
                .endAngle(this.endAngle)
            )
            .attr('stroke', this.strokeColor)
            .attr('stroke-width', this.strokeWidth)
            .attr('transform', `translate(${this.cx}, ${this.cy})`)
            .attr('fill', this.fillColor);
        
        // console.log(this.element.attr('d'));
    }
    // async attachIcon(iconPath) {
    //     let iconImage = await processImage(iconPath, this.fillColor);
    //     let iconOriginalWidth = iconImage.info.width;
    //     let iconOriginalHeight = iconImage.info.height;
    //     let iconAspectRatio = iconOriginalWidth / iconOriginalHeight;
    //     let iconWidth = 0;
    //     let iconHeight = 0;
    //     let margin = 5;
    //     let iconX = 0;
    //     let iconY = 0;
    //     let iconRadius = 0;
        
    //     console.log(this.cx, this.cy);
    //     console.log(this.startAngle, this.endAngle,(this.startAngle + this.endAngle) / 2);
    //     if (this.attachStyles.attachMethod === 'attach') {
    //         iconWidth = (this.outerRadius+this.innerRadius)/2*this.attachStyles.attachSizeRatio;
    //         iconHeight = iconWidth / iconAspectRatio;
    //         iconRadius = Math.sqrt((iconWidth / 2)*(iconWidth / 2) + (iconHeight / 2)*(iconHeight / 2)) + margin;
    //         if (this.attachSide === 'outer'){
    //             iconX = this.cx + (this.outerRadius + iconRadius) * Math.sin((this.startAngle + this.endAngle) / 2)- iconWidth / 2;
    //             iconY = this.cy - (this.outerRadius + iconRadius) * Math.cos((this.startAngle + this.endAngle) / 2) - iconHeight / 2;
    //         }
    //         else {
    //             iconX = this.cx + (this.innerRadius + this.outerRadius)/2 * Math.cos((this.startAngle + this.endAngle) / 2) - iconWidth / 2;
    //             iconY = this.cy + (this.innerRadius + this.outerRadius)/2 * Math.sin((this.startAngle + this.endAngle) / 2) - iconHeight / 2;
    //         }
    //     }
    //     this.g.append('image')
    //         .attr('x', iconX)
    //         .attr('y', iconY)
    //         .attr('width', iconWidth)
    //         .attr('height', iconHeight)
    //         .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`);
    // }
}

// module.exports = Arc;
export default Arc;