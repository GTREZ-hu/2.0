const menuBtn=document.getElementById('menuBtn');
const navLinks=document.getElementById('mainNav') || document.getElementById('navLinks');
const siteLoader=document.getElementById('siteLoader');
if(document.body.classList.contains('account-page')){
  try{
    const settings=JSON.parse(localStorage.getItem('alpar-interface-settings') || '{}');
    if(settings.motion) document.body.dataset.motion=settings.motion;
  }catch(_){ }
  document.querySelectorAll('.reveal.visible').forEach(el=>el.classList.remove('visible'));
}
if(window.location.protocol==='file:'){
  const fileName=window.location.pathname.split(/[\\/]/).pop() || 'index.html';
  const targetFile=fileName.toLowerCase()==='index.html' ? '' : fileName;
  const targetUrl=`http://localhost:3000/${targetFile}${window.location.search}${window.location.hash}`;
  if(siteLoader){
    const label=siteLoader.querySelector('.loader-panel strong');
    const text=siteLoader.querySelector('.loader-panel p');
    if(label) label.textContent='HTTP inditas';
    if(text) text.textContent='Atiranyitas a helyi szerverre.';
  }
  window.setTimeout(()=>{ window.location.href=targetUrl; },450);
}
if(siteLoader){
  const isMapPage=document.body.classList.contains('map-page');
  const hideLoader=()=>{
    siteLoader.classList.add('is-hidden','hide');
    document.body.classList.remove('app-preparing');
    document.body.classList.add('app-ready');
    window.setTimeout(()=>siteLoader.remove(),900);
  };
  const minDelay=new Promise(resolve=>window.setTimeout(resolve,isMapPage?900:520));
  const pageReady=new Promise(resolve=>{
    if(document.readyState==='complete') resolve();
    else window.addEventListener('load',resolve,{once:true});
  });
  const mapReady=isMapPage
    ? new Promise(resolve=>{
      if(document.body.dataset.mapState==='ready' || document.body.dataset.mapState==='error'){
        resolve();
        return;
      }
      window.addEventListener('alpar3d:ready',resolve,{once:true});
      window.addEventListener('alpar3d:error',resolve,{once:true});
      window.setTimeout(resolve,45000);
    })
    : Promise.resolve();
  Promise.all([minDelay,pageReady,mapReady]).then(hideLoader);
}
if(menuBtn && navLinks){
  menuBtn.addEventListener('click',()=>{
    const open=navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded',String(open));
  });
}
document.querySelectorAll('#mainNav a,.nav-links a').forEach(a=>a.addEventListener('click',()=>{
  if(navLinks) navLinks.classList.remove('open');
  if(menuBtn) menuBtn.setAttribute('aria-expanded','false');
}));

const year=document.getElementById('year');
if(year) year.textContent=new Date().getFullYear();

const escapeHtml=value=>String(value)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#039;');

const escapeAttr=value=>String(value)
  .replace(/&/g,'&amp;')
  .replace(/"/g,'&quot;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;');

const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cursorGlow=document.getElementById('cursorGlow');
if(cursorGlow && !prefersReducedMotion){
  let cursorFrame=0;
  let cursorX=0;
  let cursorY=0;
  window.addEventListener('mousemove',e=>{
    cursorX=e.clientX;
    cursorY=e.clientY;
    if(cursorFrame) return;
    cursorFrame=requestAnimationFrame(()=>{
      cursorGlow.style.left=cursorX+'px';
      cursorGlow.style.top=cursorY+'px';
      cursorFrame=0;
    });
  },{passive:true});
}else if(cursorGlow){
  cursorGlow.hidden=true;
}

if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) entry.target.classList.add('visible');
    });
  },{threshold:.14});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}else{
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
}

const counters=document.querySelectorAll('[data-count]');
if('IntersectionObserver' in window && !prefersReducedMotion){
  const counterObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target;
      const target=Number(el.dataset.count);
      let current=0;
      const step=Math.max(1,Math.ceil(target/48));
      const timer=setInterval(()=>{
        current+=step;
        if(current>=target){current=target;clearInterval(timer)}
        el.textContent=current;
      },24);
      counterObserver.unobserve(el);
    });
  },{threshold:.6});
  counters.forEach(c=>counterObserver.observe(c));
}else{
  counters.forEach(c=>c.textContent=c.dataset.count);
}

const magnetic=document.querySelectorAll('.magnetic');
magnetic.forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const rect=btn.getBoundingClientRect();
    const x=e.clientX-rect.left-rect.width/2;
    const y=e.clientY-rect.top-rect.height/2;
    btn.style.transform=`translate(${x*.12}px,${y*.18}px)`;
  });
  btn.addEventListener('mouseleave',()=>btn.style.transform='translate(0,0)');
});

document.addEventListener('pointerdown',event=>{
  if(prefersReducedMotion) return;
  const control=event.target.closest('.btn,.map-preset,.map-tool,.map-open,.feed-action,.comment-form button,.phone-app,.conversation-item');
  if(!control) return;
  const rect=control.getBoundingClientRect();
  const ripple=document.createElement('span');
  const size=Math.max(rect.width,rect.height);
  ripple.className='ui-ripple';
  ripple.style.width=ripple.style.height=`${size}px`;
  ripple.style.left=`${event.clientX-rect.left-size/2}px`;
  ripple.style.top=`${event.clientY-rect.top-size/2}px`;
  control.appendChild(ripple);
  ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
});

const enhanceMediaReveal=(root=document)=>{
  root.querySelectorAll('.hero-card img,.stack-main,.stack-float,.gallery img,.feed-media img,.feed-media video,.media-open img').forEach(media=>{
    if(media.classList.contains('media-reveal')) return;
    media.classList.add('media-reveal');
    if(media.complete || media.readyState >= 1){
      media.classList.add('is-loaded');
      return;
    }
    const markLoaded=()=>media.classList.add('is-loaded');
    media.addEventListener('load',markLoaded,{once:true});
    media.addEventListener('loadedmetadata',markLoaded,{once:true});
  });
};
enhanceMediaReveal();

const nav=document.querySelector('.nav');
if(nav){
  let scrollFrame=0;
  window.addEventListener('scroll',()=>{
    if(scrollFrame) return;
    scrollFrame=requestAnimationFrame(()=>{
      nav.style.transform=window.scrollY>40?'translateY(-2px) scale(.985)':'translateY(0) scale(1)';
      scrollFrame=0;
    });
  },{passive:true});
}

const ambientImages=[
  'https://wallpapers.com/images/hd/fivem-ykcvktraxgpoh1r4.jpg',
  'https://wallpapers.com/images/hd/fivem-y8h4p06hlyfcygs6.jpg',
  'https://wallpapers.com/images/hd/fivem-vinewood-sunset-fj9du4on3g99iing.jpg',
  'https://wallpapers.com/images/hd/fivem-car-water-tank-6tczg02u1eel7aox.jpg',
  'https://wallpapers.com/images/hd/customize-your-own-gaming-experience-with-fivem-sa8288834sp35ngu.jpg'
];

const ambientLayers=document.querySelectorAll('.ambient-bg-layer');
let ambientIndex=0;
let activeAmbientLayer=0;

ambientImages.forEach(src=>{
  const img=new Image();
  img.src=src;
});

if(ambientLayers.length){
  ambientLayers[0].style.backgroundImage=`url('${ambientImages[0]}')`;
  ambientLayers[1].style.backgroundImage=`url('${ambientImages[1]}')`;

  if(!prefersReducedMotion){
    setInterval(()=>{
      ambientIndex=(ambientIndex+1)%ambientImages.length;
      const nextLayer=1-activeAmbientLayer;
      ambientLayers[nextLayer].style.backgroundImage=`url('${ambientImages[ambientIndex]}')`;
      ambientLayers[nextLayer].classList.add('is-active');
      ambientLayers[activeAmbientLayer].classList.remove('is-active');
      activeAmbientLayer=nextLayer;
    },6500);
  }
}

const cityMap=document.getElementById('cityMap');
const mapOpen=document.getElementById('mapOpen');
const mapReset=document.getElementById('mapReset');
const mapX=document.getElementById('mapX');
const mapY=document.getElementById('mapY');
const mapZ=document.getElementById('mapZ');
const mapPresets=document.querySelectorAll('.map-preset');
const mapZoomIn=document.getElementById('mapZoomIn');
const mapZoomOut=document.getElementById('mapZoomOut');
const policeRadius=document.getElementById('policeRadius');
const policeRadiusValue=document.getElementById('policeRadiusValue');
const mapPoliceZone=document.getElementById('mapPoliceZone');
let mapState={x:0,y:0,z:2};

const setMap=(nextState,activeButton)=>{
  mapState={
    x:Number(nextState.x),
    y:Number(nextState.y),
    z:Math.min(6,Math.max(1,Number(nextState.z)))
  };
  const url=`https://forge.plebmasters.de/map?x=${mapState.x}&y=${mapState.y}&z=${mapState.z}&b=Realmap&o=`;
  if(cityMap) cityMap.src=url;
  if(mapOpen) mapOpen.href=url;
  if(window.Alpar3DMap) window.Alpar3DMap.focusToWorld(mapState);
  if(mapX) mapX.textContent=mapState.x;
  if(mapY) mapY.textContent=mapState.y;
  if(mapZ) mapZ.textContent=mapState.z;
  if(activeButton){
    mapPresets.forEach(btn=>btn.classList.remove('is-active'));
    activeButton.classList.add('is-active');
  }
};

mapPresets.forEach(btn=>{
  btn.addEventListener('click',()=>setMap(btn.dataset,btn));
});

if(mapZoomIn){
  mapZoomIn.addEventListener('click',()=>setMap({...mapState,z:mapState.z+1}));
}

if(mapZoomOut){
  mapZoomOut.addEventListener('click',()=>setMap({...mapState,z:mapState.z-1}));
}

if(mapReset){
  mapReset.addEventListener('click',()=>{
    mapState={x:0,y:0,z:3};
    if(window.Alpar3DMap) window.Alpar3DMap.resetView();
    if(window.Alpar3DMap && window.Alpar3DMap.clearRoute) window.Alpar3DMap.clearRoute();
    if(mapX) mapX.textContent=mapState.x;
    if(mapY) mapY.textContent=mapState.y;
    if(mapZ) mapZ.textContent=mapState.z;
    mapPresets.forEach(btn=>btn.classList.remove('is-active'));
    const centerPreset=document.querySelector('.map-preset[data-x="0"][data-y="0"]');
    if(centerPreset) centerPreset.classList.add('is-active');
  });
}

if(policeRadius){
  policeRadius.addEventListener('input',()=>{
    if(policeRadiusValue) policeRadiusValue.textContent=policeRadius.value;
    if(window.Alpar3DMap && window.Alpar3DMap.setPoliceZoneRadius) {
      window.Alpar3DMap.setPoliceZoneRadius(policeRadius.value);
    }
  });
}

if(mapPoliceZone){
  mapPoliceZone.addEventListener('click',()=>{
    const point=window.Alpar3DMap && window.Alpar3DMap.hoveredWorld;
    if(!point || !window.Alpar3DMap || !window.Alpar3DMap.setSelectedPoint) return;
    window.Alpar3DMap.setSelectedPoint(point,{radius:policeRadius ? policeRadius.value : 420});
  });
}

window.addEventListener('alpar3d:hover',event=>{
  const point=event.detail;
  if(!point) return;
  if(mapX) mapX.textContent=point.x.toFixed(0);
  if(mapY) mapY.textContent=point.y.toFixed(0);
  if(mapZ) mapZ.textContent=point.z.toFixed(0);
});

const authLogin=document.getElementById('authLogin');
const authUser=document.getElementById('authUser');
const authAvatar=document.getElementById('authAvatar');
const authName=document.getElementById('authName');
const authId=document.getElementById('authId');
const authRegistered=document.getElementById('authRegistered');
const authLogout=document.getElementById('authLogout');
const authMessage=document.getElementById('authMessage');

const authMessages={
  success:'Sikeres Discord belépés. A profil mentve lett.',
  'missing-discord-config':'Hiányzik a Discord client id vagy secret a szerver környezetéből.',
  'invalid-state':'A Discord belépés biztonsági ellenőrzése nem sikerült. Próbáld újra.',
  'discord-error':'A Discord belépés közben hiba történt. Ellenőrizd a redirect URI-t és a client secretet.'
};

const setAuthMessage=message=>{
  if(authMessage) authMessage.textContent=message || '';
};

const showUser=user=>{
  if(!authLogin || !authUser) return;
  authLogin.hidden=Boolean(user);
  authUser.hidden=!user;
  if(!user) return;
  authAvatar.src=user.avatarUrl;
  authName.textContent=user.globalName || user.username;
  authId.textContent=user.id;
  authRegistered.textContent=new Date(user.registeredAt).toLocaleString('hu-HU');
};

const loadUser=async()=>{
  try{
    const previewButton=document.querySelector('.auth-discord[href$="user.html"]');
    if(previewButton){
      setAuthMessage('Belépés kihagyva. A gomb az előnézeti felhasználói felületre visz.');
      return;
    }

    if(window.location.protocol==='file:'){
      const discordButton=document.querySelector('.auth-discord');
      if(discordButton) discordButton.href='user.html';
      setAuthMessage('Belépés kihagyva. A gomb az előnézeti felhasználói felületre visz.');
      return;
    }

    const params=new URLSearchParams(window.location.search);
    const authStatus=params.get('auth');
    if(authStatus) setAuthMessage(authMessages[authStatus] || '');

    const response=await fetch('/api/me');
    if(!response.ok) return;
    const data=await response.json();
    showUser(data.user);
  }catch(error){
    setAuthMessage('A fiókpanel csak a Node szerveren keresztül működik.');
  }
};

if(authLogout){
  authLogout.addEventListener('click',async()=>{
    await fetch('/api/logout',{method:'POST'});
    showUser(null);
    setAuthMessage('Kijelentkeztél.');
  });
}

loadUser();

const randomInt=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const shuffle=array=>array.map(value=>({value,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(item=>item.value);

const inventoryPool=[
  {name:'phone',label:'Telefon',min:1,max:1,weight:.2,icon:'📱',description:'Okostelefon kontaktokhoz, bankhoz es uzenetekhez.'},
  {name:'water',label:'Viz',min:1,max:8,weight:.4,icon:'💧',description:'Palackozott viz hosszabb muszakokra.'},
  {name:'burger',label:'Burger',min:1,max:5,weight:.6,icon:'🍔',description:'Gyors kaja, ha merul az energia.'},
  {name:'radio',label:'Radio',min:1,max:1,weight:.8,icon:'📻',description:'Frakcios kommunikaciohoz hasznalt radio.'},
  {name:'lockpick',label:'Lockpick',min:1,max:6,weight:.15,icon:'🧰',description:'Finom kezu munkakhoz. Csak RP szerint.'},
  {name:'bandage',label:'Kotszer',min:1,max:8,weight:.1,icon:'➕',description:'Alap elsosegely felszereles.'},
  {name:'flashlight',label:'Lampa',min:1,max:1,weight:.5,icon:'🔦',description:'Sotet helyek atvizsgalasahoz.'},
  {name:'car_key',label:'Jarmu kulcs',min:1,max:3,weight:.05,icon:'🔑',description:'Sajat jarmuvek inditasahoz.'},
  {name:'repairkit',label:'Repair Kit',min:1,max:3,weight:1.2,icon:'🛠️',description:'Gyors jarmu javitas terepen.'},
  {name:'armor',label:'Armor',min:1,max:2,weight:2.5,icon:'🛡️',description:'Vedofelszereles veszelyes helyzetekhez.'},
  {name:'medkit',label:'Medkit',min:1,max:2,weight:1.4,icon:'💊',description:'Komolyabb serulesek ellatasara.'},
  {name:'usb',label:'Encrypted USB',min:1,max:1,weight:.1,icon:'💾',description:'Titkositott adathordozo.'},
  {name:'goldbar',label:'Aranyrud',min:1,max:4,weight:1.8,icon:'🟨',description:'Nagy erteku, gyanus eredetu targy.'},
  {name:'casino_chip',label:'Casino Chip',min:20,max:250,weight:.01,icon:'🎲',description:'Kaszinoban hasznalhato zseton.'},
  {name:'spraycan',label:'Spray',min:1,max:3,weight:.7,icon:'🧴',description:'Graffiti es teruletjeloles kellék.'},
  {name:'evidence_bag',label:'Evidence Bag',min:1,max:5,weight:.05,icon:'📦',description:'Bizonyitek tarolasara alkalmas zacskó.'}
];

const vehiclePool=[
  'Sultan RS','Elegy Retro','Baller LE','Hakuchou','Kuruma','Comet S2','Buffalo STX','Dominator GTX','Jester Classic','Sentinel XS','Dubsta 6x6','Futo GTX'
];
const garagePool=['Legion Square','Vinewood','Paleto Bay','Sandy Shores','Mirror Park','Del Perro','Davis'];
const statusPool=['Elérhető','Elérhető','Elérhető','Szervizben','Lefoglalva'];
const marketImages=[
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80'
];

const createRandomInventory=()=>{
  const slots=30;
  const usedSlots=shuffle(Array.from({length:slots},(_,index)=>index+1)).slice(0,randomInt(8,15));
  const items=shuffle(inventoryPool).slice(0,usedSlots.length).map((item,index)=>({
    ...item,
    slot:usedSlots[index],
    count:randomInt(item.min,item.max)
  })).sort((a,b)=>a.slot-b.slot);

  return {
    money:{
      cash:randomInt(1800,85000),
      bank:randomInt(42000,420000),
      dirty:randomInt(0,65000)
    },
    maxWeight:35,
    items,
    slots
  };
};

const createRandomVehicles=()=>{
  return shuffle(vehiclePool).slice(0,randomInt(4,8)).map((model,index)=>({
    model,
    plate:`ALP-${randomInt(100,999)}`,
    garage:garagePool[randomInt(0,garagePool.length-1)],
    fuel:randomInt(12,100),
    engine:randomInt(35,100),
    body:randomInt(28,100),
    status:statusPool[randomInt(0,statusPool.length-1)]
  }));
};

const createMarketListings=()=>[
  {
    id:'car-ad-1',
    model:'Sultan RS',
    seller:'Benny Motors',
    price:78000,
    saleMode:'online',
    image:marketImages[0],
    mileage:randomInt(18000,98000),
    condition:'Jó állapot',
    description:'Utcai tuning, friss olajcsere, kisebb karcok a hátsó lökhárítón. Online foglalható és megvásárolható.'
  },
  {
    id:'car-ad-2',
    model:'Elegy Retro',
    seller:'Alpár játékos',
    price:125000,
    saleMode:'meet',
    image:marketImages[1],
    mileage:randomInt(12000,62000),
    condition:'Prémium',
    description:'Ritka konfiguráció, személyes találkozóval, próbakörrel. Csak RP adásvétel után vihető.'
  },
  {
    id:'car-ad-3',
    model:'Baller LE',
    seller:'Civil Network',
    price:54000,
    saleMode:'online',
    image:marketImages[2],
    mileage:randomInt(40000,140000),
    condition:'Használt',
    description:'Napi használatra tökéletes SUV. Online fizetés után a garázsba kerülne.'
  },
  {
    id:'car-ad-4',
    model:'Comet S2',
    seller:'Vinewood Dealer',
    price:210000,
    saleMode:'meet',
    image:marketImages[3],
    mileage:randomInt(7000,38000),
    condition:'Megkímélt',
    description:'Gyűjtői darab, teljes előélettel. Személyes üzlet, részletfizetés nem.'
  }
];

let playerInventory=createRandomInventory();
let playerVehicles=createRandomVehicles();
let carMarketListings=createMarketListings();

const formatMoney=value=>'$'+value.toLocaleString('en-US');

const renderInventory=()=>{
  const grid=document.getElementById('inventoryGrid');
  if(!grid) return;
  const totalWeight=playerInventory.items.reduce((sum,item)=>sum+(item.weight*item.count),0);
  document.getElementById('cashValue').textContent=formatMoney(playerInventory.money.cash);
  document.getElementById('bankValue').textContent=formatMoney(playerInventory.money.bank);
  document.getElementById('dirtyValue').textContent=formatMoney(playerInventory.money.dirty);
  document.getElementById('inventoryWeight').textContent=`${totalWeight.toFixed(1)} / ${playerInventory.maxWeight} kg`;
  document.getElementById('inventorySlots').textContent=`${playerInventory.items.length} / ${playerInventory.slots} slot`;

  const itemBySlot=new Map(playerInventory.items.map(item=>[item.slot,item]));
  grid.innerHTML='';
  for(let slot=1;slot<=playerInventory.slots;slot++){
    const item=itemBySlot.get(slot);
    const button=document.createElement('button');
    button.className='inventory-slot';
    button.type='button';
    button.innerHTML=item
      ? `<span class="slot-index">${slot}</span><strong>${item.icon}</strong><b>${item.label}</b><small>x${item.count}</small>`
      : `<span class="slot-index">${slot}</span>`;
    if(item){
      button.addEventListener('click',()=>selectInventoryItem(item,button));
    }
    grid.appendChild(button);
  }

  const firstItemButton=grid.querySelector('.inventory-slot:not(:empty)');
  if(playerInventory.items[0] && firstItemButton) selectInventoryItem(playerInventory.items[0],firstItemButton);
};

const selectInventoryItem=(item,button)=>{
  document.querySelectorAll('.inventory-slot').forEach(slot=>slot.classList.remove('is-active'));
  button.classList.add('is-active');
  document.getElementById('itemTitle').textContent=item.label;
  document.getElementById('itemDescription').textContent=item.description;
  document.getElementById('itemCount').textContent=`x${item.count}`;
  document.getElementById('itemWeight').textContent=`${(item.weight*item.count).toFixed(2)} kg`;
};

const renderGarage=()=>{
  const grid=document.getElementById('garageGrid');
  if(!grid) return;
  document.getElementById('vehicleCount').textContent=playerVehicles.length;
  document.getElementById('availableVehicles').textContent=playerVehicles.filter(vehicle=>vehicle.status==='Elérhető').length;
  grid.innerHTML=playerVehicles.map(vehicle=>`
    <article class="garage-card">
      <div class="garage-card-head">
        <span>${escapeHtml(vehicle.plate)}</span>
        <b>${escapeHtml(vehicle.status)}</b>
      </div>
      <h3>${escapeHtml(vehicle.model)}</h3>
      <p>${escapeHtml(vehicle.garage)}</p>
      <div class="vehicle-bars">
        <label>Fuel <span>${vehicle.fuel}%</span><i style="--value:${vehicle.fuel}%"></i></label>
        <label>Engine <span>${vehicle.engine}%</span><i style="--value:${vehicle.engine}%"></i></label>
        <label>Body <span>${vehicle.body}%</span><i style="--value:${vehicle.body}%"></i></label>
      </div>
      <button class="map-preset ${vehicle.status==='Elérhető'?'is-active':''}" type="button">${vehicle.status==='Elérhető'?'Kihozás':'Nem elérhető'}</button>
    </article>
  `).join('');
};

const renderCarMarket=()=>{
  const grid=document.getElementById('carMarketGrid');
  if(!grid) return;
  document.getElementById('marketCount').textContent=carMarketListings.length;
  document.getElementById('marketOnlineCount').textContent=carMarketListings.filter(item=>item.saleMode==='online').length;
  grid.innerHTML=carMarketListings.map(listing=>`
    <article class="car-ad-card" data-id="${escapeAttr(listing.id)}">
      <a href="${escapeAttr(listing.image)}" class="media-open glightbox" data-gallery="car-market" data-type="image" data-glightbox="title: ${escapeAttr(listing.model)}; description: ${escapeAttr(listing.description)}">
        <img src="${escapeAttr(listing.image)}" alt="${escapeAttr(listing.model)} hirdetes" loading="lazy" decoding="async" />
      </a>
      <div class="car-ad-body">
        <span class="auth-badge">${listing.saleMode==='online'?'Online megvehető':'Személyes üzlet'}</span>
        <h3>${escapeHtml(listing.model)}</h3>
        <p>${escapeHtml(listing.description)}</p>
        <div class="car-ad-meta">
          <span>Ár <b>${formatMoney(listing.price)}</b></span>
          <span>Km <b>${listing.mileage.toLocaleString('hu-HU')}</b></span>
          <span>Állapot <b>${escapeHtml(listing.condition)}</b></span>
        </div>
        <div class="car-ad-actions">
          <button class="feed-action" data-action="message" type="button">Érdeklődés</button>
          <button class="feed-action ${listing.saleMode==='online'?'is-active':''}" data-action="${listing.saleMode==='online'?'buy':'meet'}" type="button">
            ${listing.saleMode==='online'?'Online vétel':'Találkozó'}
          </button>
        </div>
      </div>
    </article>
  `).join('');
  enhanceMediaReveal(grid);
  if(window.GLightbox) GLightbox({selector:'.glightbox'});
};

renderInventory();
renderGarage();
renderCarMarket();

const randomizeInventory=document.getElementById('randomizeInventory');
if(randomizeInventory){
  randomizeInventory.addEventListener('click',()=>{
    playerInventory=createRandomInventory();
    playerVehicles=createRandomVehicles();
    renderInventory();
    renderGarage();
  });
}

const carAdForm=document.getElementById('carAdForm');
if(carAdForm){
  carAdForm.addEventListener('submit',event=>{
    event.preventDefault();
    const listing={
      id:`car-ad-${Date.now()}`,
      model:document.getElementById('carAdModel').value.trim(),
      seller:'Saját hirdetés',
      price:Number(document.getElementById('carAdPrice').value || 0),
      saleMode:document.getElementById('carAdSaleMode').value,
      image:document.getElementById('carAdImage').value.trim(),
      mileage:randomInt(1000,160000),
      condition:'Feladott hirdetés',
      description:document.getElementById('carAdDescription').value.trim()
    };
    carMarketListings.unshift(listing);
    carAdForm.reset();
    renderCarMarket();
  });
}

const carMarketGrid=document.getElementById('carMarketGrid');
if(carMarketGrid){
  carMarketGrid.addEventListener('click',event=>{
    const button=event.target.closest('button[data-action]');
    if(!button) return;
    const card=button.closest('.car-ad-card');
    const listing=carMarketListings.find(item=>item.id===card.dataset.id);
    if(!listing) return;
    if(button.dataset.action==='message'){
      openMarketConversation(listing,`Szia! Erdeklodnek a(z) ${listing.model} hirdetes irant. Megvan meg?`);
    }
    if(button.dataset.action==='buy'){
      openMarketConversation(listing,`Szeretnem online megvasarolni/foglalni a(z) ${listing.model} autot ${formatMoney(listing.price)} aron.`);
    }
    if(button.dataset.action==='meet'){
      openMarketConversation(listing,`Szia! A(z) ${listing.model} auto miatt szemelyes talalkozot szeretnek egyeztetni.`);
    }
  });
}

const demoConversations=[
  {id:'staff',name:'Staff Support',role:'Admin',unread:2,messages:[
    {from:'them',text:'Szia! A whitelist lapodat megkaptuk.'},
    {from:'me',text:'Koszi, mikor varhato valasz?'},
    {from:'them',text:'Ma este atnezzuk, figyeld a panelt.'}
  ]},
  {id:'lspd',name:'LSPD Diszpécser',role:'Faction',unread:1,messages:[
    {from:'them',text:'Jarorszolgalat 20:00-kor indul.'},
    {from:'me',text:'Vettem, ott leszek a kapitanysagon.'}
  ]},
  {id:'mechanic',name:'Benny szerelo',role:'Business',unread:0,messages:[
    {from:'them',text:'A Sultan RS keszen van, uj turbo bekerult.'},
    {from:'me',text:'Megyek erte 10 perc mulva.'}
  ]}
];
let activeConversation=demoConversations[0];

const openMarketConversation=(listing,message)=>{
  const convoId=`car-${listing.id}`;
  let conversation=demoConversations.find(item=>item.id===convoId);
  if(!conversation){
    conversation={
      id:convoId,
      name:`Auto hirdetes • ${listing.model}`,
      role:listing.saleMode==='online'?'Online adasvetel':'Szemelyes uzlet',
      unread:0,
      messages:[
        {from:'them',text:`Hirdetes: ${listing.model} • ${formatMoney(listing.price)} • ${listing.condition}`},
        {from:'them',text:listing.description}
      ]
    };
    demoConversations.unshift(conversation);
  }
  conversation.messages.push({from:'me',text:message});
  conversation.unread=0;
  activeConversation=conversation;
  renderMessenger();
  document.getElementById('messenger')?.scrollIntoView({behavior:'smooth',block:'start'});
};

const feedAuthors=['LSPD','EMS','Benny Motors','Alpar News','Civil Network','Staff Team'];
const feedTexts=[
  'Ma este illegal meet a dokkok kornyeken, rendori jelenlet varhato.',
  'Uj kozossegi event indul: varosi cruise Vinewoodbol.',
  'A szerver restart utan uj optimalizacios patch elesedik.',
  'Elindult a Mechanic felvetel, jelentkezes a panelen.',
  'Paleto kornyeken fokozott ellenorzes van ervenyben.'
];
const mediaImages=[
  'https://wallpapers.com/images/hd/fivem-ykcvktraxgpoh1r4.jpg',
  'https://wallpapers.com/images/hd/fivem-y8h4p06hlyfcygs6.jpg',
  'https://wallpapers.com/images/hd/fivem-vinewood-sunset-fj9du4on3g99iing.jpg',
  'https://wallpapers.com/images/hd/fivem-car-water-tank-6tczg02u1eel7aox.jpg',
  'https://wallpapers.com/images/hd/customize-your-own-gaming-experience-with-fivem-sa8288834sp35ngu.jpg'
];

const detectMediaType=(url,type='auto')=>{
  if(!url) return 'none';
  if(type!=='auto') return type;
  if(/(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm)(\?|$|\/)/i.test(url)) return 'video';
  return 'image';
};

const youtubeId=url=>{
  try{
    const parsed=new URL(String(url));
    if(parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/','').split('/')[0] || null;
    if(parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
    if(parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
    return parsed.searchParams.get('v');
  }catch(error){
    const match=String(url).match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  }
};

const vimeoId=url=>{
  try{
    const parsed=new URL(String(url));
    if(!parsed.hostname.includes('vimeo.com')) return null;
    return parsed.pathname.split('/').filter(Boolean).pop() || null;
  }catch(error){
    const match=String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  }
};

const isDirectVideo=url=>/\.(mp4|webm|ogg)(\?|#|$)/i.test(String(url));

const youtubeEmbed=url=>{
  const id=youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : null;
};

const videoEmbed=url=>{
  const youtube=youtubeEmbed(url);
  if(youtube) return {type:'iframe',src:youtube};
  const vimeo=vimeoId(url);
  if(vimeo) return {type:'iframe',src:`https://player.vimeo.com/video/${vimeo}?autoplay=1`};
  if(isDirectVideo(url)) return {type:'video',src:url};
  return {type:'unsupported',src:url};
};

const createFeedPosts=()=>shuffle(feedTexts).map((text,index)=>({
  id:`post-${Date.now()}-${index}-${randomInt(100,999)}`,
  author:feedAuthors[randomInt(0,feedAuthors.length-1)],
  text,
  mediaUrl:mediaImages[index%mediaImages.length],
  mediaType:'image',
  likes:randomInt(12,340),
  liked:false,
  shares:randomInt(0,24),
  comments:randomInt(0,48),
  commentList:[
    {author:'Alpár játékos',text:'Ez nagyon adja.'},
    {author:'Civil Network',text:'Talalkozunk a varosban.'}
  ].slice(0,randomInt(0,2)),
  time:`${randomInt(2,58)} perce`
}));
let feedPosts=createFeedPosts();

const demoCharacter={
  name:'Makai Aron',
  job:'Civil / Vállalkozó',
  faction:'Nincs frakcióban',
  playtime:'42 óra',
  licenses:['B kategória','Fegyverengedély: nincs','Horgászengedély'],
  record:['Gyorshajtás figyelmeztetés','Nincs aktív körözés']
};
const demoWhitelist={status:'Elbírálás alatt',progress:68,note:'Staff review folyamatban. Kovetkezo lepes: szobeli beszelgetes.'};
const demoFaction={name:'Mechanic',rank:'Próbaidős',duty:'Offline',members:18,balance:'$1,245,000'};
let tickets=[
  {title:'Whitelist kerdes',category:'Whitelist',status:'Nyitott',last:'Staff válaszra vár'},
  {title:'Eltunt jarmu',category:'Bug report',status:'Folyamatban',last:'Log ellenorzes alatt'}
];
const phoneApps=[
  {id:'sms',name:'SMS',icon:'💬',detail:'3 olvasatlan uzenet. Utolso: Staff Support'},
  {id:'bank',name:'Bank',icon:'🏦',detail:'Egyenleg: '+formatMoney(playerInventory.money.bank)},
  {id:'garage',name:'Garázs',icon:'🚗',detail:`${playerVehicles.length} jarmu regisztralva.`},
  {id:'map',name:'Térkép',icon:'🗺️',detail:'Gyorspontok: Legion, Paleto, Sandy.'},
  {id:'cars',name:'Autópiac',icon:'🚘',detail:`${carMarketListings.length} aktiv hasznalt auto hirdetes.`},
  {id:'ads',name:'Hirdetések',icon:'📢',detail:'3 aktiv RP hirdetes a varosfalon.'},
  {id:'contacts',name:'Kontaktok',icon:'👥',detail:'LSPD, EMS, Mechanic, Staff.'}
];

const renderMessenger=()=>{
  const list=document.getElementById('conversationList');
  const messages=document.getElementById('chatMessages');
  const header=document.getElementById('chatHeader');
  if(!list || !messages || !header) return;
  document.getElementById('unreadMessages').textContent=`${demoConversations.reduce((sum,item)=>sum+item.unread,0)} unread`;
  list.innerHTML=demoConversations.map(convo=>`
    <button class="conversation-item ${convo.id===activeConversation.id?'is-active':''}" data-id="${convo.id}" type="button">
      <b>${escapeHtml(convo.name)}</b><span>${escapeHtml(convo.role)}</span>${convo.unread?`<i>${convo.unread}</i>`:''}
    </button>
  `).join('');
  header.textContent=`${activeConversation.name} • ${activeConversation.role}`;
  messages.innerHTML=activeConversation.messages.map(message=>`
    <div class="chat-bubble ${message.from==='me'?'is-me':''}">${escapeHtml(message.text)}</div>
  `).join('');
  messages.scrollTop=messages.scrollHeight;
  list.querySelectorAll('.conversation-item').forEach(button=>{
    button.addEventListener('click',()=>{
      activeConversation=demoConversations.find(convo=>convo.id===button.dataset.id);
      activeConversation.unread=0;
      renderMessenger();
    });
  });
};

const renderFeed=()=>{
  const grid=document.getElementById('feedGrid');
  if(!grid) return;
  grid.innerHTML=feedPosts.map(post=>`
    <article class="feed-post" data-id="${post.id}">
      ${renderPostMedia(post)}
      <div><span>${escapeHtml(post.author)} • ${escapeHtml(post.time)}</span><p>${escapeHtml(post.text)}</p></div>
      <footer>
        <button class="feed-action ${post.liked?'is-active':''}" data-action="like" type="button">♥ ${post.likes}</button>
        <button class="feed-action" data-action="comment" type="button">💬 ${post.comments+post.commentList.length}</button>
        <button class="feed-action" data-action="share" type="button">↗ ${post.shares}</button>
      </footer>
      <div class="comment-box" hidden>
        <div class="comment-list">${post.commentList.map(comment=>`<p><b>${escapeHtml(comment.author)}</b> ${escapeHtml(comment.text)}</p>`).join('')}</div>
        <form class="comment-form">
          <input type="text" placeholder="Komment irasa..." required />
          <button type="submit">Kuldes</button>
        </form>
      </div>
    </article>
  `).join('');
  enhanceMediaReveal(grid);
  bindFeedActions();
  bindVideoLightboxActions();
  refreshMediaLightbox();
};

const renderPostMedia=post=>{
  if(!post.mediaUrl) return '';
  if(post.mediaType==='video'){
    const id=youtubeId(post.mediaUrl);
    const thumb=post.thumbnailUrl || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '');
    const preview=thumb
      ? `<img src="${escapeAttr(thumb)}" alt="RP feed video" />`
      : isDirectVideo(post.mediaUrl)
        ? `<video src="${escapeAttr(post.mediaUrl)}" muted preload="metadata" playsinline></video>`
        : `<div class="video-thumb-empty"><strong>VIDEO</strong><span>Nincs indexkép</span></div>`;
    return `<a href="${escapeAttr(post.mediaUrl)}" class="feed-media feed-video video-popup" data-video="${escapeAttr(post.mediaUrl)}" data-title="${escapeAttr(post.author)}" data-description="${escapeAttr(post.text)}">
      ${preview}
      <span class="play-mark">▶</span>
    </a>`;
  }
  return `<a href="${escapeAttr(post.mediaUrl)}" class="glightbox feed-media" data-gallery="city-wall" data-type="image" data-glightbox="title: ${escapeAttr(post.author)}; description: ${escapeAttr(post.text)}">
    <img src="${escapeAttr(post.mediaUrl)}" alt="RP feed kep" />
  </a>`;
};

const ensureVideoModal=()=>{
  let modal=document.getElementById('videoModal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='videoModal';
  modal.className='video-modal';
  modal.hidden=true;
  modal.innerHTML=`
    <div class="video-modal-backdrop" data-close-video></div>
    <section class="video-modal-panel" role="dialog" aria-modal="true" aria-label="Video lejatszo">
      <button class="video-modal-close" data-close-video type="button" aria-label="Bezaras">×</button>
      <div class="video-modal-player" id="videoModalPlayer"></div>
      <div class="video-modal-info">
        <b id="videoModalTitle">Alpar RP video</b>
        <span id="videoModalDescription">Varosi poszt video</span>
      </div>
    </section>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click',event=>{
    if(event.target.matches('[data-close-video]')) closeVideoModal();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && !modal.hidden) closeVideoModal();
  });
  return modal;
};

const openVideoModal=(url,title,description)=>{
  const modal=ensureVideoModal();
  const player=modal.querySelector('#videoModalPlayer');
  const embed=videoEmbed(url);
  modal.querySelector('#videoModalTitle').textContent=title || 'Alpar RP video';
  modal.querySelector('#videoModalDescription').textContent=description || 'Varosi poszt video';
  if(embed.type==='unsupported'){
    player.innerHTML=`
      <div class="video-unsupported">
        <strong>Ez a link nem beágyazható</strong>
        <p>Használj YouTube, Vimeo, vagy közvetlen .mp4/.webm/.ogg videólinket. FiveManage/app oldalak általában blokkolják az iframe-es lejátszást.</p>
        <a href="${escapeAttr(embed.src)}" target="_blank" rel="noopener">Megnyitás új lapon</a>
      </div>
    `;
  }else{
    player.innerHTML=embed.type==='video'
      ? `<video src="${escapeAttr(embed.src)}" controls autoplay playsinline></video>`
      : `<iframe src="${escapeAttr(embed.src)}" title="${escapeAttr(title || 'Alpar RP video')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  modal.hidden=false;
  document.body.classList.add('video-modal-open');
};

const closeVideoModal=()=>{
  const modal=document.getElementById('videoModal');
  if(!modal) return;
  const player=modal.querySelector('#videoModalPlayer');
  if(player) player.innerHTML='';
  modal.hidden=true;
  document.body.classList.remove('video-modal-open');
};

const bindVideoLightboxActions=()=>{
  document.querySelectorAll('.video-popup').forEach(link=>{
    link.addEventListener('click',event=>{
      event.preventDefault();
      openVideoModal(link.dataset.video || link.href,link.dataset.title,link.dataset.description);
    });
  });
};

let mediaLightbox;
const refreshMediaLightbox=()=>{
  if(!window.GLightbox) return;
  if(mediaLightbox) mediaLightbox.destroy();
  mediaLightbox=GLightbox({
    selector:'.glightbox',
    touchNavigation:true,
    loop:true,
    autoplayVideos:true,
    openEffect:'zoom',
    closeEffect:'fade',
    slideEffect:'slide'
  });
};

const bindFeedActions=()=>{
  document.querySelectorAll('.feed-post').forEach(card=>{
    const post=feedPosts.find(item=>item.id===card.dataset.id);
    if(!post) return;
    card.querySelector('[data-action="like"]').addEventListener('click',()=>{
      post.liked=!post.liked;
      post.likes+=post.liked?1:-1;
      renderFeed();
    });
    card.querySelector('[data-action="comment"]').addEventListener('click',()=>{
      const box=card.querySelector('.comment-box');
      box.hidden=!box.hidden;
    });
    card.querySelector('[data-action="share"]').addEventListener('click',async()=>{
      post.shares+=1;
      const shareText=`${post.author}: ${post.text}`;
      try{
        if(navigator.clipboard) await navigator.clipboard.writeText(shareText);
      }catch(error){}
      renderFeed();
    });
    card.querySelector('.comment-form').addEventListener('submit',event=>{
      event.preventDefault();
      const input=event.currentTarget.querySelector('input');
      post.commentList.push({author:'Te',text:input.value.trim()});
      input.value='';
      renderFeed();
    });
  });
};

const renderMedia=()=>{
  const grid=document.getElementById('mediaGrid');
  if(!grid) return;
  grid.innerHTML=mediaImages.map((image,index)=>`
    <article class="media-card">
      <a href="${image}" class="glightbox media-open" data-gallery="alpar-gallery" data-type="image" data-glightbox="title: Hét képe #${index+1}; description: Alpár RP galéria">
        <img src="${image}" alt="Galeria ${index+1}" />
      </a>
      <span>Hét képe #${index+1}</span><b>${randomInt(20,250)} like</b>
    </article>
  `).join('');
  enhanceMediaReveal(grid);
  refreshMediaLightbox();
};

const renderRpData=()=>{
  const character=document.getElementById('characterSheet');
  const whitelist=document.getElementById('whitelistBox');
  const faction=document.getElementById('factionBox');
  if(!character || !whitelist || !faction) return;
  character.innerHTML=`<span class="auth-badge">Karakterlap</span><h3>${escapeHtml(demoCharacter.name)}</h3><p>${escapeHtml(demoCharacter.job)}</p><p>Játékidő: <b>${escapeHtml(demoCharacter.playtime)}</b></p><ul>${demoCharacter.licenses.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  whitelist.innerHTML=`<span class="auth-badge">Whitelist</span><h3>${escapeHtml(demoWhitelist.status)}</h3><div class="progress"><i style="--value:${demoWhitelist.progress}%"></i></div><p>${escapeHtml(demoWhitelist.note)}</p>`;
  faction.innerHTML=`<span class="auth-badge">Frakció</span><h3>${escapeHtml(demoFaction.name)}</h3><p>Rang: <b>${escapeHtml(demoFaction.rank)}</b></p><p>Tagok: <b>${demoFaction.members}</b></p><p>Kassza: <b>${escapeHtml(demoFaction.balance)}</b></p>`;
};

const renderTickets=()=>{
  const list=document.getElementById('ticketList');
  if(!list) return;
  list.innerHTML=tickets.map(ticket=>`
    <article class="ticket-card"><span>${escapeHtml(ticket.category)}</span><h3>${escapeHtml(ticket.title)}</h3><p>${escapeHtml(ticket.last)}</p><b>${escapeHtml(ticket.status)}</b></article>
  `).join('');
};

const renderPhone=()=>{
  const grid=document.getElementById('phoneGrid');
  const detail=document.getElementById('phoneDetail');
  if(!grid || !detail) return;
  grid.innerHTML=phoneApps.map(app=>`<button class="phone-app" data-id="${escapeAttr(app.id)}" type="button"><strong>${escapeHtml(app.icon)}</strong><span>${escapeHtml(app.name)}</span></button>`).join('');
  detail.innerHTML=`<span class="auth-badge">Telefon app</span><h3>${escapeHtml(phoneApps[0].name)}</h3><p>${escapeHtml(phoneApps[0].detail)}</p>`;
  grid.querySelectorAll('.phone-app').forEach(button=>{
    button.addEventListener('click',()=>{
      const app=phoneApps.find(item=>item.id===button.dataset.id);
      detail.innerHTML=`<span class="auth-badge">Telefon app</span><h3>${escapeHtml(app.name)}</h3><p>${escapeHtml(app.detail)}</p>`;
    });
  });
};

const chatCompose=document.getElementById('chatCompose');
if(chatCompose){
  chatCompose.addEventListener('submit',event=>{
    event.preventDefault();
    const input=document.getElementById('chatInput');
    if(!input.value.trim()) return;
    activeConversation.messages.push({from:'me',text:input.value.trim()});
    input.value='';
    renderMessenger();
  });
}

const randomizeFeed=document.getElementById('randomizeFeed');
if(randomizeFeed){
  randomizeFeed.addEventListener('click',()=>{
    feedPosts=createFeedPosts();
    renderFeed();
    renderMedia();
  });
}

const postComposer=document.getElementById('postComposer');
if(postComposer){
  postComposer.addEventListener('submit',event=>{
    event.preventDefault();
    const text=document.getElementById('postText');
    const media=document.getElementById('postMedia');
    const thumbnail=document.getElementById('postThumbnail');
    const type=document.getElementById('postType');
    feedPosts.unshift({
      id:`post-user-${Date.now()}`,
      author:'Alpár játékos',
      text:text.value.trim(),
      mediaUrl:media.value.trim(),
      thumbnailUrl:thumbnail ? thumbnail.value.trim() : '',
      mediaType:detectMediaType(media.value.trim(),type.value),
      likes:0,
      liked:false,
      shares:0,
      comments:0,
      commentList:[],
      time:'most'
    });
    postComposer.reset();
    renderFeed();
  });
}

const ticketForm=document.getElementById('ticketForm');
if(ticketForm){
  ticketForm.addEventListener('submit',event=>{
    event.preventDefault();
    tickets.unshift({
      title:document.getElementById('ticketTitle').value,
      category:document.getElementById('ticketCategory').value,
      status:'Nyitott',
      last:document.getElementById('ticketBody').value
    });
    ticketForm.reset();
    renderTickets();
  });
}

renderMessenger();
renderFeed();
renderMedia();
renderRpData();
renderTickets();
renderPhone();
