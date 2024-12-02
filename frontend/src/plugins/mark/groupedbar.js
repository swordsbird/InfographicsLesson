// const Bar = require('../mark/bar');
// const { processImage } = require('../utils/iconHelpers');
import Bar from './bar';
// import { processImage } from '../utils/iconHelpers';


class GroupBar extends Bar {
    constructor(data, styles, x, y, width, height, id, angle, annotateData) {
        super(data, styles, x, y, width, height, id, angle, annotateData);
        this.type = 'groupedbar';
        this.barList = [];
    }

    async render(g) {
        const d3 = await import('d3');
        let groupScale = d3.scaleLinear();
        let y_max = d3.max(this.data.y);
        if (this.angle === 90){
            groupScale.domain([0, y_max]).range([0, this.height]);
        }
        else if (this.angle === -90){
            groupScale.domain([0, y_max]).range([0, this.height]);
        }
        else if (this.angle === 0){
            groupScale.domain([0, y_max]).range([0, this.width]);
        }
        else if (this.angle === 180){
            groupScale.domain([0, y_max]).range([0, this.width]);
        }
        this.g = g;
        console.log("this.angle", this.angle);
        if (this.angle === 0 || this.angle === 180){
            let currentY = this.y;
            let height = this.height/this.data.y.length;
            for (let i = 0; i < this.data.y.length; i++){
                let width = groupScale(this.data.y[i]);
                let dataX = this.data.x;
                let dataY = this.data.y[i];
                this.styles.fillStyles.fillColor = this.data.color[i];
                let datum = {x: dataX, y: dataY};
                let bar = new Bar(datum, this.styles, this.x, currentY, width, height, this.id+i, this.angle, this.annotateData);
                await bar.render(this.g);
                this.barList.push(bar);
                currentY += height;
            }
        }
        else if (this.angle === 90 || this.angle === -90){
            let currentX = this.x;
            let width = this.width/this.data.y.length;
            for (let i = 0; i < this.data.y.length; i++){
                console.log("this.data.y[i]", this.data.y[i]);
                let height = groupScale(this.data.y[i]);
                let dataX = this.data.x;
                let dataY = this.data.y[i];
                this.styles.fillStyles.fillColor = this.data.color[i];
                let datum = {x: dataX, y: dataY};
                let bar = new Bar(datum, this.styles, currentX, this.y, width, height, this.id+i, this.angle, this.annotateData);
                await bar.render(this.g);
                this.barList.push(bar);
                currentX += width;
            }
        }
    }

    // async attachIcon(iconPath){
    //     let iconImage = await processImage(iconPath, this.fillColor);
    //     this.g.append('image')
    //         .attr('x', this.x)
    //         .attr('y', this.y)
    //         .attr('width', this.width)
    //         .attr('height', this.height)
    //         .attr('xlink:href', `data:image/png;base64,${iconImage.data.toString('base64')}`);
    // }
}

// module.exports = GroupBar;
export default GroupBar;