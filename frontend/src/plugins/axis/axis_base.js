// Base Axis module
class AxisBase {
    constructor(title, scale, positions, styles, id) {
        this.title = title;
        this.scale = scale; // Linear, Logarithmic, Time, Ordinal
        this.positions = positions; // Top, Bottom, Left, Right
        this.styles = styles; // Styles for the axis
        this.id = id; // Unique id for
        this.strokeStyles = styles.strokeStyles?styles.strokeStyles:{};
        this.textStyles = styles.textStyles?styles.textStyles:{};
        this.fillStyles = styles.fillStyles?styles.fillStyles:{};
        this.attachStyles = styles.attachStyles?styles.attachStyles:{};
    }
    render() {
        console.log(`Rendering axis with title: ${this.title}`);
    }
    async pos(val) {
        return val;
    }
}

export default AxisBase;