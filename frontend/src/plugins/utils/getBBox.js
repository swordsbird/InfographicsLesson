// This file provides a function to get the bounding box of many types of elements.

// const TextToSVG = require('text-to-svg');
// const textToSVG = TextToSVG.loadSync();
// import TextToSVG from 'text-to-svg';
// const textToSVG = TextToSVG.loadSync();
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// // 获取当前模块的文件路径
// const __filename = fileURLToPath(import.meta.url);
// // 获取当前模块的目录路径
// const __dirname = dirname(__filename);


// getBBox.js
async function parseTransform(transform) {
    if (!transform) return [1, 0, 0, 1, 0, 0];
    // 初始变换矩阵
    let matrix = [1, 0, 0, 1, 0, 0];
    let matrix2 = [1, 0, 0, 1, 0, 0];

    const translateMatches = [...transform.matchAll(/translate\(([^,]+),?([^)]+)?\)/g)];
    const rotateMatch = transform.match(/rotate\(([^,]+)(?:,\s*([^,]+),\s*([^,]+))?\)/);

    // console.log(translateMatches);
    if (translateMatches.length>1) {
        for (const translateMatch of translateMatches) {
            const tx = parseFloat(translateMatch[1]);
            const ty = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
            if (rotateMatch){
                matrix2[4] += tx; // 更新平移
                matrix2[5] += ty;
            }
            else{
                matrix[4] += tx; // 更新平移
                matrix[5] += ty;
            }
        }
    }
    else {
        // 匹配 translate
        const translateMatch = transform.match(/translate\(([^,]+),?([^)]+)?\)/);
        if (translateMatch) {
            const tx = parseFloat(translateMatch[1]);
            const ty = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
            if (rotateMatch){
                matrix2[4] += tx; // 更新平移
                matrix2[5] += ty;
            }
            else {
                matrix[4] += tx; // 更新平移
                matrix[5] += ty;
                // console.log("translate matrix", matrix);
            }
        }
    }
    
    // Match rotate with optional origin
    // const rotateMatch = transform.match(/rotate\(([^,\s]+)(?:,([^\s,]+),([^\s,]+))?\)/);
    // const rotateMatch1 = transform.match(/rotate\(([^)]+)\)/);
    // const rotateMatch = transform.match(/rotate\(([^,]+)(?:,\s*([^\s,]+),\s*([^\s,]+))?\)/);
    if (rotateMatch) {
        const angle = -parseFloat(rotateMatch[1]) * (Math.PI / 180); // Convert to radians
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Check for center of rotation
        let cx = rotateMatch[2] ? parseFloat(rotateMatch[2]) : 0;
        let cy = rotateMatch[3] ? parseFloat(rotateMatch[3]) : 0;
        // if there is any NaN value, set it to 0
        if (isNaN(cx) || isNaN(cy)) {
            cx = 0;
            cy = 0;
        }
        // console.log(rotateMatch);
        // console.log('cx:', cx, 'cy:', cy);
        if (cx !== 0 || cy !== 0) {
            matrix[0] = cos;
            matrix[1] = -sin;
            matrix[2] = sin;
            matrix[3] = cos;
            matrix[4] -= cx;
            matrix[5] -= cy;
            matrix2[4] += cx;
            matrix2[5] += cy;
            return [matrix, matrix2];
        }
        else{
            matrix[0] = cos;
            matrix[1] = -sin;
            matrix[2] = sin;
            matrix[3] = cos;
            // console.log('matrix:', matrix);
            return matrix;
        }
    }
    // else if (rotateMatch1) {
    //     const angle = -parseFloat(rotateMatch1[1]) * (Math.PI / 180); // Convert to radians
    //     const cos = Math.cos(angle);
    //     const sin = Math.sin(angle);
    //     // Check for center of rotation
    //     const cx = rotateMatch[2] ? parseFloat(rotateMatch[2]) : 0;
    //     const cy = rotateMatch[3] ? parseFloat(rotateMatch[3]) : 0;
    //     console.log('cx:', cx, 'cy:', cy);

    //     if (cx !== 0 || cy !== 0) {
    //         matrix[0] = cos;
    //         matrix[1] = -sin;
    //         matrix[2] = sin;
    //         matrix[3] = cos;
    //         matrix[4] -= cx;
    //         matrix[5] -= cy;
    //         var matrix2 = [1, 0, 0, 1, cx, cy];
    //         return [matrix, matrix2];
    //     }
    // }
    return matrix;
}
async function applyMatrix(x, y, matrix) {
    return [
        matrix[0] * (x + matrix[4]) + matrix[2] * (y + matrix[5]),
        matrix[1] * (x + matrix[4]) + matrix[3] * (y + matrix[5]) 
    ];
}
// 矩阵乘法
async function multiplyMatrices(a, b) {
    return [
        a[0] * b[0] + a[2] * b[1],  // m11
        a[1] * b[0] + a[3] * b[1],  // m12
        a[0] * b[2] + a[2] * b[3],  // m21
        a[1] * b[2] + a[3] * b[3],  // m22
        a[0] * b[4] + a[2] * b[5] + a[4],  // dx
        a[1] * b[4] + a[3] * b[5] + a[5]   // dy
    ];
}
async function combineMatrices(m1, m2) {
    return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
}

async function applyTransform(minX, minY, maxX, maxY, matrix) {
    const [nx1, ny1] = await applyMatrix(minX, minY, matrix);
    const [nx2, ny2] = await applyMatrix(maxX, maxY, matrix);
    const [nx3, ny3] = await applyMatrix(minX, maxY, matrix);
    const [nx4, ny4] = await applyMatrix(maxX, minY, matrix);
    // console.log('nx1:', nx1, 'ny1:', ny1, 'nx2:', nx2, 'ny2:', ny2);
    let newMinX = Math.min(nx1, nx2, nx3, nx4);
    let newMinY = Math.min(ny1, ny2, ny3, ny4);
    let newMaxX = Math.max(nx1, nx2, nx3, nx4);
    let newMaxY = Math.max(ny1, ny2, ny3, ny4);
    return { minX: newMinX, minY: newMinY, maxX: newMaxX, maxY: newMaxY };
}


// Helper function to parse the path commands from the 'd' attribute
async function parsePathCommands(d) {
    const commands = [];
    const regex = /([a-zA-Z])([^a-zA-Z]*)/g;
    let match;
    while ((match = regex.exec(d)) !== null) {
        const command = match[1];
        const points = match[2].trim().split(/[\s,]+/).map(parseFloat);
        commands.push({ command, points });
    }
    // console.log(commands);

    return commands;
}
// Helper function to calculate the bounding box for an elliptical arc
async function calculateArcBBox(x0, y0, arcParams) {
    let [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x1, y1] = arcParams;

    // Convert xAxisRotation from degrees to radians
    const phi = (xAxisRotation * Math.PI) / 180;

    // Compute the transformation needed for the ellipse (rotation and translation)
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // Calculate the mid-point between the start and end points of the arc
    const dx2 = (x0 - x1) / 2;
    const dy2 = (y0 - y1) / 2;

    // Apply the rotation transformation to the midpoint
    const xPrime = cosPhi * dx2 + sinPhi * dy2;
    const yPrime = -sinPhi * dx2 + cosPhi * dy2;

    // Compute the radii adjustments
    const rxSq = rx * rx;
    const rySq = ry * ry;
    const xPrimeSq = xPrime * xPrime;
    const yPrimeSq = yPrime * yPrime;

    // Ensure the radii are large enough
    const radiiCheck = xPrimeSq / rxSq + yPrimeSq / rySq;
    if (radiiCheck > 1) {
        const radiiScale = Math.sqrt(radiiCheck);
        rx *= radiiScale;
        ry *= radiiScale;
    }

    // Calculate the center of the ellipse
    const sign = largeArcFlag !== sweepFlag ? 1 : -1;
    const sq = ((rxSq * rySq) - (rxSq * yPrimeSq) - (rySq * xPrimeSq)) /
        ((rxSq * yPrimeSq) + (rySq * xPrimeSq));
    const coef = sign * Math.sqrt(Math.max(0, sq));

    const cxPrime = coef * (rx * yPrime) / ry;
    const cyPrime = coef * -(ry * xPrime) / rx;

    // Transform the center back
    const cx = cosPhi * cxPrime - sinPhi * cyPrime + (x0 + x1) / 2;
    const cy = sinPhi * cxPrime + cosPhi * cyPrime + (y0 + y1) / 2;

    // Compute the start and end angles
    const startVector = [(xPrime - cxPrime) / rx, (yPrime - cyPrime) / ry];
    const startAngle = Math.atan2(startVector[1], startVector[0]);

    const endVector = [(-xPrime - cxPrime) / rx, (-yPrime - cyPrime) / ry];
    const endAngle = Math.atan2(endVector[1], endVector[0]);

    // Calculate the bounding box of the arc
    const points = [
        ...await extremePointsForArc(rx, ry, cx, cy, startAngle, endAngle, phi)
    ];

    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));

    return { minX, minY, maxX, maxY };
}

// Helper function to get extreme points of an elliptical arc
async function extremePointsForArc(rx, ry, cx, cy, startAngle, endAngle, rotation) {
    const points = [];
    // console.log('startAngle:', startAngle, 'endAngle:', endAngle);

    // Add start and end points
    points.push({ x: cx + rx * Math.cos(startAngle), y: cy + ry * Math.sin(startAngle) });
    points.push({ x: cx + rx * Math.cos(endAngle), y: cy + ry * Math.sin(endAngle) });

    // Add extreme points at 0, 90, 180, 270 degrees in the ellipse's frame
    for (let angle = 0; angle < 360; angle += 90) {
        const angleInRadians = (angle * Math.PI) / 180;
        const pointOnEllipse = {
            x: cx + rx * Math.cos(angleInRadians),
            y: cy + ry * Math.sin(angleInRadians)
        };

        if (angleInRadians >= startAngle && angleInRadians <= endAngle) {
            points.push(pointOnEllipse);
        }
    }
    // console.log('points:', points);
    return points;
}

// async function measureTextWidth(text, fontSize) {
//     if (typeof fontSize === 'string') {
//         fontSize = parseFloat(fontSize);
//     }
//     const options = { fontSize: fontSize, anchor: 'left top' };
//     const metrics = textToSVG.getMetrics(text, options);
//     return metrics.width;
// }
// async function measureTextHeight(text, fontSize) {
//     //如果fontSize是字符串，将其转换为数字
//     if (typeof fontSize === 'string') {
//         fontSize = parseFloat(fontSize);
//     }
//     const options = { fontSize: fontSize, anchor: 'left top' };
//     const metrics = textToSVG.getMetrics(text, options);
//     return metrics.height;
// }

async function measureTextWidth(text, fontSize) {
    if (typeof fontSize === 'string') {
        fontSize = parseFloat(fontSize);
    }

    // 创建一个离屏 canvas 元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // 设置字体大小
    context.font = `${fontSize}px sans-serif`;

    // 使用 measureText 获取文本宽度
    const metrics = context.measureText(text);
    return metrics.width;
}

async function measureTextHeight(text, fontSize) {
    if (typeof fontSize === 'string') {
        fontSize = parseFloat(fontSize);
    }

    // 创建一个离屏 canvas 元素
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // 设置字体大小
    context.font = `${fontSize}px sans-serif`;

    // 使用 measureText 获取文本高度
    const metrics = context.measureText(text);
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    return height;
}

async function getBBoxGroup(element, parentTextAnchor=null, parentFontSize=null, drawSvg=null) {
    const d3 = await import('d3');
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const tag = element.tagName;
    // console.log('tag:', tag);
    if (tag != 'g') {
        return;
    }
    let cur_g = d3.select(element);
    const transform = element.getAttribute('transform');
    const matrix = await parseTransform(transform);
    const textAnchor = element.getAttribute('text-anchor') || parentTextAnchor;
    const fontSize = parseFloat(element.getAttribute('font-size')) || parentFontSize;
    const childBBoxes = await Promise.all(
        Array.from(element.children).map(async (child) => {
            const childTag = child.tagName;
            let childBBox = null;
            if (childTag === 'g') {
                childBBox = await getBBoxGroup(child, textAnchor, fontSize, drawSvg);
            } else if (childTag === 'rect') {
                childBBox = await getBBoxRect(child);
            } else if (childTag === 'circle') {
                childBBox = await getBBoxCircle(child);
            } else if (childTag === 'path') {
                childBBox = await getBBoxPath(child);
            } else if (childTag === 'line') {
                childBBox = await getBBoxLine(child);
            } else if (childTag === 'text') {
                childBBox = await getBBoxText(child, textAnchor, fontSize, drawSvg);
            } else if (childTag === 'image') {
                childBBox = await getBBoxImage(child);
            }
            if (childBBox) {
                if(childTag === 'text'){
                    // console.log('text:', child.textContent);
                    // console.log('tag:', childTag, 'childBBox:', childBBox);
                    // console.log('transform:', transform);
                    // console.log('matrix:', matrix);
                }
                // console.log('textAnchor:', textAnchor);
                if (childTag === 'text') {
                    // cur_g.append('rect')
                    //     .attr('x', childBBox.minX)
                    //     .attr('y', childBBox.minY)
                    //     .attr('width', childBBox.maxX - childBBox.minX)
                    //     .attr('height', childBBox.maxY - childBBox.minY)
                    //     .attr('fill', 'none')
                    //     .attr('stroke', 'red');
                }
                // applyTransform
                // 判断如果matrix是否是长度为2的数组
                if (matrix.length === 2) {
                    //如果是，则进行两次变换
                    let matrix0 = matrix[0];
                    let matrix1 = matrix[1];
                    const newBBox = await applyTransform(childBBox.minX, childBBox.minY, childBBox.maxX, childBBox.maxY, matrix0);
                    const newBBox2 = await applyTransform(newBBox.minX, newBBox.minY, newBBox.maxX, newBBox.maxY, matrix1);
                    return newBBox2;
                }
                else{
                    const newBBox = await applyTransform(childBBox.minX, childBBox.minY, childBBox.maxX, childBBox.maxY, matrix);
                    return newBBox;
                }
            }
        })
    );
    // console.log('childBBoxes:', childBBoxes);
    await Promise.all(
        childBBoxes.map(async (childBBox) => {
            if (childBBox) {
                // console.log('childBBox:', childBBox);
                minX = Math.min(minX, childBBox.minX);
                minY = Math.min(minY, childBBox.minY);
                maxX = Math.max(maxX, childBBox.maxX);
                maxY = Math.max(maxY, childBBox.maxY);
                // drawSvg.append('rect')
                //     .attr('x', childBBox.minX)
                //     .attr('y', childBBox.minY)
                //     .attr('width', childBBox.maxX - childBBox.minX)
                //     .attr('height', childBBox.maxY - childBBox.minY)
                //     .attr('fill', 'none')
                //     .attr('stroke', 'red');
            }
        })
    );

    return { minX, minY, maxX, maxY };
}


async function getBBoxRect(rectElement) {
    const transform = rectElement.getAttribute('transform');
    const matrix = await parseTransform(transform);
    const x = parseFloat(rectElement.getAttribute('x') || 0);
    const y = parseFloat(rectElement.getAttribute('y') || 0);
    const w = parseFloat(rectElement.getAttribute('width') || 0);
    const h = parseFloat(rectElement.getAttribute('height') || 0);
    // const newBBox = applyTransform(x, y, x + w, y + h, matrix);
    if (matrix.length === 2) {
        //如果是，则进行两次变换
        let matrix0 = matrix[0];
        let matrix1 = matrix[1];
        const newBBox = await applyTransform(x, y, x + w, y + h, matrix0);
        const newBBox2 = await applyTransform(newBBox.minX, newBBox.minY, newBBox.maxX, newBBox.maxY, matrix1);
        return newBBox2;
    }
    else{
        const newBBox = await applyTransform(x, y, x + w, y + h, matrix);
        return newBBox;
    }
}

async function getBBoxImage(imageElement) {
    // exactly the same as getBBoxRect
    const transform = imageElement.getAttribute('transform');
    const matrix = await parseTransform(transform);
    const x = parseFloat(imageElement.getAttribute('x') || 0);
    const y = parseFloat(imageElement.getAttribute('y') || 0);
    const w = parseFloat(imageElement.getAttribute('width') || 0);
    const h = parseFloat(imageElement.getAttribute('height') || 0);
    // const newBBox = applyTransform(x, y, x + w, y + h, matrix);
    if (matrix.length === 2) {
        //如果是，则进行两次变换
        let matrix0 = matrix[0];
        let matrix1 = matrix[1];
        const newBBox = await applyTransform(x, y, x + w, y + h, matrix0);
        const newBBox2 = await applyTransform(newBBox.minX, newBBox.minY, newBBox.maxX, newBBox.maxY, matrix1);
        return newBBox2;
    }
    else{
        const newBBox = await applyTransform(x, y, x + w, y + h, matrix);
        return newBBox;
    }
}


async function getBBoxCircle(circleElement) {
    const transform = circleElement.getAttribute('transform');
    const matrix = await parseTransform(transform);
    const cx = parseFloat(circleElement.getAttribute('cx') || 0);
    const cy = parseFloat(circleElement.getAttribute('cy') || 0);
    const r = parseFloat(circleElement.getAttribute('r') || 0);
    // const newBBox = applyTransform(cx - r, cy - r, cx + r, cy + r, matrix);
    if (matrix.length === 2) {
        //如果是，则进行两次变换
        let matrix0 = matrix[0];
        let matrix1 = matrix[1];
        const newBBox = await applyTransform(cx - r, cy - r, cx + r, cy + r, matrix0);
        const newBBox2 = await applyTransform(newBBox.minX, newBBox.minY, newBBox.maxX, newBBox.maxY, matrix1);
        return newBBox2;
    }
    else{
        const newBBox = await applyTransform(cx - r, cy - r, cx + r, cy + r, matrix);
        return newBBox;
    }
    return newBBox;
}

async function getBBoxLine(lineElement) {
    const transform = lineElement.getAttribute('transform');
    const matrix = await parseTransform(transform);
    const x1 = parseFloat(lineElement.getAttribute('x1') || 0);
    const y1 = parseFloat(lineElement.getAttribute('y1') || 0);
    const x2 = parseFloat(lineElement.getAttribute('x2') || 0);
    const y2 = parseFloat(lineElement.getAttribute('y2') || 0);
    // const newBBox = applyTransform(x1, y1, x2, y2, matrix);
    if (matrix.length === 2) {
        //如果是，则进行两次变换
        let matrix0 = matrix[0];
        let matrix1 = matrix[1];
        const newBBox = await applyTransform(x1, y1, x2, y2, matrix0);
        const newBBox2 = await applyTransform(newBBox.minX, newBBox.minY, newBBox.maxX, newBBox.maxY, matrix1);
        return newBBox2;
    }
    else{
        const newBBox = await applyTransform(x1, y1, x2, y2, matrix);
        return newBBox;
    }
    return newBBox;
}
function parseLength(value, fontSize) {
    if (!value) return 0;
    if (value.endsWith('px')) {
        return parseFloat(value);
    } else if (value.endsWith('em')) {
        return parseFloat(value) * fontSize;
    }
    return parseFloat(value); // Default to number if no unit
}
async function getBBoxText(textElement, parentTextAnchor, parentFontSize, svg=null) {
    const textContent = textElement.textContent;
    const fontSize = parseFloat(textElement.getAttribute('font-size')) || parentFontSize;
    const textAnchor = textElement.getAttribute('text-anchor') || parentTextAnchor;
    const textWidth = await measureTextWidth(textContent, fontSize);
    const textHeight = await measureTextHeight(textContent, fontSize);
    const transform = textElement.getAttribute('transform');
    const matrix = await parseTransform(transform);

    const x = parseFloat(textElement.getAttribute('x') || 0);
    const y = parseFloat(textElement.getAttribute('y') || 0);

    const dx = parseLength(textElement.getAttribute('dx'), fontSize);
    const dy = parseLength(textElement.getAttribute('dy'), fontSize);

    let adjustedX = x + dx;
    let adjustedY = y + dy;
    // console.log('textContent:', textContent, 'textAnchor:', textAnchor);
    // console.log('dx:', dx, 'dy:', dy);
    // console.log('textContent:', textContent,'transform:', transform, 'textAnchor:', textAnchor);
    // console.log('matrix:', matrix);

    if (textAnchor === 'start' || textAnchor === 'undefined' || textAnchor === null) {
        adjustedX = x;
    }
    if (textAnchor === 'middle') {
        adjustedX = x - textWidth / 2;
    } else if (textAnchor === 'end') {
        adjustedX = x - textWidth;
    }
    adjustedY = adjustedY - textHeight;
    if (matrix.length === 2) {
        //如果是，则进行两次变换
        let matrix0 = matrix[0];
        let matrix1 = matrix[1];
        const newBBox = await applyTransform(adjustedX, adjustedY, adjustedX + textWidth, adjustedY + textHeight, matrix0);
        // const newBBox2 = newBBox;
        // console.log('newBBox:', newBBox);
        const newBBox2 = await applyTransform(newBBox.minX, newBBox.minY, newBBox.maxX, newBBox.maxY, matrix1);
        return newBBox2;
    }
    else{
        const newBBox = await applyTransform(adjustedX, adjustedY, adjustedX + textWidth, adjustedY + textHeight, matrix);
        return newBBox;
    }
    // Note 1030: boundingbox不准确。
    // console.log('svg:', svg);

    return newBBox;
} 
    


async function getBBoxPath(pathElement) {
    const transform = pathElement.getAttribute('transform');
    const matrix = await parseTransform(transform);
    const d = pathElement.getAttribute('d');
    const commands = await parsePathCommands(d);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const results = await Promise.all(
        commands.map(async (cmd) => {
            const { command, points } = cmd;
            let localMinX = minX;
            let localMinY = minY;
            let localMaxX = maxX;
            let localMaxY = maxY;
            let currentX = 0; // 初始化 currentX
            let currentY = 0; // 初始化 currentY
    
            switch (command) {
                case 'M': // Move to
                case 'L': // Line to
                    currentX = points[0];
                    currentY = points[1];
                    break;
                case 'H': // Horizontal line to
                    currentX = points[0];
                    break;
            
                case 'V': // Vertical line to
                    currentY = points[0];
                    break;
                case 'C': // Cubic Bézier curve
                    currentX = points[4];
                    currentY = points[5];
                    break;
                case 'A': // Elliptical arc
                    const arcBBox = await calculateArcBBox(currentX, currentY, points);
                    localMinX = Math.min(localMinX, arcBBox.minX);
                    localMinY = Math.min(localMinY, arcBBox.minY);
                    localMaxX = Math.max(localMaxX, arcBBox.maxX);
                    localMaxY = Math.max(localMaxY, arcBBox.maxY);
                    currentX = points[5]; // Final endpoint of the arc (x)
                    currentY = points[6]; // Final endpoint of the arc (y)
                    break;
                case 'Z': // Close path (optional)
                    break;
                default:
                    break;
            }
    
            // 更新 min/max 变量
            localMinX = Math.min(localMinX, currentX);
            localMinY = Math.min(localMinY, currentY);
            localMaxX = Math.max(localMaxX, currentX);
            localMaxY = Math.max(localMaxY, currentY);
    
            return { localMinX, localMinY, localMaxX, localMaxY };
        })
    );
    
    // 处理所有返回的局部 min/max
    results.forEach(({ localMinX, localMinY, localMaxX, localMaxY }) => {
        minX = Math.min(minX, localMinX);
        minY = Math.min(minY, localMinY);
        maxX = Math.max(maxX, localMaxX);
        maxY = Math.max(maxY, localMaxY);
    });
    const newBBox = applyTransform(minX, minY, maxX, maxY, matrix);
    return newBBox;
}

// 检查两个边界框是否重叠
async function checkOverlap(bboxA, bboxB) {
    var checkMargin = 10;
    // return !(bboxA.maxX < bboxB.minX || bboxA.minX > bboxB.maxX ||
            //  bboxA.maxY < bboxB.minY || bboxA.minY > bboxB.maxY);
    return !(bboxA.maxX + checkMargin < bboxB.minX || bboxA.minX - checkMargin > bboxB.maxX ||
             bboxA.maxY + checkMargin < bboxB.minY || bboxA.minY - checkMargin > bboxB.maxY);
    }

// // 计算在 x 和 y 方向上避免重叠的最小移动距离
// async function calculateMinimumMovement(bboxA, bboxB, xDir=null, yDir=null) {

//     if (!await checkOverlap(bboxA, bboxB)) {
//         return { x: 0, y: 0 }; // 如果没有重叠，返回零值
//     }
//     let moveX = 0;
//     let moveY = 0;

//     // 计算 x 方向的移动
//     if (bboxA.maxX > bboxB.minX && bboxA.minX < bboxB.minX) {
//         // A 在 B 的右侧，需要向左移动
//         moveX = bboxA.maxX - bboxB.minX;
//     } else if (bboxA.minX < bboxB.maxX && bboxA.maxX > bboxB.maxX) {
//         // A 在 B 的左侧，需要向右移动
//         moveX = bboxB.maxX - bboxA.minX;
//     }

//     // 计算 y 方向的移动
//     if (bboxA.maxY > bboxB.minY && bboxA.minY < bboxB.minY) {
//         // A 在 B 的下方，需要向上移动
//         moveY = bboxA.maxY - bboxB.minY;
//     } else if (bboxA.minY < bboxB.maxY && bboxA.maxY > bboxB.maxY) {
//         // A 在 B 的上方，需要向下移动
//         moveY = bboxB.maxY - bboxA.minY;
//     }
//     // 返回在 x 和 y 方向上的最小移动距离
//     return { x: moveX, y: moveY };
// }

async function calculateMinimumMovement(bboxA, bboxB, directionX = null, directionY = null) {
    if (!await checkOverlap(bboxA, bboxB)) {
        return { x: 0, y: 0 }; // If no overlap, return zero values
    }

    let moveX = 0;
    let moveY = 0;
    var checkMargin = 10;

    // Calculate x-direction movement
    if (directionX === 'left' || (directionX === null && bboxA.maxX > bboxB.minX && bboxA.minX < bboxB.minX)) {
        moveX = bboxA.minX - bboxB.maxX;
    } else if (directionX === 'right' || (directionX === null && bboxA.minX < bboxB.maxX && bboxA.maxX > bboxB.maxX)) {
        moveX = bboxB.minX - bboxA.maxX;
    }

    // Calculate y-direction movement
    if (directionY === 'down' || (directionY === null && bboxA.maxY > bboxB.minY && bboxA.minY < bboxB.minY)) {
        moveY = bboxA.maxY - bboxB.minY;
    } else if (directionY === 'up' || (directionY === null && bboxA.minY < bboxB.maxY && bboxA.maxY > bboxB.maxY)) {
        moveY = bboxB.maxY - bboxA.minY;
    }

    // Return the minimum movement distances in specified directions
    return { x: moveX, y: moveY };
}


// module.exports = { getBBoxGroup, getBBoxRect, getBBoxCircle, getBBoxText, getBBoxPath, parseTransform, combineMatrices, applyMatrix, applyTransform, parsePathCommands, calculateArcBBox, extremePointsForArc, measureTextWidth, measureTextHeight, checkOverlap, calculateMinimumMovement };

export { getBBoxGroup, getBBoxRect, getBBoxCircle, getBBoxText, getBBoxPath, parseTransform, combineMatrices, applyMatrix, applyTransform, parsePathCommands, calculateArcBBox, extremePointsForArc, measureTextWidth, measureTextHeight, checkOverlap, calculateMinimumMovement };