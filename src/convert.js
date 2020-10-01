const FILE_HEADER_SIZE = 14

/**
 * Parsed bmp file header
 * @typedef {Object} fileHeader
 * @property {number} size - The size of the BMP file in bytes
 * @property {number} offset - starting address, of the byte where the pixel array can be found
 * @property {string} type - same as BM in ASCII
 */

/**
 * Decode bmp file header
 * @param {Buffer} fileHeaderBuff - the first 14 bytes of the input buffer
 * @returns {fileHeader} decoded file header
 */
const decodeFileHeader = (fileHeaderBuff) => {
  const type = fileHeaderBuff.slice(0, 2).toString()

  if (type !== 'BM') {
    throw new Error('InvalidImageError')
  }

  return {
    type,
    size: fileHeaderBuff.readUInt32LE(2),
    offset: fileHeaderBuff.readUInt32LE(10)
  }
}
/**
 * Parsed bmp file dib header
 * @typedef {Object} dibHeader
 * @property {number} size - the size of this header, in bytes
 * @property {number} totalColors - the number of colors in the color palette, or 0 to default to 2n
 * @property {number} bitsPerPixel - the number of bits per pixel
 * @property {number} width - the bitmap width in pixels
 * @property {number} planes - the number of color planes, 1
 * @property {number} importantColors - the number of important colors used, or 0 when every color is important
 * @property {number} imageSize - the image size in bytes
 * @property {number} compression - the compression method being used
 * @property {number} height - the bitmap height in pixels
 */

/**
 * * Decode dibHeader
 * @param {Buffer} dibHeaderBuff - 40 to 128 bytes input buffer with offset 14
 * @returns {dibHeader} decoded dib header
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
 * Decoded data object
 * @typedef {Object} decodedData
 * @property {fileHeader} fileHeader - the image size in bytes
 * @property {dibHeader} dibHeader - the compression method being used
 * @property {Buffer} image - the bitmap height in pixels
 */

/**
 * Parse headers and imageData to object from rawData
 * @param {Buffer} rawData - read from file
 * @returns {decodedData} decoded data
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
 * @param {number} rowSize - length of one row
 * @param {number} rows - number of row
 * @param {number} fillingBytes - number of zero-filled bytes
 * @returns {Buffer}  pixel array from raw data after transform
 */
const verticallyReflect = (data, rowSize, rows, fillingBytes) => {
  for (let i = 0; i < rows; i += 1) {
    const row = data.slice(i * rowSize, (i + 1) * rowSize - fillingBytes)

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

      console.log(data)

      const rowSize = data.image.length / data.dibHeader.height
      const bytesInRow = data.dibHeader.height * 3
      const fillingBytes = bytesInRow % 4 ? rowSize - bytesInRow : 0

      console.log(rowSize, fillingBytes)
      console.time()
      verticallyReflect(data.image, rowSize, data.dibHeader.height, fillingBytes)
      console.timeEnd()

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
