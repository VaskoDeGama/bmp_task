const FILE_HEADER_SIZE = 14

/**
 * Decode bmp file header
 * @param {Buffer} fileHeaderBuff - the first 14 bytes of the input buffer
 * @returns {Object} {{size: number, offset: number, type: string}} decoded file header
 */
const decodeFileHeader = (fileHeaderBuff) => {
  return {
    type: fileHeaderBuff.slice(0, 2).toString(),
    size: fileHeaderBuff.readUInt32LE(2),
    offset: fileHeaderBuff.readUInt32LE(10)
  }
}

/**
 * * Decode dibHeader
 * @param {Buffer} dibHeaderBuff - 40 to 128 bytes input buffer with offset 14
 * @returns {Object} {{size: number, totalColors: number, bitsPerPixel: number, width: number, planes: number, importantColors: number, imageSize: number, compression: number, height: number}}
 */
const decodeDIBHeader = (dibHeaderBuff) => {
  return {
    size: dibHeaderBuff.readUInt32LE(0),
    width: dibHeaderBuff.readUInt32LE(4),
    height: dibHeaderBuff.readUInt32LE(8),
    planes: dibHeaderBuff.readUInt32LE(12),
    bitsPerPixel: dibHeaderBuff.readUInt32LE(14),
    compression: dibHeaderBuff.readUInt32LE(16),
    imageSize: dibHeaderBuff.readUInt32LE(20),
    totalColors: dibHeaderBuff.readUInt32LE(32),
    importantColors: dibHeaderBuff.readUInt32LE(36)
  }
}

/**
 * Parse headers and imageData to object from rawData
 * @param {Buffer} rawData - read from file
 * @returns {Object} {{image: Buffer, dibHeader: {size: number, totalColors: number, bitsPerPixel: number, width: number, planes: number, importantColors: number, imageSize: number, compression: number, height: number}, fileHeader: {size: number, offset: number, type: string}}}
 */
const decode = (rawData) => {
  const fileHeader = decodeFileHeader(rawData.slice(0, FILE_HEADER_SIZE))

  const dibHeaderSize = rawData.readUInt32LE(14)
  const dibHeader = decodeDIBHeader(rawData.slice(FILE_HEADER_SIZE, dibHeaderSize))

  const image = rawData.slice(fileHeader.offset, dibHeader.imageSize + fileHeader.offset)

  return {
    fileHeader,
    dibHeader,
    image
  }
}

/**
 * Reverse row
 * @param {Buffer} row - buffer containing a string of pixels
 * @returns {Buffer} pixel array after transform
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
 * @param {Buffer} data - Pixel array from raw data
 * @param {Number} rowSize - length of one row
 * @param {Number} rows - number of row
 * @returns {Buffer}  pixel array from raw data after transform
 */
const verticallyReflect = (data, rowSize, rows) => {
  for (let i = 0; i < rows; i += 1) {
    const row = data.slice(i * rowSize, (i + 1) * rowSize)

    flipRow(row)
  }

  return data
}

/**
 * Main function
 * @async
 * @param {Buffer} rawData - data from file
 * @returns {Promise<{Buffer}>} resolve transformed buffer
 */
const convert = (rawData) => {
  return new Promise((resolve, reject) => {
    try {
      const data = decode(rawData)

      const rowSize = data.image.length / data.dibHeader.height

      console.time('verticallyReflect')
      verticallyReflect(data.image, rowSize, data.dibHeader.height)
      console.timeEnd('verticallyReflect')
      resolve(rawData)
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  convert,
  flipRow
}
