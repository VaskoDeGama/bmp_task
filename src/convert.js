const FILE_HEADER_SIZE = 14
/**
 *
 * @param fileHeaderBuff
 * @returns {{size: number, offset: number, type: string}}
 */
const decodeFileHeader = (fileHeaderBuff) => {
  return {
    type: fileHeaderBuff.slice(0, 2).toString(),
    size: fileHeaderBuff.readUInt16LE(2),
    offset: fileHeaderBuff.readUInt16LE(10)
  }
}

const decodeDIBHeader = (dibHeaderBuff) => {
  return {
    size: dibHeaderBuff.readUInt16LE(0),
    width: dibHeaderBuff.readUInt16LE(4),
    height: dibHeaderBuff.readUInt16LE(8),
    planes: dibHeaderBuff.readUInt16LE(12),
    bitsPerPixel: dibHeaderBuff.readUInt16LE(14),
    compression: dibHeaderBuff.readUInt16LE(16),
    imageSize: dibHeaderBuff.readUInt16LE(20),
    totalColors: dibHeaderBuff.readUInt16LE(32),
    importantColors: dibHeaderBuff.readUInt16LE(36)
  }
}

/**
 * Parse headers and imageData to object from rawData
 * @param rawData
 * @returns {{image: Buffer, dibHeader: {size: number, totalColors: number, bitsPerPixel: number, width: number, planes: number, importantColors: number, imageSize: number, compression: number, height: number}, fileHeader: {size: number, offset: number, type: string}}}
 */
const decode = (rawData) => {
  const fileHeader = decodeFileHeader(rawData.slice(0, FILE_HEADER_SIZE))

  const dibHeaderSize = rawData.readUInt16LE(14)

  const dibHeader = decodeDIBHeader(rawData.slice(FILE_HEADER_SIZE, dibHeaderSize))

  const image = rawData.subarray(fileHeader.offset, dibHeader.imageSize + fileHeader.offset)

  rawData.copy(image, 0, fileHeader.offset, fileHeader.size)

  return {
    fileHeader,
    dibHeader,
    image

  }
}

/**
 *  Reverse row
 * @param row
 * @returns {*}
 */
const flipRow = (row) => {
  const pixel = Buffer.alloc(3)

  for (let i = 0, j = row.length; (i < row.length / 2) && (j > row.length / 2); i += 3, j -= 3) {
    row.copy(pixel, 0, j - 3, j)
    row.copy(row, j - 3, i, i + 3)
    pixel.copy(row, i, 0, 3)
  }

  return row
}

/**
 * Vertically reflect image data
 * @param data
 * @param rowSize
 * @param rows
 * @returns {*|void|Promise<string[]>|this|Uint8Array|this|Uint16Array|Int16Array|Float32Array|Uint8ClampedArray|Int32Array|Int8Array|Float64Array|this|any[]|Uint32Array}
 */

const verticallyReflect = (data, rowSize, rows) => {
  for (let i = 0; i < rows; i += 1) {
    flipRow(data.subarray(i * rowSize, (i + 1) * rowSize))
  }

  return data
}

/**
 * Main function
 * @param rawData
 * @returns {Promise<unknown>}
 */
const convert = (rawData) => {
  return new Promise((resolve, reject) => {
    try {
      const data = decode(rawData)

      const rowSize = data.image.length / data.dibHeader.height

      const resultBuffer = verticallyReflect(data.image, rowSize, data.dibHeader.height)

      const result = Buffer.alloc(rawData.length)

      rawData.copy(result, 0, 0, data.fileHeader.offset)
      resultBuffer.copy(result, data.fileHeader.offset, 0, data.image.length)

      resolve(result)
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  convert,
  flipRow
}
