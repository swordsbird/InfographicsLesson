import { InferenceSession, Tensor } from "onnxruntime-web"; 
export class SamAPI {
  constructor() {
    this.model = null;
    this.imageEmbedding = null;
  }

  async initialize() {
    try {
      // 加载ONNX模型
      const modelPath = '/model/sam_onnx_quantized_example.onnx';
      this.model = await InferenceSession.create(modelPath);
    } catch (error) {
      console.error('初始化SAM失败:', error);
      throw error;
    }
  }

  async setImageEmbedding(embeddingData) {
    try {
      // 将ArrayBuffer转换为适合模型使用的格式
      console.log("embeddingData", embeddingData);
      // embeddingdata 是一个[1, 256, 64, 64]的array
      this.imageEmbedding = embeddingData;
    } catch (error) {
      console.error('设置embedding失败:', error);
      throw error;
    }
  }

  async generateMask({imageHeight, imageWidth, clickPrompts=[], boxPrompts=[]}) {

    // 准备输入数据
    const input = await this.prepareInput(imageHeight, imageWidth, clickPrompts, boxPrompts);
    console.log("input", input);
    
    // 运行模型
    const output = await this.model.run(input);
    console.log("output", output);
    
    // 处理输出结果
    return this.processMask(output);
  }
  async prepareInput(imageHeight, imageWidth, clickPrompts, boxPrompts) {
    // 准备输入数据
    let point_coords = [];
    let point_labels = [];
    for (const prompt of clickPrompts) {
      point_coords.push([prompt.x, prompt.y]);
      point_labels.push(prompt.type);
    }

    let box_coords = [];
    for (const prompt of boxPrompts) {
      box_coords.push([prompt.x1, prompt.y1, prompt.x2, prompt.y2]);
    }
    const modelScale = await this.handleImageScale(imageHeight, imageWidth);
    const flatEmbedding = new Float32Array(this.imageEmbedding.flat(Infinity));
    let flatPointCoords = new Float32Array(point_coords.flat(Infinity));
    flatPointCoords = flatPointCoords.map(coord => coord * modelScale.samScale);

    const imageEmbeddingTensor = new Tensor('float32', flatEmbedding, [1, 256, 64, 64]);
    const point_coords_tensor = new Tensor('float32', flatPointCoords, [1, point_coords.length, 2]);
    const point_labels_tensor = new Tensor('float32', point_labels, [1, point_labels.length]);
    const box_coords_tensor = new Tensor('float32', box_coords, [box_coords.length, 4]);
    const imageSizeTensor = new Tensor('float32', [imageHeight, imageWidth], [2]);
    const maskInput = new Tensor(
        "float32",
        new Float32Array(256 * 256),
        [1, 1, 256, 256]
      );
    const hasMaskInput = new Tensor("float32", [0]);
    return {
      image_embeddings: imageEmbeddingTensor,
      point_coords: point_coords_tensor,
      point_labels: point_labels_tensor,
    //   box_coords: box_coords_tensor,
      orig_im_size: imageSizeTensor,
      mask_input: maskInput,
      has_mask_input: hasMaskInput
    }
  }


  // ... 其他辅助方法 ...

  async handleImageScale(originImageHeight, originImageWidth) {
    const scale = 1024 / Math.max(originImageHeight, originImageWidth);
    return {height: originImageHeight, width: originImageWidth, samScale: scale};
  }


  async getImageEmbedding(imageFile) {
    const backend_url = 'http://166.111.81.54:12145/embedding';
    // imageFile是一个rgb的array
    const response = await fetch(backend_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageFile
      })
    });
    const result = await response.json();
    console.log(result);
    console.log("result['embedding']", result['embedding']);
    this.setImageEmbedding(result['embedding']);
    return result['embedding'];
  }

  async processMask(output) {
    // 假设输出包含遮罩数据
    const masks = output.masks.data;
    console.log("masks", masks);
    // console.log("output", output);
    // const scores = output.scores.data;
    const lowResMasks = output.low_res_masks.data;

    // 创建 canvas 来绘制遮罩
    const canvas = document.createElement('canvas');
    canvas.width = output.masks.dims[3];
    canvas.height = output.masks.dims[2];
    const ctx = canvas.getContext('2d');
    console.log("canvas width, height", canvas.width, canvas.height);
    
    // 将遮罩数据绘制到 canvas
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    // 按正确的顺序遍历像素
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const maskIndex = x * canvas.height + y;  // mask中的索引
            const imageDataIndex = maskIndex * 4;  // imageData中的索引
            
            const alpha = masks[maskIndex] > 0 ? 128 : 0;  // 半透明遮罩
            imageData.data[imageDataIndex] = 64;     // R
            imageData.data[imageDataIndex + 1] = 224;  // G
            imageData.data[imageDataIndex + 2] = 208;  // B
            imageData.data[imageDataIndex + 3] = alpha;  // A
        }
    }
    ctx.putImageData(imageData, 0, 0);
    // 下载图片到本地
    const base64Image = canvas.toDataURL();
    return base64Image;
  }
} 