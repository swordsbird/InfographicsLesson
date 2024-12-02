// const Chart = require('./chart');
// const Bar = require('./mark/bar');
// const AxisLine = require('./axis/axis_line');
// const Legend = require('./annotation/legend');
import Chart from './chart';
import Bar from './mark/bar';
import AxisLine from './axis/axis_line';
import Legend from './annotation/legend';

class BarChart extends Chart {
    constructor(data, meta_data, styles, width, height) {
        super(data, meta_data, styles, width, height);
        this.type = 'barchart';
        this.x_axis_styles = styles.x_axis_styles?styles.x_axis_styles:{};
        this.y_axis_styles = styles.y_axis_styles?styles.y_axis_styles:{};
        this.mark_styles = styles.mark_styles?styles.mark_styles:{};
        this.title_styles = styles.title_styles?styles.title_styles:{};
        this.caption_styles = styles.caption_styles?styles.caption_styles:{};
        this.annotate_data = styles.annotate_data!==undefined?styles.annotate_data:false;
        this.attachStyles = styles.attachStyles?styles.attachStyles:{};
        
        this.x_axis_id = 'x-axis';
        this.y_axis_id = 'y-axis';
        this.x_axis = null;
        this.y_axis = null;
    }
    async render(wholeCanvas) {
        // wholeCanvas is a dom canvas element
        // and this.canvas is a svg element created by d3 on wholeCanvas
        // first, create a svg element

        let wholeCanvasBBox = wholeCanvas.node().getBoundingClientRect();
        let canvasWidth = wholeCanvasBBox.width;
        let canvasHeight = wholeCanvasBBox.height;
        console.log("canvasWidth, canvasHeight", canvasWidth, canvasHeight);

        console.log("this.width, this.height", this.width, this.height);
        this.canvas = wholeCanvas.append('svg').attr('width', canvasWidth).attr('height', canvasHeight);
        // let translateX = (canvasWidth - this.width)/2;
        // let translateY = (canvasHeight - this.height)/2;
        // this.canvas.attr('transform', 'translate(' + translateX + ',' + translateY + ')');

        this.svg = this.canvas.append('g').attr('id', 'chart').attr('width', this.width).attr('height', this.height);
        await this.configAxis();
        await this.x_axis.render(this.svg);
        await this.y_axis.render(this.svg);
        // console.log("this.x_axis", this.x_axis);
        await this.configMarks();
        await this.configAnnotation();
        // console.log("this.styles", this.styles);
        if (this.styles.show_legend) {
            await this.configLegend();
        }
        // await this.configBackground();

        await this.adjustSVGtoFitCanvas(this.canvas);
    }
    async configAxis() {
        const d3 = await import('d3');
        const x_axis_length = (this.x_axis_styles.angle ===0||this.x_axis_styles.angle ===180 ? this.width : this.height) * this.rangeFactor;
        const y_axis_length = (this.y_axis_styles.angle ===0||this.y_axis_styles.angle ===180 ? this.width : this.height) * this.rangeFactor;
        this.x_axis_length = x_axis_length;
        this.y_axis_length = y_axis_length;
        this.x_axis_positions = {x: this.width/2, y: this.height/2};
        
        if (this.meta_data.x_type === 'categorical' || this.meta_data.x_type === 'temporal') {
            this.x_scale = d3.scaleBand()
                .domain(this.data.map(d => d.x))
                .range([0, x_axis_length])
                .padding(0.5);
        }
        this.y_axis_positions = {x: this.width/2, y: this.height/2};
        if (this.meta_data.y_type === 'numerical') {
            this.y_scale = d3.scaleLinear().domain([Math.min(0,this.y_min), this.y_max]).range([0, y_axis_length]);
        }
        // else if meta_data.y_type is not a string, it is a array
        else if (typeof this.meta_data.y_type !== 'string') {
            // 按y_type[0]的类型来处理
            if (this.meta_data.y_type[0] === 'categorical' || this.meta_data.x_type === 'temporal') {
                this.y_scale = d3.scaleBand().domain(this.data.map(d => d.y[0])).range([0, y_axis_length]);
            }
            else {
                this.y_scale = d3.scaleLinear().domain([Math.min(0,this.y_min), this.y_max]).range([0, y_axis_length]);
            }
        }
        console.log("this.meta_data.y_type", this.meta_data.y_type);
        let icons = [];
        for (let i = 0; i < this.data.length; i++) {
            icons.push(this.data[i].x_data_icon);
        }
        this.x_axis = new AxisLine(this.meta_data.x_axis, this.x_scale,this.x_axis_positions, this.x_axis_styles, this.x_axis_id, icons);
        this.y_axis = new AxisLine(this.meta_data.y_axis, this.y_scale,this.y_axis_positions, this.y_axis_styles, this.y_axis_id);
    }
    async configMarks() {
        // add a group
        this.markGroup = this.svg.append('g')
            .attr('id', 'marks')
            .attr('class', 'bar');
        // add bars
        await Promise.all(this.data.map(async (d, i) => {
            let x = 0;
            let y = 0;
            let base_x = 0;
            let base_y = 0;
            let width = 0;
            let height = 0;
            let x1, x2, y1, y2 = 0;
            this.orientation = 'vertical';
            if (this.x_axis_styles.angle === 0 || this.x_axis_styles.angle === 180) {
                this.orientation = 'vertical';
            }
            else{
                this.orientation = 'horizontal';
            }

            console.log("this.orientation", this.orientation);
            if (this.orientation === 'vertical') {
                y = await this.y_axis.pos(d.y);
                base_y = await this.y_axis.basePos();
                width = await this.x_axis.bandWidth();
                // console.log("y, base_y, width", y, base_y, width);
                x = await this.x_axis.pos(d.x);
                x1 = x;
                x2 = x+width;
                y1 = base_y;
                y2 = y;
            }
            else{
                x = await this.y_axis.pos(d.y);
                y = await this.x_axis.pos(d.x);
                base_x = await this.y_axis.basePos();
                height = await this.x_axis.bandWidth();
                x1 = base_x;
                x2 = x;
                y1 = y;
                y2 = y+height;
            }
            // determine minX, minY, maxX, maxY
            const minX = Math.min(x1, x2);
            const minY = Math.min(y1, y2);
            const maxX = Math.max(x1, x2);
            const maxY = Math.max(y1, y2);
            height = maxY - minY;
            width = maxX - minX;
            // console.log("minX, minY, maxX, maxY", minX, minY, maxX, maxY);
            const id = 'bar-' + i;
            this.mark_styles.fillStyles.fillColor = d.color;
            const bar = new Bar(d, this.mark_styles, minX, minY, width, height, id, this.y_axis_styles.angle, this.styles.attachStyles, this.annotate_data);
            await bar.render(this.markGroup);
            // await bar.attachIcon(path.join(this.iconDir, d.x_data_icon));
        }));

        // wait for all bars to render
        // await Promise.all(bars);

    }
    async configLegend() {
        // add a group
        this.legendGroup = this.svg.append('g')
            .attr('id', 'legend')
            .attr('class', 'legend');
        const legendX = this.svgBBox.maxX + 10;
        const legendY = this.svgBBox.minY;
        const positions = {x: legendX, y: legendY};
        // add legends
        const group_indicator = this.meta_data.group_indicator;
        let legend_data = [];
        for (let i = 0; i < group_indicator.length; i++) {
            legend_data.push({color: this.meta_data.group_color[group_indicator[i]], text: group_indicator[i]});
        }
        this.legend_styles = {};
        const legend = new Legend(legend_data,"",positions, this.legend_styles, 'legend', 'bar');
        await legend.render(this.legendGroup);
    }

    async configBackground() {
        // add a group
        this.backgroundGroup = this.svg.append('g')
            .attr('id', 'background')
            .attr('class', 'background')
            // move to the lower layer
            .lower();
        this.styles.addBackgroundGrid = true;
        if (this.styles.addBackgroundGrid) {
            console.log("add background grid");
            var x_list = [];
            var y_list = [];
            var x_limit = 0;
            var y_limit = 0;
            var x_base = 0;
            var y_base = 0;
            if (this.y_axis_styles.angle === 90 || this.y_axis_styles.angle === -90) {
                x_list = await this.x_axis.tickPoses();
                y_list = await this.y_axis.tickPoses();
            }
            else {
                x_list = await this.y_axis.tickPoses();
                y_list = await this.x_axis.tickPoses();
            }
            if (this.y_axis_styles.angle === 90){
                y_limit = this.y_axis_positions.y - this.y_axis_length;
                y_base = this.y_axis_positions.y;
            }
            else if (this.y_axis_styles.angle === -90){
                y_limit = this.y_axis_positions.y + this.y_axis_length;
                y_base = this.y_axis_positions.y;
            }
            else if (this.y_axis_styles.angle === 0){
                x_limit = this.y_axis_positions.x + this.y_axis_length;
                x_base = this.y_axis_positions.x;
            }
            else if (this.y_axis_styles.angle === 180){
                x_limit = this.x_axis_positions.x - this.x_axis_length;
                x_base = this.x_axis_positions.x;
            }

            if (this.x_axis_styles.angle === 90){
                y_limit = this.x_axis_positions.y - this.x_axis_length;
                y_base = this.x_axis_positions.y;
            }
            else if (this.x_axis_styles.angle === -90){
                y_limit = this.x_axis_positions.y + this.x_axis_length;
                y_base = this.x_axis_positions.y;
            }
            else if (this.x_axis_styles.angle === 0){
                x_limit = this.x_axis_positions.x + this.x_axis_length;
                x_base = this.x_axis_positions.x;
            }
            else if (this.x_axis_styles.angle === 180){
                x_limit = this.x_axis_positions.x - this.x_axis_length;
                x_base = this.x_axis_positions.x;
            }
            // console.log("x_list", x_list);
            // console.log("y_list", y_list);
            // console.log("x_base, x_limit, y_base, y_limit", x_base, x_limit, y_base, y_limit);
            // add grid
            // for each x in x_list, add a vertical line from y_base to y_limit
            if (this.y_axis_styles.angle === 90 || this.y_axis_styles.angle === -90) {
                // for each y in y_list, add a horizontal line from x_base to x_limit
                for (let i = 0; i < y_list.length; i++) {
                    const y = y_list[i];
                    const line = this.backgroundGroup.append('line')
                        .attr('x1', x_base)
                        .attr('y1', y)
                        .attr('x2', x_limit)
                        .attr('y2', y)
                        .attr('stroke', this.styles.y_axis_styles.strokeStyles.strokeColor)
                        .attr('stroke-width', this.styles.y_axis_styles.strokeStyles.strokeWidth);
                }
            }
            else {
                for (let i = 0; i < x_list.length; i++) {
                    const x = x_list[i];
                    const line = this.backgroundGroup.append('line')
                        .attr('x1', x)
                        .attr('y1', y_base)
                        .attr('x2', x)
                        .attr('y2', y_limit)
                        .attr('stroke', this.styles.x_axis_styles.strokeStyles.strokeColor)
                        .attr('stroke-width', this.styles.x_axis_styles.strokeStyles.strokeWidth);
                } 
            }
        }
    }
}

export default BarChart;