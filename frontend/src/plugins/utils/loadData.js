export async function parseSpecification(spec) {
    const d3 = await import('d3');
    const {meta_data, data, input_styles} = spec;
    // 如果input_styles不为空
    if (input_styles !== undefined){
        // 遍历input_styles的字段
        for (let key in input_styles){
            let styles = input_styles[key];
            // 如果styles不为空
            if (styles !== undefined){
                // 遍历styles的字段
                for (let key in styles){
                    let sub_styles = styles[key];
                    // 如果sub_styles不为空
                    if (sub_styles !== undefined){
                        // 遍历sub_styles的字段
                        for (let key in sub_styles){
                            // 如果key以'Color'结尾
                            if (key.endsWith('Color')){
                                // 如果sub_styles[key]是数组
                                if (sub_styles[key] instanceof Array){
                                    // 将sub_styles[key]转换为hex color
                                    sub_styles[key] = '#'+sub_styles[key].map(c => c.toString(16).padStart(2, '0')).join('');
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    transformedData = data.map(d => ({
        x: d['x_data'],
        y: d['y_data'],
        // x_data_icon: d['x_data_icon']
        x_data_icon: typeof d['x_data_icon'] === 'string' ? d['x_data_icon'] : d['x_data_icon'][0],
        // convery [r, g, b] to hex color, 0->'00'
        color: d['color']?'#'+d['color'].map(c => c.toString(16).padStart(2, '0')).join(''):undefined,
        group: d['group']
    }));

    // List of available color scales in d3
    const colorSchemes = [
        d3.schemeObservable10,
        d3.schemeCategory10,
        d3.schemeAccent,
        d3.schemeDark2,
        d3.schemePaired,
        d3.schemePastel1,
        d3.schemePastel2,
        d3.schemeSet1,
        d3.schemeSet2,
        d3.schemeSet3,
        d3.schemeTableau10
    ];

    // Randomly select a color scale
    const randomColorScale = d3.scaleOrdinal(colorSchemes[Math.floor(Math.random() * colorSchemes.length)]);


    // // randomly select [3, min(10, data.length)] data
    // const maxCount = Math.min(10, transformedData.length);
    // const minCount = 3;
    // const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    // transformedData = transformedData.slice(0, count);
    // meta_data['topic_icon'] = meta_data['y_icon'][0];
    if (meta_data['y_color']!==undefined && meta_data['y_color'].length>1 && meta_data['y_color'][0] instanceof Array){
        for (let i = 0; i < meta_data['y_color'].length; i++){
            meta_data['y_color'][i] = '#'+meta_data['y_color'][i].map(c => c.toString(16).padStart(2, '0')).join('');
        }
        for (let i = 0; i < transformedData.length; i++){
            transformedData[i].color = meta_data['y_color'];
        }
    }
    else if (meta_data['y_color']===undefined && meta_data['y_label'].length>1){
        // meta_data['y_color'] = randomColorScale.domain(meta_data['y_label']);
        meta_data['y_color'] = [];
        for (let i = 0; i < meta_data['y_label'].length; i++){
            meta_data['y_color'].push(randomColorScale(meta_data['y_label'][i]));
        }

        // for (let i = 0; i < meta_data['y_color'].length; i++){
        //     meta_data['y_color'][i] = '#'+meta_data['y_color'][i].map(c => c.toString(16).padStart(2, '0')).join('');
        // }
        for (let i = 0; i < transformedData.length; i++){
            transformedData[i].color = meta_data['y_color'];
        }
    }

    let group_indicator = meta_data.group_indicator;
    // console.log("group_indicator", group_indicator);
    if (group_indicator !== undefined){
        for (let i = 0; i < transformedData.length; i++){
            transformedData[i].color = randomColorScale(transformedData[i].group);
            // console.log("transformedData[i].color", transformedData[i].color);
        }
        meta_data['group_color'] = {};
        for (let i = 0; i < group_indicator.length; i++){
            meta_data['group_color'][group_indicator[i]] = randomColorScale(group_indicator[i]);
        }
    }
    // // leave only 2 data
    // transformedData = transformedData.slice(0, 2);

    return [meta_data, transformedData, input_styles];
}
