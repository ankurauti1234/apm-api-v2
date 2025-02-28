import chalk from 'chalk';
import { DateTime } from 'luxon'; // For timestamps

const env = process.env.NODE_ENV || 'development';

// Helper function to format the timestamp
const getTimestamp = () => {
  return DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
};

// Define styles using chalk
const styles = {
  debug: chalk.blue.bold,
  log: chalk.green.bold,
  info: chalk.cyan.bold,
  warn: chalk.yellow.bold,
  error: chalk.red.bold,
  timestamp: chalk.gray.italic,
};

const logger = {
  debug: (...args) => {
    if (env === 'development') {
      console.log(
        `${styles.timestamp(`[${getTimestamp()}]`)} ${styles.debug('[DEBUG]')}`,
        ...args
      );
    }
  },
  log: (...args) => {
    if (env === 'development') {
      console.log(
        `${styles.timestamp(`[${getTimestamp()}]`)} ${styles.log('[LOG]')}`,
        ...args
      );
    }
  },
  info: (...args) => {
    if (env === 'development') {
      console.log(
        `${styles.timestamp(`[${getTimestamp()}]`)} ${styles.info('[INFO]')}`,
        ...args
      );
    }
  },
  warn: (...args) => {
    if (env === 'development') {
      console.log(
        `${styles.timestamp(`[${getTimestamp()}]`)} ${styles.warn('[WARN]')}`,
        ...args
      );
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.log(
      `${styles.timestamp(`[${getTimestamp()}]`)} ${styles.error('[ERROR]')}`,
      ...args
    );
  },
};

export default logger;