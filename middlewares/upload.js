const multer = require('multer');
const path = require('path');

const tmpDir = path.join(__dirname, '..', 'tmp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Uploading file to:', tmpDir);  // Logowanie ścieżki folderu tmp
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    console.log('Uploading file:', file.originalname);  // Logowanie nazwy pliku
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
