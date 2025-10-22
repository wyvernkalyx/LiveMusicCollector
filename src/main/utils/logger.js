/**
 * Logger Service
 *
 * Provides structured logging with levels and optional file output.
 * Falls back to console if winston is not available.
 */

const path = require('path');
const fs = require('fs');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Try to use winston if available
    try {
      const winston = require('winston');
      const { app } = require('electron');

      const logDir = app.getPath('userData');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      this.winston = winston.createLogger({
        level: this.logLevel,
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        transports: [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
          })
        ]
      });

      // Add console transport in development
      if (process.env.NODE_ENV !== 'production' && !global.isPackaged) {
        this.winston.add(new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }));
      }

      this.useWinston = true;
    } catch (error) {
      // Winston not available, will use console fallback
      this.useWinston = false;
      console.warn('Winston not available, using console fallback');
    }
  }

  shouldLog(level) {
    const currentLevel = this.levels[this.logLevel] || 2;
    const messageLevel = this.levels[level] || 2;
    return messageLevel <= currentLevel;
  }

  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length > 0
      ? ' ' + JSON.stringify(meta)
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message, meta = {}) {
    if (this.useWinston) {
      this.winston.error(message, meta);
    } else if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.useWinston) {
      this.winston.warn(message, meta);
    } else if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.useWinston) {
      this.winston.info(message, meta);
    } else if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.useWinston) {
      this.winston.debug(message, meta);
    } else if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  // Convenience method for logging with context
  withContext(context) {
    return {
      error: (message, meta = {}) => this.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta })
    };
  }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
