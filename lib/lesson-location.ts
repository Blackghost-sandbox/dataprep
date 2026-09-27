export const lessonTabs=["Concept","Examples","Hands-on","Interview Qs","Common Mistakes","Quiz","Notes"] as const;
export function parseLessonLocation(hash:string,registry:Record<string,{id:string}[]>){
  try{
    const [module,id,tab="Concept",extra]=hash.replace(/^#/,"").split("/").map(decodeURIComponent);
    if(extra!==undefined||!Object.prototype.hasOwnProperty.call(registry,module))return null;
    const index=registry[module].findIndex(lesson=>lesson.id===id);
    if(index<0||!lessonTabs.some(value=>value===tab))return null;
    return {module,index,tab};
  }catch{return null;}
}
export function lessonLocation(module:string,id:string,tab:string){return "#"+[module,id,tab].map(encodeURIComponent).join("/");}
