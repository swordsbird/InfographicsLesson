import Chart from './chart';
import Line from './mark/line';
import AxisLine from './axis/axis_line';
import Legend from './annotation/legend';

class LineChart extends Chart {
    constructor(data, meta_data, styles, width, height) {
        super(data, meta_data, styles, width, height);
        this.type = 'linechart';
        this.x_axis_styles = styles.x_axis_styles || {};
        this.y_axis_styles = styles.y_axis_styles || {};
        this.mark_styles = styles.mark_styles || {};
        this.title_styles = styles.title_styles || {};
        this.caption_styles = styles.caption_styles || {};
    }

    async render(wholeCanvas) {
        let wholeCanvasBBox = wholeCanvas.node().getBoundingClientRect();
        let canvasWidth = wholeCanvasBBox.width;
        let canvasHeight = wholeCanvasBBox.height;

        this.canvas = wholeCanvas.append('svg')
            .attr('width', canvasWidth)
            .attr('height', canvasHeight);

        this.svg = this.canvas.append('g')
            .attr('id', 'chart')
            .attr('width', this.width)
            .attr('height', this.height);

        await this.configAxis();
        await this.x_axis.render(this.svg);
        await this.y_axis.render(this.svg);
        await this.configMarks();
        await this.configAnnotation();
        if (this.styles.show_legend) {
            await this.configLegend();
        }
        await this.adjustSVGtoFitCanvas(this.canvas);
    }

    async configAxis() {
        const d3 = await import('d3');

        this.x_axis_angle = this.x_axis_styles.angle?this.x_axis_styles.angle:0;
        this.x_axis_tickFace = this.x_axis_styles.tickFace?this.x_axis_styles.tickFace:'clw';
        this.x_axis_textFace = this.x_axis_styles.textFace?this.x_axis_styles.textFace:'clw';
        this.x_axis_tickLength = this.x_axis_styles.tickLength?this.x_axis_styles.tickLength:5;
        this.x_axis_tickInnerLength = this.x_axis_styles.tickInnerLength?this.x_axis_styles.tickInnerLength:5;
        this.x_axis_tickOuterLength = this.x_axis_styles.tickOuterLength?this.x_axis_styles.tickOuterLength:0;
        this.x_axis_tickTextSize = this.x_axis_styles.tickTextSize?this.x_axis_styles.tickTextSize:'12px';
        this.x_axis_tickNumber = this.x_axis_styles.tickNumber?this.x_axis_styles.tickNumber:3;
        this.x_axis_titleTextOrient = this.x_axis_styles.titleTextOrient?this.x_axis_styles.titleTextOrient:'horizontal';
        this.x_axis_titleAlign = this.x_axis_styles.titleAlign?this.x_axis_styles.titleAlign:'middle';
        this.x_axis_titleRelativePos = this.x_axis_styles.titleRelativePos?this.x_axis_styles.titleRelativePos:'middle';
        this.x_axis_titleTextSize = this.x_axis_styles.titleTextSize?this.x_axis_styles.titleTextSize:'15px';
        this.x_axis_titleFace = this.x_axis_styles.titleFace?this.x_axis_styles.titleFace:'clw';
        this.x_axis_title = this.meta_data.x_axis?this.meta_data.x_axis:'x-axis';

        var x_config = {
            angle: this.x_axis_angle,
            tickFace: this.x_axis_tickFace,
            textFace: this.x_axis_textFace,
            tickLength: this.x_axis_tickLength,
            tickInnerLength: this.x_axis_tickInnerLength,
            tickOuterLength: this.x_axis_tickOuterLength,
            tickTextSize: this.x_axis_tickTextSize,
            tickNumber: this.x_axis_tickNumber,

            titleTextSize: this.x_axis_titleTextSize,
            titleTextOrient: this.x_axis_titleTextOrient,
            titleAlign: this.x_axis_titleAlign,
            titleRelativePos: this.x_axis_titleRelativePos,
            titleFace: this.x_axis_titleFace,
        };



        // y-axis config
        this.y_axis_angle = this.y_axis_styles.angle?this.y_axis_styles.angle:90;
        this.y_axis_tickFace = this.y_axis_styles.tickFace?this.y_axis_styles.tickFace:'cclw';
        this.y_axis_textFace = this.y_axis_styles.textFace?this.y_axis_styles.textFace:'cclw';
        this.y_axis_tickLength = this.y_axis_styles.tickLength?this.y_axis_styles.tickLength:5;
        this.y_axis_tickInnerLength = this.y_axis_styles.tickInnerLength?this.y_axis_styles.tickInnerLength:5;
        this.y_axis_tickOuterLength = this.y_axis_styles.tickOuterLength?this.y_axis_styles.tickOuterLength:0;
        this.y_axis_tickTextSize = this.y_axis_styles.tickTextSize?this.y_axis_styles.tickTextSize:'12px';
        this.y_axis_tickNumber = this.y_axis_styles.tickNumber?this.y_axis_styles.tickNumber:3;

        this.y_axis_titleTextOrient = this.y_axis_styles.titleTextOrient?this.y_axis_styles.titleTextOrient:'vertical';
        this.y_axis_titleAlign = this.y_axis_styles.titleAlign?this.y_axis_styles.titleAlign:'middle';
        this.y_axis_titleRelativePos = this.y_axis_styles.titleRelativePos?this.y_axis_styles.titleRelativePos:'middle';
        this.y_axis_titleTextSize = this.y_axis_styles.titleTextSize?this.y_axis_styles.titleTextSize:'15px';
        this.y_axis_titleFace = this.y_axis_styles.titleFace?this.y_axis_styles.titleFace:'clw';
        this.y_axis_title = this.meta_data.y_axis?this.meta_data.y_axis:'y-axis';
        var y_config = {
            angle: this.y_axis_angle,
            tickFace: this.y_axis_tickFace,
            textFace: this.y_axis_textFace,
            tickLength: this.y_axis_tickLength,
            tickInnerLength: this.y_axis_tickInnerLength,
            tickOuterLength: this.y_axis_tickOuterLength,
            tickTextSize: this.y_axis_tickTextSize,
            tickNumber: this.y_axis_tickNumber,
            
            titleTextSize: this.y_axis_titleTextSize,
            titleTextOrient: this.y_axis_titleTextOrient,
            titleAlign: this.y_axis_titleAlign,
            titleRelativePos: this.y_axis_titleRelativePos,
            titleFace: this.y_axis_titleFace,
        };

        const x_axis_length = this.orientation === 'vertical' ? this.width*this.rangeFactor : this.height*this.rangeFactor;
        const y_axis_length = this.orientation === 'vertical' ? this.height*this.rangeFactor : this.width*this.rangeFactor;
        
        
        this.x_axis_positions = {x: this.width/2, y: this.height/2};
        this.x_scale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.x)])
            .range([0, x_axis_length]);
            // .padding(0.1);
    
        this.y_axis_positions = {x: this.width/2, y: this.height/2};
        if (this.meta_data.y_type === 'numerical') {
            this.y_scale = d3.scaleLinear().domain([0, d3.max(this.data, d => d.y)]).range([0, y_axis_length]);
            this.r_scale = d3.scaleLinear().domain([0, 0]).range([this.minRadius, this.minRadius]);
        }
        // else if meta_data.y_type is not a string, it is a array
        else if (typeof this.meta_data.y_type !== 'string') {
            this.y_scale = d3.scaleLinear().domain([0, d3.max(this.data, d => d.y[0])]).range([0, y_axis_length]);
            this.r_scale = d3.scaleLinear().domain([0, d3.max(this.data, d => d.y[1])]).range([this.minRadius, this.maxRadius]);
        }

        // console.log(this.orientation);
        // console.log(x_config);
        // console.log(y_config);
        if (this.orientation === 'vertical') {
            this.x_axis = new AxisLine(this.meta_data.x_axis, this.x_scale,this.x_axis_positions, this.x_axis_styles, this.x_axis_id, x_config);
            this.y_axis = new AxisLine(this.meta_data.y_axis, this.y_scale,this.y_axis_positions, this.y_axis_styles, this.y_axis_id, y_config);
        }
        // only swap styles and config
        else {
            this.x_axis = new AxisLine(this.meta_data.y_axis, this.y_scale,this.y_axis_positions, this.x_axis_styles, this.y_axis_id, x_config);
            this.y_axis = new AxisLine(this.meta_data.x_axis, this.x_scale,this.x_axis_positions, this.y_axis_styles, this.x_axis_id, y_config);
        }
    }
    async configMarks() {
        this.markGroup = this.svg.append('g').attr('id', 'marks').attr('class','line');
        var x_axis_length = this.orientation === 'vertical' ? this.width*this.rangeFactor : this.height*this.rangeFactor;
        var y_axis_length = this.orientation === 'vertical' ? this.height*this.rangeFactor : this.width*this.rangeFactor;
        var x_scale = this.x_scale;
        var y_scale = this.y_scale;
        var x_axis_positions = this.x_axis_positions;
        var y_axis_positions = this.y_axis_positions;
        var styles = this.styles.mark_styles;
        var positionListList = [];
        if (typeof this.meta_data.y_type !== 'string'){
            for (let i = 0; i < this.meta_data.y_type.length; i++){
                var positionList = [];
                for (let j = 0; j < this.data.length; j++){
                    positionList.push({x: this.x_axis.pos(this.data[j].x), y: this.y_axis.pos(this.data[j].y[i])});
                }
                positionListList.push(positionList);
            }
        }
        else {
            var positionList = [];
            for (let i = 0; i < this.data.length; i++){
                positionList.push({x: await this.x_axis.pos(this.data[i].x), y: await this.y_axis.pos(this.data[i].y)});
            }
            positionListList.push(positionList);
        }
        for (let i = 0; i < positionListList.length; i++){
            if (positionListList.length>1){
                styles.strokeStyles.strokeColor = this.meta_data.y_color[i];
            }
            else{
                styles.strokeStyles.strokeColor = this.data[0].color;
            }
            let line = new Line([], styles, positionListList[i], 'line'+i, this.styles.attachStyles);
            await line.render(this.markGroup);
            await line.attachIcon(path.join(this.iconDir, this.data[0].x_data_icon));
        }
    }
}

export default LineChart;