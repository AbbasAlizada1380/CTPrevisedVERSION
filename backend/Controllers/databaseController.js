import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sequelize from '../dbconnection.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MYSQL_BIN_DIR = process.env.MYSQL_BIN_DIR || '';
const mysqlExe = MYSQL_BIN_DIR ? path.join(MYSQL_BIN_DIR, 'mysql') : 'mysql';
const mysqldumpExe = MYSQL_BIN_DIR ? path.join(MYSQL_BIN_DIR, 'mysqldump') : 'mysqldump';

const dbConfig = sequelize.config;
const {
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASS,
  host: DB_HOST,
  port: DB_PORT,
} = dbConfig;

/**
 * Execute a command using spawn (no shell), returning stdout and stderr as strings.
 * For commands that need stdin, provide an optional readable stream.
 */
function spawnCommand(cmd, args, inputStream = null) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { 
      shell: false,           // explicitly disable shell
      stdio: ['pipe', 'pipe', 'pipe'] 
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    // If an input stream is provided, pipe it to the child's stdin
    if (inputStream) {
      inputStream.pipe(child.stdin);
      inputStream.on('error', (err) => {
        child.stdin.end();
        reject(err);
      });
    } else {
      child.stdin.end(); // close stdin if no input
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`Command failed with exit code ${code}: ${stderr || stdout}`);
        error.code = code;
        error.stderr = stderr;
        error.stdout = stdout;
        reject(error);
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// --- EXPORT ---
export const exportDatabase = async (req, res) => {
  try {
    const filename = `backup_${new Date().toISOString().slice(0, 10)}.sql`;

    // Build arguments as an array – no shell, so password is safe
    const args = [
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--user=${DB_USER}`,
      `--password=${DB_PASS}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--no-tablespaces',
      DB_NAME
    ];

    console.log('🔹 Exporting database with mysqldump...');

    const { stdout, stderr } = await spawnCommand(mysqldumpExe, args);

    // Ignore warnings but treat any actual error messages as failure
    if (stderr && !stderr.includes('Warning')) {
      console.error('mysqldump stderr:', stderr);
      if (stderr.toLowerCase().includes('error')) {
        throw new Error(stderr);
      }
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(stdout));
    return res.send(stdout);
  } catch (error) {
    console.error('Export error:', error);
    let message = 'Error exporting database';
    if (error.message.includes('Access denied')) {
      message = 'Access denied. Please check your database password in dbconnection.js.';
    }
    return res.status(500).json({ message, error: error.message });
  }
};

// --- IMPORT ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeName = base.replace(/[^a-zA-Z0-9]/g, '_') + Date.now() + ext;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Only .sql files are allowed'), false);
    }
  },
  limits: { fileSize: 200 * 1024 * 1024 },
}).single('sqlFile');

export const importDatabase = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: 'Uploaded file not found on server' });
    }

    try {
      // Build arguments – note that --init-command is passed as a single argument
      const args = [
        `--host=${DB_HOST}`,
        `--port=${DB_PORT}`,
        `--user=${DB_USER}`,
        `--password=${DB_PASS}`,
        `--init-command=SET FOREIGN_KEY_CHECKS=0`,
        DB_NAME
      ];

      console.log('🔹 Importing database with mysql...');

      // Create a readable stream from the uploaded file
      const fileStream = fs.createReadStream(filePath);

      // Execute mysql and pipe the file content to its stdin
      const { stdout, stderr } = await spawnCommand(mysqlExe, args, fileStream);

      if (stderr && !stderr.includes('Warning')) {
        console.error('mysql stderr:', stderr);
        if (stderr.toLowerCase().includes('error')) {
          throw new Error(stderr);
        }
      }

      // Clean up the temporary file
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: 'Database imported successfully' });
    } catch (error) {
      // Clean up even on error
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.error('Import error:', error);
      let message = 'Error importing database';
      if (error.message.includes('Access denied')) {
        message = 'Access denied. Please check your database password in dbconnection.js.';
      }
      return res.status(500).json({ message, error: error.message });
    }
  });
};