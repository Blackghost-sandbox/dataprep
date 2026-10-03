export type SchemaVersion = "v1" | "v2" | "v3";
export type SerializationFormat = "json-avro" | "json" | "protobuf";

export type SchemaMessage = {
  id:string;
  offset:number;
  schema:SchemaVersion;
  order_id:number;
  amount:number;
  product?:string;
  currency?:string;
  timestamp:string;
};

export type SchemaReadResult = {
  ok:boolean;
  value:{
    order_id:number;
    amount:number;
    product:string|null;
    currency?:string|null;
  } | null;
  ignoredFields:string[];
  reason:string;
};

export type SchemaSimulationState = {
  writer:SchemaVersion;
  reader:SchemaVersion;
  format:SerializationFormat;
  showRawBytes:boolean;
  messages:SchemaMessage[];
  selectedOffset:number;
  nextOffset:number;
  runCount:number;
  status:string;
};

export const schemaFormats:Array<{id:SerializationFormat;label:string}> = [
  {id:"json-avro",label:"JSON (Avro-like)"},
  {id:"json",label:"JSON"},
  {id:"protobuf",label:"Protobuf-like"},
];

export const schemaVersions:Array<{id:SchemaVersion;label:string;short:string}> = [
  {id:"v1",label:"V1 (Original)",short:"V1"},
  {id:"v2",label:"V2 (Add Field)",short:"V2"},
  {id:"v3",label:"V3 (Remove Field)",short:"V3"},
];

const seedMessages:SchemaMessage[] = [
  {id:"seed-102",offset:102,schema:"v1",order_id:1042,amount:499,product:"Laptop",timestamp:"10:24:12"},
  {id:"seed-103",offset:103,schema:"v2",order_id:1043,amount:299,product:"Tablet",currency:"INR",timestamp:"10:24:15"},
  {id:"seed-104",offset:104,schema:"v3",order_id:1044,amount:899,timestamp:"10:24:18"},
];

function clock(sequence:number){
  const total=10*3600+24*60+21+sequence*3;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export function createSchemaSimulationState():SchemaSimulationState{
  return {
    writer:"v1",
    reader:"v1",
    format:"json-avro",
    showRawBytes:false,
    messages:[...seedMessages],
    selectedOffset:103,
    nextOffset:105,
    runCount:0,
    status:"Ready. Compare writer and reader schema versions, then produce a message.",
  };
}

export function writerPayload(version:SchemaVersion,sequence=0){
  if(version==="v1")return {order_id:1042+sequence,amount:499,product:"Laptop"};
  if(version==="v2")return {order_id:1042+sequence,amount:499,product:"Laptop",currency:"INR"};
  return {order_id:1042+sequence,amount:499};
}

export function serializeMessage(message:SchemaMessage,format:SerializationFormat){
  const payload:Record<string,unknown>={
    order_id:message.order_id,
    amount:message.amount,
  };
  if(message.product!==undefined)payload.product=message.product;
  if(message.currency!==undefined)payload.currency=message.currency;

  if(format==="json")return JSON.stringify(payload);
  if(format==="protobuf"){
    const fields=[
      `1:${message.order_id}`,
      `2:${message.amount}`,
      message.product!==undefined?`3:${message.product}`:null,
      message.currency!==undefined?`4:${message.currency}`:null,
    ].filter(Boolean).join("|");
    return fields;
  }
  return JSON.stringify({schema:message.schema,payload});
}

export function rawBytes(serialized:string){
  return Array.from(new TextEncoder().encode(serialized)).map(byte=>byte.toString(16).padStart(2,"0")).join(" ");
}

export function readMessage(message:SchemaMessage,reader:SchemaVersion):SchemaReadResult{
  const ignoredFields:string[]=[];

  if(reader==="v1"){
    if(message.currency!==undefined)ignoredFields.push("currency");
    return {
      ok:true,
      value:{
        order_id:message.order_id,
        amount:message.amount,
        product:message.product??null,
      },
      ignoredFields,
      reason:message.currency!==undefined
        ?"Unknown field 'currency' is ignored by Reader V1 in this teaching compatibility model."
        :message.product===undefined
          ?"Reader V1 can deserialize the retained record, but required product data is missing and resolves to null in this demo."
          :"Reader V1 matched the expected fields.",
    };
  }

  if(reader==="v2"){
    return {
      ok:true,
      value:{
        order_id:message.order_id,
        amount:message.amount,
        product:message.product??null,
        currency:message.currency??"USD",
      },
      ignoredFields,
      reason:message.currency===undefined
        ?"Reader V2 supplies its teaching default currency for older records."
        :"Reader V2 reads the added currency field.",
    };
  }

  if(message.product!==undefined)ignoredFields.push("product");
  if(message.currency!==undefined)ignoredFields.push("currency");
  return {
    ok:true,
    value:{
      order_id:message.order_id,
      amount:message.amount,
      product:null,
    },
    ignoredFields,
    reason:ignoredFields.length
      ?`Reader V3 ignores removed field(s): ${ignoredFields.join(", ")}.`
      :"Reader V3 matched the reduced schema.",
  };
}

export function isSchemaPairCompatible(writer:SchemaVersion,reader:SchemaVersion){
  if(writer==="v3"&&reader==="v1")return {ok:false,reason:"V3 removes product, while Reader V1 expects the field. This is incompatible under a strict required-field contract."};
  return {ok:true,reason:"This writer/reader pair is compatible in the teaching model."};
}

export function setWriterVersion(state:SchemaSimulationState,writer:SchemaVersion){
  return {...state,writer,status:`Writer changed to ${writer.toUpperCase()}.`};
}

export function setReaderVersion(state:SchemaSimulationState,reader:SchemaVersion){
  return {...state,reader,status:`Reader changed to ${reader.toUpperCase()}.`};
}

export function setSerializationFormat(state:SchemaSimulationState,format:SerializationFormat){
  return {...state,format,status:`Serialization format changed to ${schemaFormats.find(item=>item.id===format)?.label??format}.`};
}

export function setShowRawBytes(state:SchemaSimulationState,showRawBytes:boolean){
  return {...state,showRawBytes,status:showRawBytes?"Raw serialized bytes are visible.":"Decoded message preview is visible."};
}

export function selectSchemaMessage(state:SchemaSimulationState,offset:number){
  return state.messages.some(message=>message.offset===offset)
    ?{...state,selectedOffset:offset,status:`Inspecting retained message at offset ${offset}.`}
    :state;
}

export function produceSchemaMessage(state:SchemaSimulationState){
  const pair=isSchemaPairCompatible(state.writer,state.reader);
  const sequence=state.nextOffset-105;
  const payload=writerPayload(state.writer,sequence);
  const message:SchemaMessage={
    id:`message-${state.nextOffset}-${state.writer}`,
    offset:state.nextOffset,
    schema:state.writer,
    order_id:Number(payload.order_id),
    amount:Number(payload.amount),
    ...(payload.product!==undefined?{product:String(payload.product)}:{}),
    ...(payload.currency!==undefined?{currency:String(payload.currency)}:{}),
    timestamp:clock(sequence),
  };
  const messages=[...state.messages,message].slice(-5);
  return {
    ...state,
    messages,
    selectedOffset:message.offset,
    nextOffset:message.offset+1,
    runCount:state.runCount+1,
    status:pair.ok
      ?`Produced offset ${message.offset} with ${state.writer.toUpperCase()}; Reader ${state.reader.toUpperCase()} can deserialize it in this model.`
      :`Produced offset ${message.offset}, but Reader ${state.reader.toUpperCase()} is incompatible: ${pair.reason}`,
  };
}

export function selectedSchemaMessage(state:SchemaSimulationState){
  return state.messages.find(message=>message.offset===state.selectedOffset)??state.messages.at(-1)??null;
}
