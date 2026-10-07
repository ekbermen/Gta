// ==Mod==
// name: Para Komutu
// author: GTA67
// version: 1.0
// desc: /bonus yazınca 1000$ verir, /zipla bulunduğun yerin 30 birim ilerisine ışınlar
// ==/Mod==
GTA.command('bonus', () => { GTA.addMoney(1000); GTA.toast('+1000$ bonus'); }, '1000$ ver');
GTA.command('ilerle', (args, s) => {
  const d = Math.min(200, Number(args[0]) || 30);
  GTA.teleport(s.x + Math.sin(s.a) * d, s.z + Math.cos(s.a) * d);
}, 'ileri ışınlan [metre]');
