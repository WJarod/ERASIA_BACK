import pino from "pino";
import dayjs from "dayjs";
import pretty from 'pino-pretty'

const log = pino({
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname"
        },
      },
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          destination: "server.log",
        },
      }
    ],

  },
  prettifier: pretty,
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export default log;
