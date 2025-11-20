import { AssemblyProvider } from "./assembly.provider";

export class STTService {
  static async transcribe(audioPath: string, provider: "assembly") {
    return AssemblyProvider.transcribe(audioPath);
  }
}
