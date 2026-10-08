import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {errorCodes, isErrorWithCode, keepLocalCopy, pick, type DocumentPickerResponse, type FileToCopy} from '@react-native-documents/picker';
import EventSource from 'react-native-sse';
import {RTCPeerConnection, RTCSessionDescription, RTCIceCandidate} from 'react-native-webrtc';
import RNFS from 'react-native-fs';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

type Peer = {id: string; name: string; emoji: string; sessionId?: string};
type FileItem = DocumentPickerResponse & {fileCopyUri?: string};
const STORAGE = '@instantdrop/mobile-v1';
const DEFAULT_SERVER = 'https://instantdrop-myvz.onrender.com';
const ICE = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const DATA_CHANNEL_HIGH_WATER = 4 * 1024 * 1024;
const DATA_CHANNEL_LOW_WATER = 512 * 1024;
const C = {bg: '#121512', panel: '#1b201c', card: '#202620', line: 'rgba(239,244,231,.1)', green: '#8ed9af', text: '#f1f1e9', muted: '#9ca59a', warm: '#f0bd87'};
const randomHex = (bytes: number) => {
  const values = new Uint8Array(bytes);
  (globalThis as any).crypto.getRandomValues(values);
  return Array.from(values, value => value.toString(16).padStart(2, '0')).join('');
};
const base64ToBytes=(input:string)=>{const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';const clean=input.replace(/[^A-Za-z0-9+/]/g,'');const out=new Uint8Array(Math.floor(clean.length*3/4));let p=0;for(let i=0;i<clean.length;i+=4){const a=chars.indexOf(clean[i]),b=chars.indexOf(clean[i+1]),c=chars.indexOf(clean[i+2]),d=chars.indexOf(clean[i+3]);if(a<0||b<0)break;out[p++]=(a<<2)|(b>>4);if(c>=0)out[p++]=((b&15)<<4)|(c>>2);if(d>=0)out[p++]=((c&3)<<6)|d;}return out.subarray(0,p);};
const bytesToBase64=(bytes:Uint8Array)=>{const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let result='';for(let i=0;i<bytes.length;i+=3){const a=bytes[i],hasB=i+1<bytes.length,hasC=i+2<bytes.length,b=hasB?bytes[i+1]:0,c=hasC?bytes[i+2]:0;result+=chars[a>>2]+chars[((a&3)<<4)|(b>>4)]+(hasB?chars[((b&15)<<2)|(c>>6)]:'=')+(hasC?chars[c&63]:'=');}return result;};

function App() {
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [serverDraft, setServerDraft] = useState(DEFAULT_SERVER);
  const [room, setRoom] = useState('');
  const [myId, setMyId] = useState('');
  const [token, setToken] = useState('');
  const [session, setSession] = useState('');
  const [myEmoji, setMyEmoji] = useState('··');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedText, setSharedText] = useState('');
  const [status, setStatus] = useState('Conectando con InstantDrop…');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [roomEditor, setRoomEditor] = useState(false);
  const [serverEditor, setServerEditor] = useState(false);
  const source = useRef<EventSource<'devices' | 'ping'> | null>(null);
  const peersRef = useRef<Peer[]>([]);
  const sessions = useRef(new Map<string,string>());
  const pcs = useRef(new Map<string,any>());
  const queued = useRef(new Map<string,FileItem[]>());
  const dataChannels = useRef(new Map<string,any>());
  const bindIncomingRef = useRef<(channel:any,peerId:string)=>void>(()=>{});
  const scan = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  const api = useCallback((path:string) => `${server.replace(/\/$/,'')}${path}`, [server]);
  const notify = useCallback((message:string) => {setToast(message); setTimeout(()=>setToast(''),2800);},[]);
  const updatePeers = useCallback((list:Peer[]) => {
    const unique = [...new Map(list.filter(p=>p.id && p.id!==myId).map(p=>[p.id,p])).values()];
    peersRef.current=unique; setPeers(unique);
    unique.forEach(p=>{if(p.sessionId)sessions.current.set(p.id,p.sessionId);});
    setStatus(unique.length ? `${unique.length} dispositivo${unique.length===1?'':'s'} disponible${unique.length===1?'':'s'}` : 'Buscando dispositivos cercanos…');
  },[myId]);

  const connect = useCallback(async (saved?:{deviceId?:string;token?:string;roomId?:string;server?:string}) => {
    const base=(saved?.server || server).trim().replace(/\/$/,'');
    if(!/^https?:\/\//.test(base)){notify('La dirección debe comenzar con http:// o https://'); return;}
    setServer(base);
    const deviceId=saved?.deviceId || myId || randomHex(16);
    const credential=saved?.token || token || randomHex(24);
    const sid=session || randomHex(16);
    const activeRoom=(saved?.roomId ?? room).trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24);
    try {
      const response=await fetch(`${base}/api/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId,token:credential,roomId:activeRoom||undefined,name:Platform.OS==='ios'?'iPhone':'Android'})});
      if(!response.ok) throw new Error('No se pudo registrar el teléfono');
      const info=await response.json();
      setMyId(info.deviceId);setToken(info.token);setMyEmoji(info.emoji);setRoom(activeRoom);setSession(sid);
      await AsyncStorage.setItem(STORAGE,JSON.stringify({deviceId:info.deviceId,token:info.token,roomId:activeRoom,server:base,session:sid,emoji:info.emoji}));
      source.current?.close();
      const params=new URLSearchParams({deviceId:info.deviceId,token:info.token,sessionId:sid});if(activeRoom)params.set('roomId',activeRoom);
      const es=new EventSource<'devices'|'ping'>(`${base}/api/events?${params.toString()}`);source.current=es;
      es.addEventListener('open',()=>{setConnected(true);setStatus('Buscando dispositivos cercanos…');void loadPeers(base,info.deviceId,activeRoom);});
      es.addEventListener('devices',(e:any)=>{try{updatePeers(JSON.parse(e.data));}catch{}});
      es.addEventListener('ping',()=>{void fetch(`${base}/api/heartbeat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:info.deviceId,token:info.token,sessionId:sid,roomId:activeRoom||undefined})}).then(r=>r.json()).then(x=>{if(!x.ok)void connect({deviceId:info.deviceId,token:info.token,roomId:activeRoom,server:base});}).catch(()=>{});});
      es.addEventListener('message',(e:any)=>{void handleSignal(e.data,base,info.deviceId,credential,sid,activeRoom);});
      es.addEventListener('error',()=>{setConnected(false);setStatus('Reconectando…');});
      setConnected(true);
    } catch(e:any){setConnected(false);setStatus('Sin conexión al servidor');notify(e?.message || 'No se pudo conectar');}
  },[myId,token,session,server,room,notify,updatePeers]);

  const loadPeers=useCallback(async(base:string,id:string,activeRoom:string)=>{try{const u=new URL(`${base}/api/devices`);u.searchParams.set('me',id);if(activeRoom)u.searchParams.set('roomId',activeRoom);const r=await fetch(u.toString());if(r.ok)updatePeers(await r.json());}catch{}},[updatePeers]);

  const signal=useCallback(async(base:string,to:string,from:string,credential:string,sid:string,activeRoom:string,type:string,data:any)=>{
    const res=await fetch(`${base}/api/signal`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,from,token:credential,type,data,roomId:activeRoom||undefined,sessionId:sid,toSessionId:sessions.current.get(to)})});
    if(!res.ok)throw new Error('No se pudo conectar con el dispositivo');
  },[]);

  const handleSignal=useCallback(async(raw:string,base:string,fromId:string,credential:string,sid:string,activeRoom:string)=>{
    try{const msg=JSON.parse(raw);if(msg.sessionId)sessions.current.set(msg.from,msg.sessionId);let pc=pcs.current.get(msg.from);
      if(msg.type==='offer'){
        pc=new RTCPeerConnection(ICE);pcs.current.set(msg.from,pc);
        pc.onicecandidate=(e:any)=>{if(e.candidate)void signal(base,msg.from,fromId,credential,sid,activeRoom,'ice',e.candidate.toJSON());};
        pc.ondatachannel=(e:any)=>{dataChannels.current.set(msg.from,e.channel);bindIncomingRef.current(e.channel,msg.from);};
        await pc.setRemoteDescription(new RTCSessionDescription(msg.data));const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await signal(base,msg.from,fromId,credential,sid,activeRoom,'answer',pc.localDescription);
      } else if(msg.type==='answer'&&pc){await pc.setRemoteDescription(new RTCSessionDescription(msg.data));}
      else if(msg.type==='ice'&&pc&&msg.data){await pc.addIceCandidate(new RTCIceCandidate(msg.data));}
    }catch(e:any){notify(e?.message||'Falló la negociación P2P');}
  },[signal,notify]);

  const bindIncoming=useCallback((channel:any,peerId:string)=>{
    let incomingName='',destination='',expected=1,doneCount=0;let writeQueue=Promise.resolve();channel.binaryType='arraybuffer';
    channel.onmessage=(event:any)=>{if(typeof event.data!=='string') {const chunk=event.data instanceof ArrayBuffer?new Uint8Array(event.data):new Uint8Array(event.data.buffer,event.data.byteOffset,event.data.byteLength);writeQueue=writeQueue.then(()=>RNFS.appendFile(destination,bytesToBase64(chunk))).catch(()=>notify('No se pudo guardar el archivo recibido'));return;}
      try{const msg=JSON.parse(event.data);if(msg.type==='request'){expected=Math.max(1,msg.files?.length||1);const summary=(msg.files||[]).map((f:any)=>`${f.name} · ${formatBytes(f.size||0)}`).join('\n');Alert.alert('Transferencia entrante',summary||'Otro dispositivo quiere compartir archivos contigo.',[{text:'Rechazar',style:'cancel',onPress:()=>{channel.send(JSON.stringify({type:'reject'}));channel.close();}},{text:'Aceptar',onPress:()=>{channel.send(JSON.stringify({type:'accept'}));notify(`Recibiendo ${expected} archivo(s)…`);}}]);}
        else if(msg.type==='meta'){incomingName=String(msg.name||'archivo').replace(/[\\/:*?"<>|]/g,'_');destination=`${RNFS.DocumentDirectoryPath}/${Date.now()}-${incomingName}`;writeQueue=RNFS.writeFile(destination,'','base64');}
        else if(msg.type==='done'){void writeQueue.then(()=>{doneCount++;if(doneCount>=expected){notify(`Recibido: ${incomingName} · ${destination}`);setBusy(false);channel.close();pcs.current.get(peerId)?.close();pcs.current.delete(peerId);}});}
        else if(msg.type==='text'&&typeof msg.content==='string'&&msg.content.length<=10000){Alert.alert(`Texto de ${peersRef.current.find(p=>p.id===peerId)?.name||'InstantDrop'}`,msg.content,[{text:'Cerrar',onPress:()=>channel.send(JSON.stringify({type:'text-ack'}))}]);}
      }catch{}};
  },[notify]);
  bindIncomingRef.current=bindIncoming;

  const transferFiles=useCallback(async(target:string,channel:any,list:FileItem[])=>{
    const waitForChannelSpace=async()=>{
      if(channel.bufferedAmount<=DATA_CHANNEL_HIGH_WATER)return;
      await new Promise<void>((resolve,reject)=>{
        const timeout=setTimeout(()=>{channel.removeEventListener('bufferedamountlow',onLow);reject(new Error('La transferencia se quedó sin respuesta'));},30000);
        const onLow=()=>{clearTimeout(timeout);channel.removeEventListener('bufferedamountlow',onLow);resolve();};
        channel.addEventListener('bufferedamountlow',onLow);
        if(channel.bufferedAmount<=DATA_CHANNEL_LOW_WATER)onLow();
      });
    };
    try{channel.bufferedAmountLowThreshold=DATA_CHANNEL_LOW_WATER;for(const file of list){const path=file.fileCopyUri||file.uri;const size=file.size||0;if(!path)throw new Error('No se encontró la copia local del archivo');channel.send(JSON.stringify({type:'meta',name:file.name||'archivo',size}));let offset=0;while(offset<size){await waitForChannelSpace();const length=Math.min(48*1024,size-offset);const b64=await RNFS.read(path,length,offset,'base64');const bytes=base64ToBytes(b64);if(bytes.byteLength===0)throw new Error('No se pudo leer el archivo');channel.send(bytes);offset+=bytes.byteLength;}channel.send(JSON.stringify({type:'done'}));}notify('Transferencia enviada');setBusy(false);setFiles([]);channel.close();pcs.current.get(target)?.close();pcs.current.delete(target);}catch(e:any){setBusy(false);notify(e?.message||'Falló la lectura del archivo');channel.close();pcs.current.get(target)?.close();pcs.current.delete(target);}
  },[notify]);

  const sendFiles=useCallback(async(target:string,list:FileItem[])=>{
    if(!myId||!token||!session){notify('Espera a que InstantDrop se conecte');return;}
    const peer=peersRef.current.find(p=>p.id===target);if(!peer){notify('Ese dispositivo ya no está disponible');return;}
    try{setBusy(true);queued.current.set(target,list);const pc=new RTCPeerConnection(ICE);pcs.current.set(target,pc);const channel=pc.createDataChannel('files',{ordered:true});dataChannels.current.set(target,channel);
      pc.onicecandidate=(e:any)=>{if(e.candidate)void signal(server,target,myId,token,session,room,'ice',e.candidate.toJSON());};
      channel.onopen=()=>{channel.send(JSON.stringify({type:'request',files:list.map(f=>({name:f.name||'archivo',size:f.size||0}))}));notify('Esperando confirmación del dispositivo…');};
      channel.onmessage=(e:any)=>{try{const m=JSON.parse(e.data);if(m.type==='accept')void transferFiles(target,channel,list);else if(m.type==='reject'){setBusy(false);notify('El dispositivo rechazó la transferencia');}}catch{}};
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);await signal(server,target,myId,token,session,room,'offer',pc.localDescription);
      notify(`${list.length} archivo(s) listos para enviar`);
    }catch(e:any){setBusy(false);notify(e?.message||'No se pudo iniciar el envío');}
  },[myId,token,session,server,room,signal,notify,transferFiles]);

  const sendText=useCallback(async()=>{
    const content=sharedText.trim();if(!content)return;if(content.length>10000){notify('El mensaje debe tener menos de 10 000 caracteres');return;}if(!selected){notify('Selecciona un dispositivo primero');return;}if(!myId||!token||!session){notify('Espera a que InstantDrop se conecte');return;}
    try{setBusy(true);const target=selected;const pc=new RTCPeerConnection(ICE);pcs.current.set(target,pc);const channel=pc.createDataChannel('files',{ordered:true});dataChannels.current.set(target,channel);
      pc.onicecandidate=(e:any)=>{if(e.candidate)void signal(server,target,myId,token,session,room,'ice',e.candidate.toJSON());};
      channel.onopen=()=>{channel.send(JSON.stringify({type:'text',content}));};
      channel.onmessage=(e:any)=>{try{if(JSON.parse(e.data).type==='text-ack'){setBusy(false);setSharedText('');notify('Texto enviado');channel.close();pc.close();pcs.current.delete(target);}}catch{}};
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);await signal(server,target,myId,token,session,room,'offer',pc.localDescription);
    }catch(e:any){setBusy(false);notify(e?.message||'No se pudo enviar el texto');}
  },[sharedText,selected,myId,token,session,server,room,signal,notify]);

  useEffect(()=>{void (async()=>{try{const raw=await AsyncStorage.getItem(STORAGE);const saved=raw?JSON.parse(raw):{};const configuredServer=typeof saved.server==='string'&&saved.server.trim()?saved.server.trim():DEFAULT_SERVER;if(saved.session)setSession(saved.session);if(saved.emoji)setMyEmoji(saved.emoji);if(saved.roomId)setRoom(saved.roomId);setServer(configuredServer);setServerDraft(configuredServer);if(saved.deviceId)setMyId(saved.deviceId);if(saved.token)setToken(saved.token);await connect({...saved,server:configuredServer});}catch{setStatus('No se pudo conectar al servidor');}})();
    const animation=Animated.loop(Animated.timing(scan,{toValue:1,duration:2600,easing:Easing.linear,useNativeDriver:true}));animation.start();const orbitAnimation=Animated.loop(Animated.timing(orbit,{toValue:1,duration:22000,easing:Easing.linear,useNativeDriver:true}));orbitAnimation.start();return()=>{animation.stop();orbitAnimation.stop();source.current?.close();pcs.current.forEach((pc:any)=>pc.close());};
  // connect reads the persisted identity once when the app starts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const selectedPeer=useMemo(()=>peers.find(p=>p.id===selected),[peers,selected]);
  const pickFiles=async()=>{try{const picked=await pick({allowMultiSelection:true,mode:'import'});if(!picked.length)return;if(picked.some(file=>(file.size||0)>MAX_FILE_SIZE)){notify('Cada archivo debe pesar menos de 500 MB');return;}const filesToCopy=picked.map(file=>({uri:file.uri,fileName:file.name||'archivo'})) as [FileToCopy,...FileToCopy[]];const local=await keepLocalCopy({files:filesToCopy,destination:'cachesDirectory'});const list=picked.map((file,index)=>({...file,fileCopyUri:local[index]?.status==='success'?local[index].localUri:undefined}));if(list.some(file=>!file.fileCopyUri)){notify('No se pudo preparar uno de los archivos');return;}setFiles(prev=>[...prev,...list]);if(selected)void sendFiles(selected,list);}catch(e){if(!isErrorWithCode(e)||e.code!==errorCodes.OPERATION_CANCELED)notify('No se pudieron abrir los archivos');}};
  const changeRoom=async()=>{const normalized=room.trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24);setRoom(normalized);setRoomEditor(false);source.current?.close();await AsyncStorage.setItem(STORAGE,JSON.stringify({deviceId:myId,token,roomId:normalized,server,session,emoji:myEmoji}));void connect({deviceId:myId,token,roomId:normalized,server});};
  const rotation=orbit.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  const sweepRotation=scan.interpolate({inputRange:[0,1],outputRange:['-35deg','325deg']});

  return <SafeAreaProvider><SafeAreaView style={s.safe}><StatusBar barStyle="light-content"/><KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
    <View style={s.header}><View style={s.brand}><View style={s.brandMark}><Text style={s.brandArrow}>↗</Text></View><Text style={s.brandName}>instantdrop</Text></View><View style={s.headerActions}><Pressable onPress={()=>setServerEditor(v=>!v)} style={s.settingsButton}><Text style={s.settingsText}>⚙</Text></Pressable><Pressable onPress={()=>setRoomEditor(v=>!v)} style={s.roomPill}><Text style={s.roomLabel}>SALA</Text><Text style={s.roomCode}>{room||'AUTO'}</Text></Pressable><Pressable onPress={pickFiles} style={s.addButton}><Text style={s.addText}>＋</Text></Pressable></View></View>
    {serverEditor&&<View style={s.roomEdit}><Text style={s.roomHelp}>Backend configurado: {DEFAULT_SERVER}. Puedes cambiarlo aquí.</Text><TextInput value={serverDraft} onChangeText={setServerDraft} placeholder={DEFAULT_SERVER} placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="url" style={s.roomInput}/><Pressable onPress={async()=>{const base=serverDraft.trim().replace(/\/$/,'');setServer(base);await AsyncStorage.setItem(STORAGE,JSON.stringify({deviceId:myId,token,roomId:room,server:base,session,emoji:myEmoji}));setServerEditor(false);void connect({deviceId:myId,token,roomId:room,server:base});}} style={s.roomSave}><Text style={s.roomSaveText}>Conectar</Text></Pressable></View>}
    {roomEditor&&<View style={s.roomEdit}><Text style={s.roomHelp}>Usa el mismo código en los dispositivos que compartirán archivos.</Text><TextInput value={room} onChangeText={setRoom} placeholder="CÓDIGO DE SALA" placeholderTextColor={C.muted} autoCapitalize="characters" style={s.roomInput}/><Pressable onPress={changeRoom} style={s.roomSave}><Text style={s.roomSaveText}>Unirse</Text></Pressable></View>}
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.eyebrow}><View style={[s.liveDot,{backgroundColor:connected?C.green:C.warm}]}/><Text style={s.eyebrowText}>TU ESPACIO DE INTERCAMBIO</Text></View>
      <Text style={s.title}>Comparte al instante.</Text><Text style={s.subtitle}>Archivos directo entre tus dispositivos, sin nube.</Text>
      <View style={s.stage}><View style={s.stageTop}><View><Text style={s.smallLabel}>DISPOSITIVOS CERCANOS</Text><Text style={s.stageTitle}>Tu red InstantDrop</Text></View><View style={s.statusPill}><View style={[s.statusDot,{backgroundColor:connected?C.green:C.warm}]}/><Text style={s.statusText}>{connected?'EN LÍNEA':'CONECTANDO'}</Text></View></View>
        <View style={s.orbitSpace}><View style={s.orbitOne}/><View style={s.orbitTwo}/><Animated.View style={[s.orbitSpin,{transform:[{rotate:rotation}]}]}><View style={s.orbitPoint}/><View style={s.orbitPointTwo}/></Animated.View><Animated.View style={[s.scanner,{transform:[{rotate:sweepRotation}]}]}/>
          {peers.slice(0,5).map((p,i)=>{const angles=[-90,-18,54,126,198];const angle=angles[i]*Math.PI/180;const radius=104;const x=Math.cos(angle)*radius;const y=Math.sin(angle)*radius;return <Pressable key={p.id} onPress={()=>setSelected(p.id===selected?null:p.id)} style={[s.peerNode,{transform:[{translateX:x},{translateY:y}],borderColor:p.id===selected?C.green:C.line}]}><Text style={s.peerEmoji}>{p.emoji}</Text><Text numberOfLines={1} style={s.peerName}>{p.name||'Dispositivo'}</Text></Pressable>;})}
          <View style={s.selfNode}><Text style={s.selfEmoji}>{myEmoji}</Text><Text style={s.selfCaption}>TÚ</Text></View>
        </View>
        <View style={s.finding}><Animated.View style={[s.pulse,{opacity:scan.interpolate({inputRange:[0,.5,1],outputRange:[.35,.8,.35]})}]}/><Text style={s.findingText}>{status}</Text><Text style={s.findingHint}>{selectedPeer?`Destino: ${selectedPeer.name||selectedPeer.emoji}`:'Los dispositivos conectados aparecerán aquí'}</Text></View>
        <Pressable onPress={pickFiles} style={s.dropButton}><Text style={s.dropIcon}>↑</Text><View style={s.dropCopy}><Text style={s.dropTitle}>{selectedPeer?'Enviar archivos':'Añadir archivos'}</Text><Text style={s.dropHint}>{selectedPeer?'Selecciónalos para transferir':'PDF, fotos, videos y más'}</Text></View><Text style={s.dropChevron}>›</Text></Pressable>
      </View>
      <View style={s.sectionHead}><View><Text style={s.smallLabel}>TRANSFERENCIAS</Text><Text style={s.sectionTitle}>Tus archivos</Text></View><Pressable onPress={pickFiles}><Text style={s.addFiles}>＋ Añadir</Text></Pressable></View>
      {files.length===0?<View style={s.emptyCard}><View style={s.emptyIcon}><Text style={s.fileIcon}>▤</Text></View><View style={s.fileCopy}><Text style={s.fileTitle}>Todo listo para compartir</Text><Text style={s.fileMeta}>Los archivos que elijas aparecerán aquí.</Text></View><Text style={s.fileChevron}>›</Text></View>:files.map((file,i)=><View key={`${file.uri}-${i}`} style={s.fileCard}><View style={s.emptyIcon}><Text style={s.fileIcon}>▤</Text></View><View style={s.fileCopy}><Text numberOfLines={1} style={s.fileTitle}>{file.name||'Archivo'}</Text><Text style={s.fileMeta}>{formatBytes(file.size||0)} · {selectedPeer?'Preparando envío':'En cola'}</Text></View><Pressable onPress={()=>setFiles(prev=>prev.filter((_,j)=>j!==i))}><Text style={s.fileChevron}>×</Text></Pressable></View>)}
      <View style={s.textCard}><View style={s.textCardHead}><Text style={s.smallLabel}>TEXTO RÁPIDO</Text><Text style={s.textTarget}>{selectedPeer?`Para ${selectedPeer.name||selectedPeer.emoji}`:'Selecciona un dispositivo'}</Text></View><TextInput value={sharedText} onChangeText={setSharedText} placeholder="Escribe algo para compartir…" placeholderTextColor={C.muted} multiline maxLength={10000} style={s.textInput}/><Pressable disabled={!selected||busy||!sharedText.trim()} onPress={()=>void sendText()} style={[s.textSend,(!selected||busy||!sharedText.trim())&&s.textSendDisabled]}><Text style={s.textSendLabel}>Enviar texto <Text style={s.textSendArrow}>↗</Text></Text></Pressable></View>
      <View style={s.footerNote}><Text style={s.shield}>◇</Text><Text style={s.footerCopy}>Transferencias privadas entre dispositivos. InstantDrop no almacena tus archivos.</Text></View>
    </ScrollView>{!!toast&&<View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>}
  </KeyboardAvoidingView></SafeAreaView></SafeAreaProvider>;
}

function formatBytes(n:number){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`;}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},flex:{flex:1},header:{height:64,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},brand:{flexDirection:'row',alignItems:'center',gap:9},brandMark:{width:28,height:28,borderRadius:9,backgroundColor:C.green,alignItems:'center',justifyContent:'center'},brandArrow:{fontSize:19,color:C.bg,fontWeight:'800',marginTop:-2},brandName:{color:C.text,fontSize:16,fontWeight:'700',letterSpacing:-.5},headerActions:{flexDirection:'row',gap:9,alignItems:'center'},settingsButton:{width:34,height:34,borderRadius:11,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},settingsText:{color:C.muted,fontSize:16},roomPill:{flexDirection:'row',alignItems:'center',gap:7,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,borderRadius:20,paddingHorizontal:11,paddingVertical:8},roomLabel:{color:C.muted,fontSize:9,fontWeight:'800',letterSpacing:1},roomCode:{color:C.text,fontSize:10,fontWeight:'700',letterSpacing:.8},addButton:{width:36,height:36,borderRadius:12,backgroundColor:C.green,alignItems:'center',justifyContent:'center'},addText:{color:C.bg,fontSize:23,fontWeight:'500',lineHeight:27},content:{paddingHorizontal:22,paddingTop:28,paddingBottom:34},eyebrow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},liveDot:{width:7,height:7,borderRadius:4},eyebrowText:{fontSize:9,letterSpacing:1.7,color:C.muted,fontWeight:'700'},title:{color:C.text,fontSize:30,fontWeight:'700',letterSpacing:-1.2},subtitle:{color:C.muted,fontSize:13,marginTop:7},stage:{marginTop:24,borderRadius:24,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,paddingHorizontal:17,paddingTop:17,paddingBottom:15,overflow:'hidden'},stageTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},smallLabel:{fontSize:9,color:C.muted,letterSpacing:1.3,fontWeight:'700'},stageTitle:{fontSize:15,color:C.text,fontWeight:'600',marginTop:5},statusPill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:6,borderRadius:20,backgroundColor:'rgba(142,217,175,.08)'},statusDot:{width:5,height:5,borderRadius:3},statusText:{fontSize:8,color:C.green,fontWeight:'800',letterSpacing:.7},orbitSpace:{height:248,alignItems:'center',justifyContent:'center',marginTop:1},orbitOne:{position:'absolute',width:170,height:170,borderRadius:100,borderWidth:1,borderColor:'rgba(142,217,175,.16)'},orbitTwo:{position:'absolute',width:216,height:216,borderRadius:120,borderWidth:1,borderColor:'rgba(240,189,135,.12)'},orbitSpin:{position:'absolute',width:216,height:216,borderRadius:120},orbitPoint:{position:'absolute',top:-3,left:105,width:7,height:7,borderRadius:4,backgroundColor:C.green,shadowColor:C.green,shadowOpacity:.9,shadowRadius:8},orbitPointTwo:{position:'absolute',bottom:13,right:18,width:5,height:5,borderRadius:3,backgroundColor:C.warm},scanner:{position:'absolute',width:206,height:2,backgroundColor:'rgba(142,217,175,.22)'},selfNode:{width:72,height:72,borderRadius:24,backgroundColor:'#293a2e',borderWidth:1,borderColor:'rgba(142,217,175,.48)',alignItems:'center',justifyContent:'center'},selfEmoji:{color:C.text,fontSize:23},selfCaption:{fontSize:7,color:C.green,fontWeight:'800',letterSpacing:1,marginTop:2},peerNode:{position:'absolute',width:49,height:49,borderRadius:17,backgroundColor:'#252b25',borderWidth:1,alignItems:'center',justifyContent:'center',marginLeft:-24,marginTop:-24},peerEmoji:{fontSize:19},peerName:{position:'absolute',top:51,width:68,textAlign:'center',fontSize:8,color:C.muted,fontWeight:'600'},finding:{alignItems:'center',marginTop:-2,marginBottom:17},pulse:{position:'absolute',width:6,height:6,borderRadius:5,backgroundColor:C.green,top:7,left:'20%'},findingText:{color:C.text,fontSize:12,fontWeight:'600'},findingHint:{color:C.muted,fontSize:10,marginTop:4},dropButton:{height:65,borderRadius:17,backgroundColor:'rgba(142,217,175,.1)',borderWidth:1,borderColor:'rgba(142,217,175,.23)',flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:12},dropIcon:{width:38,height:38,borderRadius:13,backgroundColor:C.green,color:C.bg,textAlign:'center',textAlignVertical:'center',fontSize:23,fontWeight:'500',overflow:'hidden'},dropCopy:{flex:1},dropTitle:{color:C.text,fontSize:12,fontWeight:'700'},dropHint:{color:C.muted,fontSize:10,marginTop:3},dropChevron:{color:C.green,fontSize:24},sectionHead:{marginTop:27,marginBottom:12,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},sectionTitle:{color:C.text,fontSize:19,fontWeight:'700',letterSpacing:-.4,marginTop:4},addFiles:{color:C.green,fontSize:11,fontWeight:'700',paddingBottom:3},emptyCard:{height:75,borderRadius:17,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:12},fileCard:{minHeight:70,marginBottom:8,borderRadius:17,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:12},emptyIcon:{width:41,height:41,borderRadius:14,backgroundColor:'#2b3129',alignItems:'center',justifyContent:'center'},fileIcon:{color:C.green,fontSize:20},fileCopy:{flex:1},fileTitle:{color:C.text,fontSize:12,fontWeight:'600'},fileMeta:{color:C.muted,fontSize:10,marginTop:4},fileChevron:{color:C.muted,fontSize:21,paddingHorizontal:5},textCard:{marginTop:10,borderRadius:17,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,padding:13},textCardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},textTarget:{color:C.muted,fontSize:9},textInput:{minHeight:74,color:C.text,fontSize:12,lineHeight:18,textAlignVertical:'top',marginTop:8},textSend:{alignSelf:'flex-end',backgroundColor:C.green,borderRadius:11,paddingVertical:10,paddingHorizontal:14},textSendDisabled:{opacity:.4},textSendLabel:{color:C.bg,fontSize:11,fontWeight:'700'},textSendArrow:{fontSize:15},footerNote:{flexDirection:'row',alignItems:'center',gap:9,marginTop:22,paddingHorizontal:4},shield:{color:C.green,fontSize:17},footerCopy:{color:C.muted,fontSize:10,flex:1,lineHeight:15},roomEdit:{margin:16,padding:14,backgroundColor:C.panel,borderRadius:16,borderWidth:1,borderColor:C.line},roomHelp:{color:C.muted,fontSize:11,lineHeight:16,marginBottom:10},roomInput:{height:42,borderRadius:10,borderColor:C.line,borderWidth:1,paddingHorizontal:12,color:C.text,fontSize:12},roomSave:{marginTop:10,alignSelf:'flex-end',paddingHorizontal:18,paddingVertical:10,backgroundColor:C.green,borderRadius:10},roomSaveText:{color:C.bg,fontWeight:'700',fontSize:11},toast:{position:'absolute',bottom:18,left:22,right:22,backgroundColor:'#323b32',borderColor:'rgba(142,217,175,.3)',borderWidth:1,paddingHorizontal:15,paddingVertical:13,borderRadius:13},toastText:{color:C.text,fontSize:12,textAlign:'center'}});

export default App;
