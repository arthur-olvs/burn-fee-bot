export function makeLogger(debug: boolean) {
  const base = (lvl: string, msg: string) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${lvl}] ${msg}`);
  };
  return {
    debug: (m: string) => debug && base("debug", m),
    info: (m: string) => base("info", m),
    warn: (m: string) => base("warn", m),
    error: (m: string) => base("error", m),
  };
}
