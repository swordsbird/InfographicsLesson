
// const sharp = require('sharp');
// const bgColor = { r: 255, g: 255, b: 255 };
// const path = require('path');
import sharp from 'sharp';
import path from 'path';
const bgColor = { r: 255, g: 255, b: 255 };


// Flood Fill算法封装
function floodFill(data, width, height, startX, startY, bgColor, visited){
    const pixelStack = [[startX, startY]];

    while (pixelStack.length > 0) {
        const [px, py] = pixelStack.pop();
        const idx = (py * width + px) * 4;

        // 检查是否越界以及是否已经访问过
        if (px < 0 || px >= width || py < 0 || py >= height || visited.has(`${px},${py}`)) {
            continue;
        }

        // 标记为已访问
        visited.add(`${px},${py}`);

        // 获取像素颜色
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // 如果是背景颜色 (白色)，将透明度设为0
        if (r === bgColor.r && g === bgColor.g && b === bgColor.b) {
            data[idx + 3] = 0; // 设置透明

            // 继续填充相邻像素
            pixelStack.push([px - 1, py]);
            pixelStack.push([px + 1, py]);
            pixelStack.push([px, py - 1]);
            pixelStack.push([px, py + 1]);
        }
    }
};

function clipCircle(data, cx, cy, r, width, height){
    for (let y = 0; y < height; y++){
        for (let x = 0; x < width; x++){
            var idx = (y * width + x) * 4;
            if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r){
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
                data[idx + 3] = 0;
            }
        }
    }
}

function clipRect(data, x, y, w, h, width, height){
    for (let i = 0; i < data.length; i += 4){
        let px = Math.floor(i / 4) % width;
        let py = Math.floor(i / 4 / width);
        if (px < x || px >= x + w || py < y || py >= y + h){
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
        }
    }
}


// 主图像处理逻辑封装
async function processImage(filepath, fillColor = null) {
    if (filepath[0] !== '/') {
        filepath = path.join("/data1/liduan/generation/chart/iconset/colored_icons_final", filepath);
    }
    try {
        const { data, info } = await sharp(filepath)
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true });

        const width = info.width;
        const height = info.height;
        const visited = new Set();

        // // 从图像的四个边缘执行Flood Fill
        // for (let x = 0; x < width; x++) {
        //     floodFill(data, width, height, x, 0, bgColor, visited);          // 顶边
        //     floodFill(data, width, height, x, height - 1, bgColor, visited); // 底边
        // }
        // for (let y = 0; y < height; y++) {
        //     floodFill(data, width, height, 0, y, bgColor, visited);          // 左边
        //     floodFill(data, width, height, width - 1, y, bgColor, visited);  // 右边
        // }

        // let minX = width, minY = height, maxX = 0, maxY = 0;

        // for (let y = 0; y < height; y++) {
        //     for (let x = 0; x < width; x++) {
        //         if (!visited.has(`${x},${y}`)) {
        //             minX = Math.min(minX, x);
        //             minY = Math.min(minY, y);
        //             maxX = Math.max(maxX, x);
        //             maxY = Math.max(maxY, y);
        //         }
        //     }
        // }

        // Crop and return the processed image
        if (filepath !== '/data1/liduan/generation/chart/iconset/colored_icons_final/pineapple/1917601.png') {
            clipCircle(data, width / 2, height / 2, Math.min(width, height) / 2, width, height);
        }
        const buffer = await sharp(data, { raw: { width, height, channels: 4 } })
            // .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
            .toFormat('png')
            .toBuffer({ resolveWithObject: true });
        return buffer;
    } catch (err) {
        console.error('图像处理时发生错误:', err);
        throw err; // 让调用者知道这里出错了
    }
}

async function Image2Base64(image) {
    const base64 = image.toString('base64');
    return `data:image/png;base64,${base64}`;
}

async function ImagePath2Base64(imagePath) {
    const image = await sharp(imagePath).toBuffer();
    return await Image2Base64(image);
}

// async function fillColor(image, color) {
//     let newcolor = color;
//     if (typeof color === 'string') {
//         // color is a hex string
//         newcolor = color.replace(/^#/, '').match(/.{1,2}/g).map(c => parseInt(c, 16));
//     }
//     console.log("fillColor", image, newcolor);
//     // image is already a buffer
//     let { data, info } = image;
//     const width = info.width;
//     const height = info.height;
//     console.log('width', width, 'height', height);
//     // data[0] = 3;
//     // change the color of the image
//     for (let i = 0; i < data.length; i += 4) {
//         if (data[i + 3] > 0 && data[i+3] !== undefined) {
//             // console.log("color", data[i], data[i + 1], data[i + 2], data[i + 3]);
//             data[i] = newcolor[0];
//             data[i + 1] = newcolor[1];
//             data[i + 2] = newcolor[2];
//         }
//     }
//     const buffer = await sharp(data, { raw: { width, height, channels: 4 } })
//             .toFormat('png')
//             .toBuffer({ resolveWithObject: true });

//     return buffer;
    
// }
//导出函数
// module.exports = { processImage , ImagePath2Base64, Image2Base64};

export { processImage, ImagePath2Base64, Image2Base64 };