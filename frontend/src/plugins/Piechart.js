import Chart from './chart';
import Arc from './mark/arc';
import Legend from './annotation/legend';

class PieChart extends Chart {
    constructor(data, meta_data, styles, width, height) {
        super(data, meta_data, styles, width, height);
        this.type = 'piechart';
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

        await this.configMarks();
        await this.configAnnotation();
        if (this.styles.show_legend) {
            await this.configLegend();
        }
        await this.adjustSVGtoFitCanvas(this.canvas);
    }

    async configMarks() {
        this.markGroup = this.svg.append('g').attr('id', 'marks').attr('class','arc');
        var totalAngle = this.styles.totalAngle?this.styles.totalAngle:Math.PI*2;
        var startAngle = this.styles.startAngle?this.styles.startAngle:0;
        var endAngle = startAngle + totalAngle;
        var innerRadius = this.styles.innerRadius?this.styles.innerRadius:0;
        var outerRadius = this.styles.outerRadius?this.styles.outerRadius:Math.min(this.width, this.height)*this.rangeFactor/2;
        // for each data, compute its angle according to the totalAngle
        var angles = [];
        var total = 0;
        var nArcs = this.data.length;
        var marginAngle = this.styles.marginAngle?this.styles.marginAngle:0;
        this.data.forEach(d => {
            total += d.y;
        });
        var currentAngle = startAngle;
        if (Math.abs(this.totalAngle- Math.PI*2)<1e-3){
            totalAngle -= marginAngle * (nArcs - 1);
        }
        else {
            totalAngle -= marginAngle * nArcs;
            currentAngle += marginAngle;
        }
        // each data add a angle attribute
        this.data.forEach(d => {
            d.angle = totalAngle * d.y / total;
            d.startAngle = currentAngle;
            d.endAngle = currentAngle + d.angle;
            currentAngle += d.angle + marginAngle;
        });
        await Promise.all(this.data.map(async (d, i) => {
            console.log('d', d);
            this.styles.mark_styles.fillStyles.fillColor = d.color;
            let arc = new Arc(d, this.styles.mark_styles.strokeStyles, this.styles.mark_styles.fillStyles, this.width/2, this.height/2, d.startAngle, d.endAngle, innerRadius, outerRadius, 'arc'+i, this.styles.attachStyles);
            await arc.render(this.markGroup);
            await arc.attachIcon(path.join(this.iconDir, d.x_data_icon));
        }));
    }
}

export default PieChart;