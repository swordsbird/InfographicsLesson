// 元素类型常量
const ELEMENT_TYPES = {
    BOUNDING_BOX: 'boundingBox',
    TEXT: 'text',
    PICTOGRAM: 'pictogram',
    OTHER: 'other',
    CIRCLE: 'circle'
  };
  
const SHORT_ELEMENT_TYPES = {
  [ELEMENT_TYPES.BOUNDING_BOX]: 'BB',
  [ELEMENT_TYPES.TEXT]: 'TEXT',
  [ELEMENT_TYPES.PICTOGRAM]: 'ICON',
  [ELEMENT_TYPES.OTHER]: 'OTHER',
  [ELEMENT_TYPES.CIRCLE]: 'CIRCLE'
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

// 添加新的 getBoxStyle 函数
const getBoxStyle = (element, selectedElementId) => {
  const elementId = element.id;
  const isSelected = selectedElementId.value === elementId;
  const boxStyle = getBoxType(element.type);
  
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    border: isSelected 
      ? `4px solid ${boxStyle.border.split(' ')[2]}`
      : boxStyle.border,
    backgroundColor: isSelected
      ? boxStyle.backgroundColor.replace('0.1', '0.4')
      : boxStyle.backgroundColor,
    // pointerEvents: 'none', // 确保box不会干扰元素的交互
    position: 'absolute',
  };
}

// 定义可能的样式配置
const boxStyles = [
  {
    // 蓝色框 - boundingbox
    border: '2px solid #1E88E5',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    labelColor: '#FFFFFF',
    labelBgColor: '#1E88E5',
  },
  {
    // 橙色框 - textbox
    border: '2px solid #F4511E',
    backgroundColor: 'rgba(244, 81, 30, 0.1)', 
    labelColor: '#FFFFFF',
    labelBgColor: '#F4511E',
  },
  {
    // 绿色框 - pictogrambox
    border: '2px solid #43A047',
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    labelColor: '#FFFFFF', 
    labelBgColor: '#43A047',
  },
  {
    // 黄色框 - other box
    border: '2px solid #FDD835',
    backgroundColor: 'rgba(253, 216, 53, 0.1)',
    labelColor: '#000000',
    labelBgColor: '#FDD835',
  }
];

const getBoxType = (type) => {
  if (type === ELEMENT_TYPES.BOUNDING_BOX) {
    return boxStyles[0];
  } else if (type === ELEMENT_TYPES.TEXT) {
    return boxStyles[1];
  } else if (type === ELEMENT_TYPES.PICTOGRAM) {
    return boxStyles[2];
  } else if (type === ELEMENT_TYPES.OTHER) {
    return boxStyles[3];
  }
  return boxStyles[0];
};

// 获取元素样式
const getElementStyle = (element, selectedElementId) => {
  const elementId = element.id;
  // console.log("selectedElementId", selectedElementId);
  // const isSelected = selectedElementId.value === elementId;
  
  // 基础样式，移除边框和背景相关样式
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
  };
};

// 创建圆形的函数
const createCircle = ({ x, y, radius, index, isNegative = false }) => ({
  id: `circle_${index}`,
  type: ELEMENT_TYPES.CIRCLE,
  x: x - radius,
  y: y - radius,
  width: radius * 2,
  height: radius * 2,
  isNegative
});

export { createBaseElement, createTextElement, createPictogramElement, createBoundingBox, ELEMENT_TYPES, SHORT_ELEMENT_TYPES, getShortId, getBoxStyle, getBoxType , getElementStyle, createCircle };