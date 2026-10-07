// ==Mod==
// name: Para Yağmuru
// author: GTA67
// version: 1.0
// desc: Her 30 saniyede 200$ verir, toplamı kaydeder
// ==/Mod==
let t = 0, toplam = GTA.load('toplam', 0);
GTA.on('start', () => GTA.toast('Para yağmuru modu aktif'));
GTA.on('tick', (s, dt) => {
  t += dt;
  if (t >= 30) { t = 0; toplam += 200; GTA.addMoney(200); GTA.save('toplam', toplam); GTA.toast('+200$ (toplam ' + toplam + '$)'); }
});
