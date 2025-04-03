import {
  entityKind
} from "./chunk-HFMKE377.js";
import {
  __publicField
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/drizzle-orm@0.40.0_@neondatabase+serverless@0.10.4_@types+pg@8.11.6_pg@8.14.1/node_modules/drizzle-orm/logger.js
var _a;
_a = entityKind;
var ConsoleLogWriter = class {
  write(message) {
    console.log(message);
  }
};
__publicField(ConsoleLogWriter, _a, "ConsoleLogWriter");
var _a2;
_a2 = entityKind;
var DefaultLogger = class {
  constructor(config) {
    __publicField(this, "writer");
    this.writer = (config == null ? void 0 : config.writer) ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
__publicField(DefaultLogger, _a2, "DefaultLogger");
var _a3;
_a3 = entityKind;
var NoopLogger = class {
  logQuery() {
  }
};
__publicField(NoopLogger, _a3, "NoopLogger");

export {
  ConsoleLogWriter,
  DefaultLogger,
  NoopLogger
};
//# sourceMappingURL=chunk-4PZCVK23.js.map
