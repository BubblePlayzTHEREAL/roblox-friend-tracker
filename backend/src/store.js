const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/tracked.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tracked: [] }, null, 2), 'utf8');
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getTracked() {
  const data = readData();
  return Array.isArray(data.tracked) ? data.tracked : [];
}

function setTracked(tracked) {
  writeData({ tracked });
}

function findTrackedByUserId(userId) {
  const tracked = getTracked();
  return tracked.find(t => String(t.userId) === String(userId));
}

function addTracked(userObj) {
  const tracked = getTracked();
  tracked.push(userObj);
  setTracked(tracked);
}

function removeTracked(userId) {
  const tracked = getTracked();
  const filtered = tracked.filter(t => String(t.userId) !== String(userId));
  setTracked(filtered);
}

module.exports = {
  getTracked,
  setTracked,
  findTrackedByUserId,
  addTracked,
  removeTracked
};
