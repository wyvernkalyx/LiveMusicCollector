const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

class ChromaprintSetup {
  constructor() {
    // Get the path where we'll store fpcalc
    this.binPath = path.join(app.getPath('userData'), 'bin');
    this.fpcalcPath = path.join(this.binPath, process.platform === 'win32' ? 'fpcalc.exe' : 'fpcalc');
    this.chromaprintUrl = this.getChromaprintUrl();
  }

  getChromaprintUrl() {
    // URLs for different platforms
    const urls = {
      win32: 'https://github.com/acoustid/chromaprint/releases/download/v1.5.1/chromaprint-fpcalc-1.5.1-windows-x86_64.zip',
      darwin: 'https://github.com/acoustid/chromaprint/releases/download/v1.5.1/chromaprint-fpcalc-1.5.1-macos-x86_64.tar.gz',
      linux: 'https://github.com/acoustid/chromaprint/releases/download/v1.5.1/chromaprint-fpcalc-1.5.1-linux-x86_64.tar.gz'
    };
    return urls[process.platform] || urls.linux;
  }

  async ensureFpcalcExists() {
    try {
      // Check if fpcalc already exists
      await fs.access(this.fpcalcPath);
      console.log('fpcalc found at:', this.fpcalcPath);

      // Test if it works
      try {
        await execPromise(`"${this.fpcalcPath}" -version`);
        return this.fpcalcPath;
      } catch (error) {
        console.log('fpcalc exists but not working, will redownload');
      }
    } catch (error) {
      console.log('fpcalc not found, downloading...');
    }

    // Create bin directory if it doesn't exist
    await fs.mkdir(this.binPath, { recursive: true });

    // Download and extract fpcalc
    await this.downloadAndExtractFpcalc();

    return this.fpcalcPath;
  }

  async downloadAndExtractFpcalc() {
    const tempFile = path.join(this.binPath, 'chromaprint-temp.zip');

    // Download the file
    await this.downloadFile(this.chromaprintUrl, tempFile);

    // Extract based on platform
    if (process.platform === 'win32') {
      // For Windows, we need to extract the zip file
      // We'll use PowerShell's Expand-Archive
      const extractCmd = `powershell -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${this.binPath}' -Force"`;
      await execPromise(extractCmd);

      // Find the fpcalc.exe in the extracted folder
      const files = await fs.readdir(this.binPath);
      const chromaprintDir = files.find(f => f.startsWith('chromaprint-'));
      if (chromaprintDir) {
        const sourcePath = path.join(this.binPath, chromaprintDir, 'fpcalc.exe');
        await fs.rename(sourcePath, this.fpcalcPath);
        // Clean up the extracted directory
        await fs.rmdir(path.join(this.binPath, chromaprintDir), { recursive: true });
      }
    } else {
      // For Unix-like systems, use tar
      const extractCmd = `tar -xzf "${tempFile}" -C "${this.binPath}"`;
      await execPromise(extractCmd);

      // Find and move fpcalc to the expected location
      const files = await fs.readdir(this.binPath);
      const chromaprintDir = files.find(f => f.startsWith('chromaprint-'));
      if (chromaprintDir) {
        const sourcePath = path.join(this.binPath, chromaprintDir, 'fpcalc');
        await fs.rename(sourcePath, this.fpcalcPath);
        // Make it executable
        await fs.chmod(this.fpcalcPath, '755');
        // Clean up
        await fs.rmdir(path.join(this.binPath, chromaprintDir), { recursive: true });
      }
    }

    // Clean up temp file
    await fs.unlink(tempFile);

    console.log('fpcalc successfully installed at:', this.fpcalcPath);
  }

  downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(destPath);

      const makeRequest = (requestUrl) => {
        https.get(requestUrl, (response) => {
          // Handle redirects
          if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 307) {
            file.close();
            require('fs').unlinkSync(destPath);
            return makeRequest(response.headers.location);
          }

          if (response.statusCode !== 200) {
            file.close();
            reject(new Error(`Failed to download: ${response.statusCode}`));
            return;
          }

          const totalBytes = parseInt(response.headers['content-length'], 10);
          let downloadedBytes = 0;

          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (totalBytes) {
              const percent = Math.round((downloadedBytes / totalBytes) * 100);
              if (percent % 10 === 0) {
                console.log(`Downloading fpcalc: ${percent}%`);
              }
            }
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              console.log('fpcalc download complete');
              resolve();
            });
          });
        }).on('error', (err) => {
          file.close();
          try {
            require('fs').unlinkSync(destPath);
          } catch (e) {}
          reject(err);
        });
      };

      makeRequest(url);
    });
  }
}

module.exports = ChromaprintSetup;