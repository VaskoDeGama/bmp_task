const fs = require('fs').promises
const path = require('path')
const { convert, flipRow } = require('./../src/convert')

describe('bmp convert', () => {
  test('convert well square file', async () => {
    const inputPath = path.join(__dirname, '../', 'assets/', 'input.bmp')
    const samplePath = path.join(__dirname, '../', 'dist/', '__tests___assets_output.bmp')
    const inputBuff = await fs.readFile(inputPath)
    const result = await convert(inputBuff)
    const sample = await fs.readFile(samplePath)

    expect(sample).toStrictEqual(result)
  })
  test('convert well square file', async () => {
    const inputPath = path.join(__dirname, '../', 'assets/', 'input.bmp')
    const samplePath = path.join(__dirname, '../', 'dist/', '__tests___assets_output.bmp')
    const inputBuff = await fs.readFile(inputPath)
    const result = await convert(inputBuff)
    const sample = await fs.readFile(samplePath)

    expect(sample).toStrictEqual(result)
  })
})

describe('flip row', () => {
  test('test row ', async () => {
    const testBuffer = Buffer.alloc(9, 'ffffffaaaaaabbbbbb', 'hex')
    const equalBuffer = Buffer.alloc(9, 'bbbbbbaaaaaaffffff', 'hex')
    const result = flipRow(testBuffer)

    console.log(testBuffer)
    console.log(result)
    expect(result).toStrictEqual(equalBuffer)
  })
  test('test row 2 ', async () => {
    const testBuffer = Buffer.from('ffffffaaaaaabbbbbbccccccdddddd', 'hex')
    const equalBuffer = Buffer.from('ddddddccccccbbbbbbaaaaaaffffff', 'hex')
    const result = flipRow(testBuffer)

    expect(result).toStrictEqual(equalBuffer)
  })
  test('test row 3 ', async () => {
    const testBuffer = Buffer.from('ffffffaaaaaabbbbbbccccccdddddd111111222222333333444444', 'hex')
    const equalBuffer = Buffer.from('444444333333222222111111ddddddccccccbbbbbbaaaaaaffffff', 'hex')
    const result = flipRow(testBuffer)

    expect(result).toStrictEqual(equalBuffer)
  })
})
