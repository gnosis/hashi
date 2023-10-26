import winston from "winston"

const colors = {
  error: "red",
  warn: "yellow",
  info: "cyan",
  debug: "blue",
  service: "magenta",
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize({
      colors,
    }),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, service }) => {
      const colorize = winston.format.colorize()
      return `${timestamp} [${level}] ${colorize.colorize("service", `${service}`)}: ${message}`
    }),
  ),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "./logs/application.log" })],
})

winston.addColors(colors)

export default logger
