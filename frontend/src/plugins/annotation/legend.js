// const {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} = require('../utils/getBBox');
// import { measureTextWidth, measureTextHeight, processImage } from '../utils/iconHelpers';
// import { getBBoxText, parseTransform, getBBoxGroup, calculateMinimumMovement, applyTransform } from '../utils/getBBox';
import { measureTextHeight, measureTextWidth } from '../utils/getBBox';
class Legend {
    constructor (data, iconPath, positions, styles, id, type){
        this.data = data;
        this.id = id;
        this.type = type;
        this.iconPath = iconPath;
        this.x = positions.x;
        this.y = positions.y;
        this.styles = styles;
        this.textStyles = styles.textStyles?styles.textStyles:{};
        this.textSize = this.textStyles.textSize?this.textStyles.textSize:12;
        this.textColor = this.textStyles.textColor?this.textStyles.textColor:'black';
        this.textAlign = this.textStyles.textAlign?this.textStyles.textAlign:'start';

        this.fillStyles = styles.fillStyles?styles.fillStyles:{};
        this.fillColor = this.fillStyles.fillColor?this.fillStyles.fillColor:'black';

        this.strokeStyles = styles.strokeStyles?styles.strokeStyles:{};
        this.strokeWidth = this.strokeStyles.strokeWidth?this.strokeStyles.strokeWidth:1;
        this.strokeColor = this.strokeStyles.strokeColor?this.strokeStyles.strokeColor:'black';
    }

    async render(svg){
        // an annotation consist of a phrase of text or a ico
        this.g = svg.append('g')
            .attr('id', this.id);
        // approximate line height
        let lineHeight = await measureTextHeight('A', this.textSize);
        let currentY = this.y;
        let currentX = this.x;
        let rectFactor = 0.75;
        for (let i = 0; i < this.data.length; i++){
            let data = this.data[i];
            let text = data.text;
            currentX = this.x;
            if (this.type ==='bar'){
                this.g.append('rect')
                    .attr('x', currentX)
                    .attr('y', currentY)
                    .attr('width', lineHeight*rectFactor)
                    .attr('height', lineHeight*rectFactor)
                    .attr('fill', data.color);
                currentX += lineHeight;
            }
            this.g.append('text')
                .attr('x', currentX)
                .attr('y', currentY)
                .attr('font-size', this.textSize)
                .attr('fill', this.textColor)
                .attr('text-anchor', this.textAlign)
                .attr('alignment-baseline', 'hanging')
                .text(text);
            console.log('text', text);
            currentY += lineHeight
        }
    }
}

// module.exports = Legend;
export default Legend;