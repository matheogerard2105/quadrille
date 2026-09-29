// Supabase backend for the app build. Exposes the small slice of the Claude `db`
// API that the game uses (doc().get/set, collection().onSnapshot), so the game code
// is identical on the Claude page and in the app.
(function(){
  const PLAYERS='quadrille_players',MATCHES='quadrille_matches';
  const toErr=e=>{const x=new Error((e&&e.message)||'error');
    // 42501 = the server refused the write (wrong secret), 23514 = check constraint failed
    x.code=e&&(e.code==='42501'||e.code==='23514')?'invalid_argument':'unavailable';return x;};
  let client=null;

  // This device's player identity: a random id plus a secret only this device knows.
  // The server stores a hash of the secret and refuses score writes without it.
  function identity(){
    const KEY='quadrille:player';
    try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.pid&&v.secret)return v;}catch(_){}
    const b=new Uint8Array(32);crypto.getRandomValues(b);
    const v={pid:crypto.randomUUID(),secret:[...b].map(x=>x.toString(16).padStart(2,'0')).join('')};
    try{localStorage.setItem(KEY,JSON.stringify(v));}catch(_){}
    return v;
  }

  window.quadrilleDb=async function(){
    const cfg=window.QUADRILLE_CONFIG||{};
    if(!cfg.url||!cfg.anonKey||!window.supabase)return null;
    if(!client)client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const sb=client;
    // Reachability check, so the game can tell the player when the leaderboard is offline.
    const ping=await sb.from(MATCHES).select('code',{head:true,count:'exact'}).limit(1);
    if(ping.error)return null;
    const me=identity(),uid=me.pid;

    function doc(path){
      const p=path.split('/');
      if(p.length===2&&p[0]==='matches')return {
        async get(){const {data,error}=await sb.from(MATCHES).select('*').eq('code',p[1]).maybeSingle();if(error)throw toErr(error);return {id:p[1],exists:!!data,data:()=>data||undefined};},
        async set(d){const {error}=await sb.rpc('quadrille_create_match',{p_code:p[1],p_games:d.games,p_rounds:d.rounds,p_diff:d.diff,p_scoring:d.scoring,p_host:String(d.host||'').slice(0,20)});
          if(error)throw toErr(error);}
      };
      if(p.length===4&&p[0]==='matches'&&p[2]==='players')return {
        async get(){const {data,error}=await sb.from(PLAYERS).select('name,times').eq('code',p[1]).eq('pid',p[3]).maybeSingle();if(error)throw toErr(error);return {id:p[3],exists:!!data,data:()=>data||undefined};},
        async set(d){const {error}=await sb.rpc('quadrille_save_player',{p_code:p[1],p_pid:uid,p_secret:me.secret,p_name:String(d.name||'Joueur').slice(0,20),p_times:d.times||[]});if(error)throw toErr(error);}
      };
      throw new TypeError('Unsupported path: '+path);
    }

    function collection(path){
      const p=path.split('/');
      if(!(p.length===3&&p[0]==='matches'&&p[2]==='players'))throw new TypeError('Unsupported path: '+path);
      return {onSnapshot(next,onErr){
        let alive=true,busy=false,again=false;
        const load=async()=>{if(!alive)return;if(busy){again=true;return;}busy=true;
          try{const {data,error}=await sb.from(PLAYERS).select('pid,name,times').eq('code',p[1]);
            if(!error&&alive)next({docs:data.map(r=>({id:r.pid,exists:true,data:()=>({name:r.name,times:r.times})}))});}
          catch(_){}
          busy=false;if(again){again=false;load();}};
        load();
        const ch=sb.channel('quadrille-'+p[1]+'-'+Math.random().toString(36).slice(2,7))
          .on('postgres_changes',{event:'*',schema:'public',table:PLAYERS,filter:'code=eq.'+p[1]},()=>load())
          .subscribe();
        // Safety net if the realtime socket drops (phone asleep, network switch).
        const iv=setInterval(load,20000);
        const onVis=()=>{if(document.visibilityState==='visible')load();};
        document.addEventListener('visibilitychange',onVis);
        return ()=>{alive=false;clearInterval(iv);document.removeEventListener('visibilitychange',onVis);sb.removeChannel(ch);};
      }};
    }
    return {uid,doc,collection};
  };

  // Native shell niceties (no-ops in a plain browser).
  document.addEventListener('DOMContentLoaded',()=>{
    const P=window.Capacitor&&window.Capacitor.Plugins;if(!P)return;
    if(P.App)P.App.addListener('backButton',()=>{if(!(window.quadrilleBack&&window.quadrilleBack()))P.App.exitApp();});
    if(P.SystemBars){
      const dark=()=>document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);
      const apply=()=>{P.SystemBars.setStyle({style:dark()?'DARK':'LIGHT'}).catch(()=>{});};
      apply();matchMedia('(prefers-color-scheme: dark)').addEventListener('change',apply);
    }
  });
})();
