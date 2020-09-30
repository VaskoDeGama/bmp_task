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
 * Vertically reflect image data
 * @param data
 * @param rowSize
 * @param rows
 * @returns {*|void|Promise<string[]>|this|Uint8Array|this|Uint16Array|Int16Array|Float32Array|Uint8ClampedArray|Int32Array|Int8Array|Float64Array|this|any[]|Uint32Array}
 */

const verticallyReflect = (data, rowSize, rows) => {
  const temp = []

  for (let i = 0; i < rows; i += 1) {
    const buf = Buffer.alloc(rowSize)
    const row = data.slice((i * rowSize), (i + 1) * rowSize)

    for (let j = 0; j < rowSize; j += 3) {
      const pixel = row.slice(j, j + 3)

      buf.write(pixel.toString('hex'), rowSize - j - 3, 3, 'hex')
    }

    temp.push(buf)
  }

  return Buffer.concat(temp, data.length)
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

module.exports = convert
