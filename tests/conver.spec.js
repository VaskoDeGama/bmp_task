const fs = require('fs').promises
const path = require('path')
const convert = require('./../src/convert')

describe('bmp convert', () => {
  test('convert well be define', async () => {
    const inputPath = path.join(__dirname, '../', 'assets/', 'input.bmp')
    const samplePath = path.join(__dirname, '../', 'dist/', '__tests___assets_output.bmp')
    const inputBuff = await fs.readFile(inputPath)
    const result = await convert(inputBuff)
    const sample = await fs.readFile(samplePath)

    expect(sample).toStrictEqual(result)
  })
})
