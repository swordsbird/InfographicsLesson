const setDefaultStyles = (meta_data, data, input_styles) => {
    if (input_styles === undefined) {
      input_styles = {};
    }
    if (meta_data.x_type === 'categorical' && data[0].x_data_icon === undefined) {return;}
    let styles = {};
    let defaultTextStyles = {
        textColor: 'black',
        textSize: "12px",
        textAlign: 'start',
        textFont: 'Arial',
    };
    let defaultStrokeStyles = {
        strokeColor: 'black',
        strokeWidth: 1,
    };
    let defaultFillStyles = {
        fillColor: 'steelblue',
    };
  
    let defaultAttachStyles = {
        attachMethod : 'unit', // attach, unit, multiple, or none
        attachSide : 'outer', // outer, inner
        attachRelativePos : 'end', // start, middle, end
        attachSizeRatio : 0.8,
    };
    let defaultAnnotateStyles = {
        attachMethod : "attach", // attach, unit, multiple, or none
        attachSide : 'inner', // outer, inner
        attachRelativePos : 'middle', // start, middle, end
        attachSizeRatio : 0.75,
        stackAttach: 'max',
    };
  
    let defaultTitleTextStyles = {
        textColor: 'darkblue',
        textSize: "20px",
        textAlign: 'start',
        textFont: 'Trebuchet MS',
    };
    let defaultCaptionTextStyles = {
        textColor: 'darkslategray',
        textSize: "12px",
        textAlign: 'start',
        textFont: 'Verdana',
    };
  
    let defaultIconStyles = {
        layout: "top", // top, bottom, left, right
        align: "left", // top, bottom, middle, left, right
        sizeRatio: 0.75,
    };
  
    let axisTextStyles = defaultTextStyles;
    let axisStrokeStyles = defaultStrokeStyles;
    let axisFillStyles = defaultFillStyles;
    let axisAttachStyles = defaultAttachStyles;
  
    let titleTextStyles = defaultTitleTextStyles;
    let titleStrokeStyles = defaultStrokeStyles;
    let titleFillStyles = defaultFillStyles;
    let titleIconStyles = {...defaultIconStyles};
  
    let captionTextStyles = defaultCaptionTextStyles;
    let captionStrokeStyles = defaultStrokeStyles;
    let captionFillStyles = defaultFillStyles;
  
    let topicIconTextStyles = defaultTextStyles;
    let topicIconStrokeStyles = defaultStrokeStyles;
    let topicIconFillStyles = defaultFillStyles;
    let topicIconIconStyles = {...defaultIconStyles};
  
    let markStrokeStyles = defaultStrokeStyles;
    let markFillStyles = defaultFillStyles;
    let markTextStyles = defaultTextStyles;
    let markAttachStyles = defaultAttachStyles;
    let markAnnotateStyles = defaultAnnotateStyles;
  
  
    let attachStyles = defaultAttachStyles;
    if (input_styles.attachStyles !== undefined) {
        for (const key in input_styles.attachStyles) {
            attachStyles[key] = input_styles.attachStyles[key];
        }
    }
    const inputAxisStyles = input_styles.axisStyles;
    if (inputAxisStyles !== undefined) {
        if (inputAxisStyles.textStyles !== undefined) {
            for (const key in inputAxisStyles.textStyles) {
                axisTextStyles[key] = inputAxisStyles.textStyles[key];
            }
        }
        if (inputAxisStyles.strokeStyles !== undefined) {
            for (const key in inputAxisStyles.strokeStyles) {
                axisStrokeStyles[key] = inputAxisStyles.strokeStyles[key];
            }
        }
        if (inputAxisStyles.fillStyles !== undefined) {
            for (const key in inputAxisStyles.fillStyles) {
                axisFillStyles[key] = inputAxisStyles.fillStyles[key];
            }
        }
    }
  
    const inputTitleStyles = input_styles.titleStyles;
    if (inputTitleStyles !== undefined) {
        if (inputTitleStyles.textStyles !== undefined) {
            for (const key in inputTitleStyles.textStyles) {
                titleTextStyles[key] = inputTitleStyles.textStyles[key];
            }
        }
        if (inputTitleStyles.strokeStyles !== undefined) {
            for (const key in inputTitleStyles.strokeStyles) {
                titleStrokeStyles[key] = inputTitleStyles.strokeStyles[key];
            }
        }
        if (inputTitleStyles.fillStyles !== undefined) {
            for (const key in inputTitleStyles.fillStyles) {
                titleFillStyles[key] = inputTitleStyles.fillStyles[key];
            }
        }
        if (inputTitleStyles.iconStyles !== undefined) {
            for (const key in inputTitleStyles.iconStyles) {
                titleIconStyles[key] = inputTitleStyles.iconStyles[key];
            }
        }
    }
    const inputCaptionStyles = input_styles.captionStyles;
    if (inputCaptionStyles !== undefined) {
        if (inputCaptionStyles.textStyles !== undefined) {
            for (const key in inputCaptionStyles.textStyles) {
                captionTextStyles[key] = inputCaptionStyles.textStyles[key];
            }
        }
        if (inputCaptionStyles.strokeStyles !== undefined) {
            for (const key in inputCaptionStyles.strokeStyles) {
                captionStrokeStyles[key] = inputCaptionStyles.strokeStyles[key];
            }
        }
        if (inputCaptionStyles.fillStyles !== undefined) {
            for (const key in inputCaptionStyles.fillStyles) {
                captionFillStyles[key] = inputCaptionStyles.fillStyles[key];
            }
        }
    }
  
    const inputTopicIconStyles = input_styles.topicIconStyles;
    if (inputTopicIconStyles !== undefined) {
        if (inputTopicIconStyles.textStyles !== undefined) {
            for (const key in inputTopicIconStyles.textStyles) {
                topicIconTextStyles[key] = inputTopicIconStyles.textStyles[key];
            }
        }
        if (inputTopicIconStyles.strokeStyles !== undefined) {
            for (const key in inputTopicIconStyles.strokeStyles) {
                topicIconStrokeStyles[key] = inputTopicIconStyles.strokeStyles[key];
            }
        }
        if (inputTopicIconStyles.fillStyles !== undefined) {
            for (const key in inputTopicIconStyles.fillStyles) {
                topicIconFillStyles[key] = inputTopicIconStyles.fillStyles[key];
            }
        }
        if (inputTopicIconStyles.iconStyles !== undefined) {
            for (const key in inputTopicIconStyles.iconStyles) {
                topicIconIconStyles[key] = inputTopicIconStyles.iconStyles[key];
            }
        }
    }
  
    const inputMarkStyles = input_styles.markStyles;
    if (inputMarkStyles !== undefined) {
        if (inputMarkStyles.textStyles !== undefined) {
            for (const key in inputMarkStyles.textStyles) {
                markTextStyles[key] = inputMarkStyles.textStyles[key];
            }
        }
        if (inputMarkStyles.strokeStyles !== undefined) {
            for (const key in inputMarkStyles.strokeStyles) {
                markStrokeStyles[key] = inputMarkStyles.strokeStyles[key];
            }
        }
        if (inputMarkStyles.fillStyles !== undefined) {
            for (const key in inputMarkStyles.fillStyles) {
                markFillStyles[key] = inputMarkStyles.fillStyles[key];
            }
        }
    }
  
  
    // axis styles
    let x_axis_styles = {
        // generic styles
        textStyles: axisTextStyles,
        strokeStyles: axisStrokeStyles,
        fillStyles: axisFillStyles,
        attachStyles: axisAttachStyles,
        
        // specific styles
        angle: 0,
        tickFace : 'clw',
        textFace : 'clw',
        tickInnerLength : 5,
        tickOuterLength : 0,
        tickNumber : 3,
  
        titleFace : 'clw',
        titleTextOrient : 'horizontal',
        titleAlign : 'middle',
        titleRelativePos : 'middle',
    };
  
    let y_axis_styles = {
        // generic styles
        textStyles: axisTextStyles,
        strokeStyles: axisStrokeStyles,
        fillStyles: axisFillStyles,
        
        // specific styles
        angle: 90,
        tickFace : 'cclw',
        textFace : 'cclw',
        tickInnerLength : 5,
        tickOuterLength : 0,
        tickNumber : 3,
  
        titleFace : 'cclw',
        titleTextOrient : 'horizontal',
        titleAlign : 'middle',
        titleRelativePos : 'middle',
    };
    if (input_styles.x_axis_styles !== undefined) {
        if (input_styles.x_axis_styles.angle !== undefined) {
            x_axis_styles.angle = input_styles.x_axis_styles.angle;
        }
    }
    if (input_styles.y_axis_styles !== undefined) {
        if (input_styles.y_axis_styles.angle !== undefined) {
            y_axis_styles.angle = input_styles.y_axis_styles.angle;
        }
    }
  
    
    const faceConfig = {
        '0,90': { x: 'clw', y: 'cclw' },
        '0,-90': { x: 'cclw', y: 'clw' },
        '90,0': { x: 'cclw', y: 'clw' },
        '90,180': { x: 'clw', y: 'cclw' },
        '-90,0': { x: 'clw', y: 'cclw' },
        '-90,180': { x: 'cclw', y: 'clw' },
        '180,90': { x: 'cclw', y: 'clw' },
        '180,-90': { x: 'clw', y: 'cclw' }
    };
    const config = faceConfig[`${x_axis_styles.angle},${y_axis_styles.angle}`];
    
    let mark_styles = {
        textStyles: markTextStyles,
        strokeStyles: markStrokeStyles,
        fillStyles: markFillStyles,
        attachStyles: markAttachStyles,
        annotateStyles: markAnnotateStyles,
    };
  
    let title_styles = {
        textStyles: titleTextStyles,
        strokeStyles: titleStrokeStyles,
        fillStyles: titleFillStyles,
        iconStyles: titleIconStyles
    };
    let caption_styles = {
        textStyles: captionTextStyles,
        strokeStyles: captionStrokeStyles,
        fillStyles: captionFillStyles
    };
  
    let topic_icon_styles = {
        textStyles: topicIconTextStyles,
        strokeStyles: topicIconStrokeStyles,
        fillStyles: topicIconFillStyles,
        iconStyles: topicIconIconStyles
    };
  
    
    if (config) {
        x_axis_styles.tickFace = config.x;
        x_axis_styles.textFace = config.x;
        x_axis_styles.titleFace = config.x;
    
        y_axis_styles.tickFace = config.y;
        y_axis_styles.textFace = config.y;
        y_axis_styles.titleFace = config.y;
    }
    if (input_styles.x_axis_styles !== undefined) {
        for (const key in input_styles.x_axis_styles) {
            x_axis_styles[key] = input_styles.x_axis_styles[key];
        }
    }
    if (input_styles.y_axis_styles !== undefined) {
        for (const key in input_styles.y_axis_styles) {
            y_axis_styles[key] = input_styles.y_axis_styles[key];
        }
    }
  
    var piechart_styles ={
        totalAngle: Math.PI*2,
        startAngle: 0,
        innerRadius: 50,
        outerRadius: 200,
        marginAngle: Math.PI*2/72
    }
  
    styles = {
        x_axis_styles: x_axis_styles,
        y_axis_styles: y_axis_styles,
        mark_styles: mark_styles,
        attachStyles: attachStyles,
  
        titleStyles: title_styles,
        captionStyles: caption_styles,
        topicIconStyles: topic_icon_styles,
        annotation_styles: [],
  
        annotate_data: false,
  
        piechart_styles: piechart_styles
    };
  
    // console.log("input_styles", input_styles);
    if (input_styles.show_legend !== undefined) {
      styles.show_legend = input_styles.show_legend;
    }
    if (input_styles.annotate_data !== undefined) {
      styles.annotate_data = input_styles.annotate_data;
    }
  
    var scale_factor = 1;
    var numberData = data.length;
    console.log('data',data);
    console.log(numberData);
    // numberData (3,10) ~ scale_factor (1, 2) with 0.1 random noise
  
    scale_factor = (numberData-3)/7 + 1 + (Math.random()*0.1-0.05);
    var height = 600;
    var width = 600;
    console.log(scale_factor)
    if (styles.y_axis_styles.angle===0 || styles.y_axis_styles.angle===180){
      height = 600*scale_factor;
    }
    else {
      width = 600*scale_factor;
    }
    console.log(height, width);
    return [meta_data, data, styles, width, height];
  }
  

export { setDefaultStyles };