

// 元素类型常量
const ELEMENT_TYPES = {
    BOUNDING_BOX: 'boundingBox',
    TEXT: 'text',
    PICTOGRAM: 'pictogram',
    OTHER: 'other'
  };
  
const SHORT_ELEMENT_TYPES = {
  [ELEMENT_TYPES.BOUNDING_BOX]: 'BB',
  [ELEMENT_TYPES.TEXT]: 'TEXT',
  [ELEMENT_TYPES.PICTOGRAM]: 'ICON',
  [ELEMENT_TYPES.OTHER]: 'OTHER'
};

const getShortId = () => {
  const timestamp = Date.now().toString(16).slice(-4);
  const random = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
  const xor = (parseInt(timestamp, 16) ^ parseInt(random, 16)).toString(16).toUpperCase().padStart(4, '0');
  return xor;
}
  
/**
 * 创建基础元素对象
 * @param {Object} params
 * @param {string} params.type - 元素类型 (boundingBox/text/pictogram/other)
 * @param {number} params.x - X坐标位置
 * @param {number} params.y - Y坐标位置
 * @param {number} params.width - 元素宽度
 * @param {number} params.height - 元素高度
 * @param {number} params.index - 元素索引
 * @param {Object} params.style - 样式对象
 * @returns {Object} 基础元素对象
 */
const createBaseElement = ({
    type,
    x,
    y,
    width,
    height,
    index,
    style = {}
  }) => ({
    id: `${SHORT_ELEMENT_TYPES[type]}-${getShortId()}`,
    type,
    x,
    y,
    width,
    height,
    index,
    style: {
      border: style.border || '2px solid #1E88E5',
      backgroundColor: style.backgroundColor || 'rgba(30, 136, 229, 0.1)',
      ...style
    }
  });
  
  /**
   * 创建文本元素
   * @param {Object} params
   * @param {number} params.x - X坐标位置
   * @param {number} params.y - Y坐标位置
   * @param {number} params.width - 元素宽度
   * @param {number} params.height - 元素高度
   * @param {number} params.index - 元素索引
   * @param {string} params.content - 文本内容
   * @param {Object} params.style - 文本样式对象
   * @param {string} [params.style.fontSize] - 字体大小
   * @param {string} [params.style.fontWeight] - 字体粗细
   * @param {string} [params.style.color] - 文本颜色
   * @returns {Object} 文本元素对象
   */
  const createTextElement = ({
    x,
    y,
    width = 200,
    height = 100,
    index,
    content = '',
    style = {}
  }) => ({
    ...createBaseElement({
      type: ELEMENT_TYPES.TEXT,
      x,
      y,
      width,
      height,
      index,
      style: {
        border: '2px solid #F4511E',
        backgroundColor: 'rgba(244, 81, 30, 0.1)',
        fontSize: '14px',
        fontWeight: 'normal',
        color: '#000000',
        ...style
      }
    }),
    content
  });
  
  /**
   * 创建图标元素
   * @param {Object} params
   * @param {number} params.x - X坐标位置
   * @param {number} params.y - Y坐标位置
   * @param {number} params.width - 元素宽度
   * @param {number} params.height - 元素高度
   * @param {number} params.index - 元素索引
   * @param {string} params.content - SVG内容
   * @param {Object} params.style - 样式对象
   * @returns {Object} 图标元素对象
   */
  const createPictogramElement = ({
    x,
    y,
    width = 100,
    height = 100,
    index,
    content = '',
    style = {}
  }) => ({
    ...createBaseElement({
      type: ELEMENT_TYPES.PICTOGRAM,
      x,
      y,
      width,
      height,
      index,
      style: {
        border: '2px solid #43A047',
        backgroundColor: 'rgba(67, 160, 71, 0.1)',
        ...style
      }
    }),
    content
  });
  
  /**
   * 创建边界框元素
   * @param {Object} params
   * @param {number} params.x - X坐标位置
   * @param {number} params.y - Y坐标位置
   * @param {number} params.width - 元素宽度
   * @param {number} params.height - 元素高度
   * @param {number} params.index - 元素索引
   * @param {Object} params.style - 样式对象
   * @returns {Object} 边界框元素对象
   */
  const createBoundingBox = ({
    x,
    y,
    width = 150,
    height = 150,
    index,
    style = {}
  }) => ({
    ...createBaseElement({
      type: ELEMENT_TYPES.BOUNDING_BOX,
      x,
      y,
      width,
      height,
      index,
      style: {
        border: '2px solid #1E88E5',
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        ...style
      }
  })
});

export { createBaseElement, createTextElement, createPictogramElement, createBoundingBox, ELEMENT_TYPES, SHORT_ELEMENT_TYPES };