import axios from 'axios';

export const imageService = {
  /**
   * 上传图片并获取embedding
   * @param {File|Blob} imageFile - 图片文件
   * @returns {Promise<ArrayBuffer>} - embedding数据
   */
  async getImageEmbedding(imageFile) {
    let result;
    // Send POST request to segment API
    try {
      const response = await fetch(SEGMENT_BOX_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageArray
        })
      });
  
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
  
      result = await response.json();
      console.log('Segmentation result:', result);
    } catch (error) {
      console.error('Error calling segment API:', error);
      analyzing.value = false;
      return;
    }
  },
}; 