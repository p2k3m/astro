const major = parseInt(process.versions.node.split('.')[0], 10);
const required = 18;
if (major < required) {
  console.error(`Node.js ${required} or newer is required. You are using ${process.versions.node}.`);
  process.exit(1);
}
