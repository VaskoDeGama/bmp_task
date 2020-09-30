const fs = require('fs').promises
const path = require('path')
const { convert } = require('./convert')

/**
 * Read, convert and save file
 * @returns {Promise<void>}
 */
const main = async () => {
  const [inputArg, outputArg] = process.argv.splice(2, 2)
  const inputFile = path.parse(inputArg)
  const outputFile = path.parse(outputArg)
  const inputPath = path.join(__dirname, '../', inputFile.dir, inputFile.base)
  const outputPath = path.join(__dirname, '../', outputFile.dir, outputFile.base)

  try {
    const inputBuffer = await fs.readFile(inputPath)
    const result = await convert(inputBuffer)

    await fs.writeFile(outputPath, result)
  } catch (e) {
    console.log(e)
  }
}

main()
