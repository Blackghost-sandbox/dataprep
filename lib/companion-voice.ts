export type VoiceState="idle"|"speaking"|"paused"|"unavailable"|"error"|"loading"|"choose-voice";
// SpeechSynthesisVoice has no gender field. Prefer recognized voice names,
// and let the learner choose when the browser exposes an unfamiliar catalog.
export function preferredNilaVoice(voices:SpeechSynthesisVoice[]){
  const names=/\b(zira|aria|jenny|samantha|karen|moira|tessa|susan|hazel|heera|raveena|female)\b/i;
  return voices.filter(v=>/^en(?:-|_)/i.test(v.lang)&&names.test(v.name))
    .sort((a,b)=>Number(b.localService)-Number(a.localService))[0];
}
export interface VoiceService {play(text:string,rate:number):void;pause():void;resume():void;stop():void;dispose():void}
export class BrowserTTSProvider implements VoiceService {
  private utterance:SpeechSynthesisUtterance|null=null;
  private preferredURI="";
  private cancelPending:(()=>void)|null=null;
  setVoice(uri:string){this.stop();this.preferredURI=uri;}
  constructor(private onState:(state:VoiceState)=>void){}
  private get supported(){return typeof window!=="undefined"&&"speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;}
  play(text:string,rate:number){
    if(!this.supported){this.onState("unavailable");return;}
    this.stop();
    if(!window.speechSynthesis.getVoices().length){
      this.onState("loading");
      const ready=()=>{if(window.speechSynthesis.getVoices().length){cleanup();this.play(text,rate);}};
      const timer=setTimeout(()=>{cleanup();this.onState("choose-voice");},2500);
      const cleanup=()=>{clearTimeout(timer);window.speechSynthesis.removeEventListener("voiceschanged",ready);this.cancelPending=null;};
      this.cancelPending=cleanup;window.speechSynthesis.addEventListener("voiceschanged",ready);return;
    }
    const utterance=new SpeechSynthesisUtterance(text.slice(0,5000));
    utterance.lang="en-US";utterance.rate=Math.max(.7,Math.min(rate,1.4));
    const voices=window.speechSynthesis.getVoices();
    const voice=voices.find(v=>v.voiceURI===this.preferredURI)||preferredNilaVoice(voices);
    if(!voice){this.onState("choose-voice");return;}
    utterance.voice=voice;utterance.lang=voice.lang;
    utterance.onstart=()=>this.onState("speaking");utterance.onend=()=>this.onState("idle");utterance.onerror=event=>{if(event.error!=="interrupted"&&event.error!=="canceled")this.onState("error");};
    this.utterance=utterance;window.speechSynthesis.speak(utterance);this.onState("speaking");
  }
  pause(){if(this.supported&&this.utterance){window.speechSynthesis.pause();this.onState("paused");}}
  resume(){if(this.supported&&this.utterance){window.speechSynthesis.resume();this.onState("speaking");}}
  stop(){this.cancelPending?.();if(this.supported){if(this.utterance){this.utterance.onstart=null;this.utterance.onend=null;this.utterance.onerror=null;}window.speechSynthesis.cancel();}this.utterance=null;this.onState("idle");}
  dispose(){this.stop();}
}
