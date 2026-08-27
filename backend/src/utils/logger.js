const writeLog = (level, message, fields = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "shopsphere-backend",
    message,
    ...fields,
  };

  const output = JSON.stringify(entry);

  if (level === "ERROR") {
    console.error(output);
  } else {
    console.log(output);
  }
};

const logger = {
  info(message, fields = {}) {
    writeLog("INFO", message, fields);
  },
  warn(message, fields = {}) {
    writeLog("WARN", message, fields);
  },
  error(message, fields = {}) {
    writeLog("ERROR", message, fields);
  },
};

export default logger;
