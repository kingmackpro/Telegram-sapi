const db = require('./db');
const { uploadFile, downloadFileToPath, recover } = require('./engine');

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'upload') {
    if (!args[0]) throw new Error('Usage: node src/index.js upload <file-path>');
    const id = await uploadFile(args[0]);
    console.log(`FILE_ID=${id}`);
  } else if (command === 'download') {
    if (!args[0]) throw new Error('Usage: node src/index.js download <file-id> [output-path]');
    await downloadFileToPath(args[0], args[1]);
  } else if (command === 'status') {
    const file = args[0] ? db.getFile(args[0]) : null;
    const files = file ? [file] : db.listFiles();
    for (const item of files) {
      console.log(JSON.stringify({ ...item, chunks: db.getChunks(item.id) }, null, 2));
    }
    if (!files.length) console.log('No files indexed yet.');
  } else if (command === 'recover') {
    await recover(args[0]);
  } else {
    console.log(`Telegram Storage Engine v0.1
Commands:
  upload <path>
  download <file-id> [output-path]
  status [file-id]
  recover [file-id]`);
  }
}

main().catch(error => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
