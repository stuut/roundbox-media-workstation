// scripts/sync.js
const chokidar = require('chokidar')
const fs = require('fs-extra')
const path = require('path')

// Define the source of your assets and the destination in the public folder
const sourceDir = path.resolve(__dirname, './public/temp-images')
const publicDir = path.resolve(__dirname, './public/copied-images')

// Ensure the source directory exists
fs.ensureDirSync(sourceDir)

// A function to handle the file syncing
const syncFile = (filePath) => {
  const relativePath = path.relative(sourceDir, filePath)
  const destinationPath = path.join(publicDir, relativePath)
  console.log(`Syncing ${relativePath}...`)
  fs.copySync(filePath, destinationPath)
}

// A function to handle file deletion
const removeFile = (filePath) => {
  const relativePath = path.relative(sourceDir, filePath)
  const destinationPath = path.join(publicDir, relativePath)
  console.log(`Removing ${relativePath}...`)
  fs.removeSync(destinationPath)
}

// Check if we should be in watch mode
const watch = process.argv.includes('--watch')

// Perform an initial sync of all files
console.log(`Performing initial sync from ${sourceDir} to ${publicDir}...`)
fs.copySync(sourceDir, publicDir, { overwrite: true })
console.log('Initial sync complete.')

// If in watch mode, set up the file watcher
if (watch) {
  console.log('Watching for file changes...')
  const watcher = chokidar.watch(sourceDir, {
    persistent: true,
    ignoreInitial: true, // Don't fire "add" events on the initial scan
  })

  watcher
    .on('add', syncFile)
    .on('change', syncFile)
    .on('unlink', removeFile)
    .on('addDir', (dirPath) => {
      // Also sync new directories
      const relativePath = path.relative(sourceDir, dirPath)
      const destinationPath = path.join(publicDir, relativePath)
      fs.ensureDirSync(destinationPath)
    })
    .on('unlinkDir', (dirPath) => {
      // Also remove deleted directories
      const relativePath = path.relative(sourceDir, dirPath)
      const destinationPath = path.join(publicDir, relativePath)
      fs.removeSync(destinationPath)
    })
}
