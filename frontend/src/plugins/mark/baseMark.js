class baseMark {
    constructor(data, styles, annotateData) {
        this.data = data;
        this.styles = styles;
        this.strokeStyles = this.styles.strokeStyles?this.styles.strokeStyles:{};
        this.fillStyles = this.styles.fillStyles?this.styles.fillStyles:{};
        this.textStyles = this.styles.textStyles?this.styles.textStyles:{};
        this.attachStyles = this.styles.attachStyles?this.styles.attachStyles:{};
        this.annotateStyles = this.styles.annotateStyles?this.styles.annotateStyles:{};
        this.annotateData = annotateData;
    }
    
    render(g) {
        console.log('baseMark render');
    }
}

// module.exports = baseMark;

export default baseMark;