// const {getBBoxText, parseTransform, getBBoxGroup, measureTextWidth, measureTextHeight, calculateMinimumMovement, applyTransform} = require('../utils/getBBox');
// const {processImage} = require('../utils/iconHelpers');
// import { processImage } from '../utils/iconHelpers';
import { getBBoxText, parseTransform, getBBoxGroup, calculateMinimumMovement, applyTransform,measureTextWidth, measureTextHeight} from '../utils/getBBox';


class Annotation {
    constructor (text, iconPath, positions, styles, id){
        this.id = id;
        this.text = text;
        this.iconPath = iconPath;
        this.x = positions.x;
        this.y = positions.y;
        this.width = positions.width;
        this.height = positions.height;
        // Line style
        this.strokeStyles = styles.strokeStyles?styles.strokeStyles:{};
        this.strokeWidth = this.strokeStyles.strokeWidth?this.strokeStyles.strokeWidth:1;
        this.strokeColor = this.strokeStyles.strokeColor?this.strokeStyles.strokeColor:'black';

        // Text style
        this.textStyles = styles.textStyles?styles.textStyles:{};
        this.textSize = this.textStyles.textSize?this.textStyles.textSize:12;
        this.textColor = this.textStyles.textColor?this.textStyles.textColor:'black';
        this.textAlign = this.textStyles.textAlign?this.textStyles.textAlign:'start';

        // Icon style
        this.iconStyles = styles.iconStyles?styles.iconStyles:{};
        this.icon = this.iconStyles.icon?this.iconStyles.icon:false;
        this.layout = this.iconStyles.layout?this.iconStyles.layout:'right';
        this.align = this.iconStyles.align?this.iconStyles.align:'middle';
        this.sizeRatio = this.iconStyles.sizeRatio?this.iconStyles.sizeRatio:1;

        this.g = null;
    }


    async render(svg){
        // an annotation consist of a phrase of text or a ico
        this.g = svg.append('g')
            .attr('id', this.id);
        if(this.icon && this.text !== ''){
            console.log('this.icon', this.icon, this.text);
            // 如果text不是string，那么就是一个数组，数组的每个元素都是一个text
            if (typeof this.text === 'string'){
                this.text = [this.text];
            }
            // let lineHeight = this.lineHeight?this.lineHeight:20;
            // let lineWidth = this.lineWidth?this.lineWidth:20;
            let widthMargin = await measureTextWidth('M', this.textSize);
            if (!this.lineHeight){
                this.lineHeight = await measureTextHeight(this.text[0], this.textSize);
            }
            this.lineWidth = 0;
            for (let i = 0; i < this.text.length; i++){
                this.lineWidth = Math.max(this.lineWidth, await measureTextWidth(this.text[i], this.textSize));
            }
            this.textWidth = this.lineWidth;
            this.textHeight = this.lineHeight * this.text.length;
            
            this.iconWidth = 0;
            this.iconHeight = 0;
            let iconImage = await processImage(this.icon, this.fillColor);
            this.iconOriginalWidth = iconImage.info.width;
            this.iconOriginalHeight = iconImage.info.height;
            this.iconAspectRatio = this.iconOriginalWidth / this.iconOriginalHeight;
            if (this.layout === 'right' || this.layout === 'left'){
                this.iconHeight = this.textHeight * this.sizeRatio;
                this.iconWidth = this.iconHeight * this.iconAspectRatio;
            }
            else{
                this.iconWidth = this.textWidth * this.sizeRatio;
                this.iconHeight = this.iconWidth / this.iconAspectRatio;
            }
            let maxHeight = 200;
            let maxWidth = 200;
            if (this.iconHeight > maxHeight){
                this.iconHeight = maxHeight;
                this.iconWidth = this.iconHeight * this.iconAspectRatio;
            }
            if (this.iconWidth > maxWidth){
                this.iconWidth = maxWidth;
                this.iconHeight = this.iconWidth / this.iconAspectRatio;
            }

            let textX = 0;
            let textY = 0;
            let iconX = 0;
            let iconY = 0;



            let largerWidth = Math.max(this.textWidth, this.iconWidth);
            let largerHeight = Math.max(this.textHeight, this.iconHeight);
            if (this.layout === 'right' || this.layout === 'left'){
                let middleY = this.y + largerHeight / 2;
                if (this.align === 'top'){
                    textY = this.y;
                    iconY = this.y;
                }
                else if (this.align === 'middle'){
                    textY = middleY - this.textHeight / 2;
                    iconY = middleY - this.iconHeight / 2;
                }
                else if (this.align === 'bottom'){
                    textY = this.y + largerHeight - this.textHeight;
                    iconY = this.y + largerHeight - this.iconHeight;
                }
                if (this.layout === 'right'){
                    textX = this.x;
                    iconX = this.x + this.textWidth+widthMargin;
                }
                else{
                    textX = this.x + this.iconWidth;
                    iconX = this.x;
                }
            }
            else{
                let middleX = this.x + largerWidth / 2;
                if (this.align === 'start'){
                    textX = this.x;
                    iconX = this.x;
                }
                else if (this.align === 'middle'){
                    textX = middleX - this.textWidth / 2;
                    iconX = middleX - this.iconWidth / 2;
                }
                else if (this.align === 'end'){
                    textX = this.x + largerWidth - this.textWidth - widthMargin;
                    iconX = this.x + largerWidth - this.iconWidth;
                }
                if (this.layout === 'bottom'){
                    textY = this.y;
                    iconY = this.y + this.textHeight;
                }
                else{
                    textY = this.y + this.iconHeight;
                    iconY = this.y;
                }
            }

            for (let i = 0; i < this.text.length; i++){
                this.g.append('text')
                    .attr('x', textX)
                    .attr('y', textY + i * this.lineHeight)
                    .attr('font-size', this.textSize)
                    .attr('fill', this.textColor)
                    .attr('text-anchor', this.textAlign)
                    .attr('alignment-baseline', 'hanging')
                    .text(this.text[i]);
            }
            this.g.append('image')
                .attr('x', iconX)
                .attr('y', iconY)
                .attr('width', this.iconWidth)
                .attr('height', this.iconHeight)
                .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`);  
        }
        else if (this.icon && this.text==""){
            let iconImage = await processImage(this.icon, this.fillColor);
            let iconWidth = iconImage.info.width;
            let iconHeight = iconImage.info.height;
            let iconAspectRatio = iconWidth / iconHeight;
            let curAspectRatio = this.width / this.height;

            if (curAspectRatio > iconAspectRatio){
                iconHeight = this.height;
                iconWidth = iconHeight * iconAspectRatio;
            }
            else{
                iconWidth = this.width;
                iconHeight = iconWidth / iconAspectRatio;
            }
            if (iconWidth > this.width){
                iconWidth = this.width;
                iconHeight = iconWidth / iconAspectRatio;
            }
            if (iconHeight > this.height){
                iconHeight = this.height;
                iconWidth = iconHeight * iconAspectRatio;
            }
            this.g.append('image')
                .attr('x', this.x)
                .attr('y', this.y)
                .attr('width', iconWidth)
                .attr('height', iconHeight)
                .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`);
        }
        else{
            // 如果text不是string，那么就是一个数组，数组的每个元素都是一个text
            if (typeof this.text === 'string'){
                this.text = [this.text];
            }
            // let lineHeight = this.lineHeight?this.lineHeight:20;
            // let lineWidth = this.lineWidth?this.lineWidth:20;
            if (!this.lineHeight){
                this.lineHeight = await measureTextHeight(this.text[0], this.textSize);
            }
            for (let i = 0; i < this.text.length; i++){
                this.g.append('text')
                    .attr('x', this.x)
                    .attr('y', this.y + i * this.lineHeight)
                    .attr('font-size', this.textSize)
                    .attr('fill', this.textColor)
                    .attr('text-anchor', this.textAlign)
                    .text(this.text[i]);
            }
        }
    }
}

// module.exports = Annotation;
export default Annotation;