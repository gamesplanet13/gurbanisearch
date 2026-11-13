/* Pair a Searcher with the Control app over the existing PeerJS connection. */
window.GurbaniSearcherSync = function ({isSearcher, peer, savedCode, identity, saveCode, approve, status, receive, current}) {
 const controllerPrefix='gurbani-control-v1-';
 const codePattern=/^[0-9]{5}$/;
 const links=new Map();
 let target=isSearcher&&codePattern.test(savedCode)?savedCode:'';
 let connecting=null;

 function attach(conn, code) {
  let accepted=false;
  const finish=()=>{
   if(links.get(code)===conn)links.delete(code);
   if(connecting===conn)connecting=null;
  };
  conn.on('open',()=>{
   if(!isSearcher)return;
   conn.send({type:'searcher-sync-request',identity});
  });
  conn.on('data',message=>{
   if(!message||typeof message!=='object')return;
   if(!isSearcher&&!accepted&&message.type==='searcher-sync-request'){
    if(typeof message.identity!=='string'||!/^[0-9a-f]{24}$/.test(message.identity)||
       !approve(code,message.identity)){
     conn.send({type:'searcher-sync-rejected'});
     setTimeout(()=>conn.close(),150);
     return;
    }
    conn.send({type:'searcher-sync-accepted'});
   }else if(isSearcher&&!accepted&&message.type!=='searcher-sync-accepted'){
    if(message.type==='searcher-sync-rejected'){
     status('ਕੰਟਰੋਲ ਨੇ ਜੋੜ ਮਨਜ਼ੂਰ ਨਹੀਂ ਕੀਤਾ। · Control declined pairing.');
     target='';saveCode('');conn.close();
    }
    return;
   }else if(accepted){
    if(message.type==='searcher-sync-shabad'&&(message.content===null||
       (message.content&&typeof message.content.verse==='string'&&message.content.verse.length<=5000))){
     receive(message.content);
    }
    return;
   }else if(!isSearcher)return;
   accepted=true;
   if(connecting===conn)connecting=null;
   if(links.has(code)&&links.get(code)!==conn)links.get(code).close();
   links.set(code,conn);
   if(isSearcher)saveCode(code);
   status('ਜੋੜ ਹੋ ਗਿਆ। · Searcher and Control linked.');
   const content=isSearcher?current():null;
   if(content&&conn.open)conn.send({type:'searcher-sync-shabad',content});
  });
  conn.on('close',finish);
  conn.on('error',finish);
  setTimeout(()=>{if(!accepted)conn.close()},30000);
 }

 return {
  accept(conn) {
   if(conn.metadata?.type!=='gurbani-searcher-sync-v1')return false;
   const code=conn.peer.startsWith(controllerPrefix)?conn.peer.slice(controllerPrefix.length):'';
   if(isSearcher||!codePattern.test(code)){conn.close();return true;}
   attach(conn,code);
   return true;
  },
  connect(code=target) {
   if(!isSearcher||!codePattern.test(code))return;
   if(code!==target){
    for(const c of links.values())c.close();
    connecting?.close();
    connecting=null;
   }
   target=code;
   const p=peer();
   if(!p?.open||p.disconnected||links.has(code)||connecting)return;
   connecting=p.connect(controllerPrefix+code,{reliable:true,metadata:{type:'gurbani-searcher-sync-v1'}});
   attach(connecting,code);
  },
  disconnect() {
   target='';saveCode('');
   connecting?.close();connecting=null;
   for(const conn of links.values())conn.close();
   links.clear();
  },
  send(content) {
   let sent=false;
   for(const conn of links.values()){
    if(conn.open)try{conn.send({type:'searcher-sync-shabad',content});sent=true}catch(_){}
   }
   return sent;
  }
 };
};
