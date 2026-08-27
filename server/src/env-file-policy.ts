export function shouldLoadWorkingDirectoryEnv(input: {
  cwdEnvExists: boolean;
  isThinkingMachEnvFile: boolean;
  env?: NodeJS.ProcessEnv;
}): boolean {
  const env = input.env ?? process.env;
  return env.THINKINGMACH_DISABLE_CWD_ENV_FILE !== "true"
    && input.cwdEnvExists
    && !input.isThinkingMachEnvFile;
}
