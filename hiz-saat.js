// ==Mod==
// name: Hız ve Saat
// author: GTA67
// version: 1.0
// desc: Ekranda hız, saat ve para gösterir
// ==/Mod==
GTA.on('tick', s => {
  GTA.hud('hiz', s.inCar ? 'Hız: ' + s.speed + ' km/s' : 'Yaya');
  const h = Math.floor(s.hour), m = Math.floor((s.hour - h) * 60);
  GTA.hud('saat', 'Saat ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
});
