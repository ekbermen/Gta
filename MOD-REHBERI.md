# GTA 67 – Mod Rehberi

Mod = tek bir `.js` dosyası. Oyunda **MODLAR** (ana menü) ya da dünyaya girerken çıkan **"Mod ister misiniz?" → EVET** ekranından eklersin:
- **YENİ MOD YAP**: telefonda/PC'de oyunun içinde yaz, **TEST ET** ile 3 saniye dene (oyuna dokunmaz), **KAYDET**.
- **DOSYA EKLE**: bir `.js` dosyası seç (örnekler `mods/` klasöründe).
- **ÖRNEK EKLE**: 3 hazır mod.
Her modun yanındaki anahtar açar/kapatır, ✎ düzenler, ✕ siler (iki dokunuş).
Çevrimdışı ya da çevrimiçi **her dünyadan önce** sorulur. HAYIR dersen o dünyada hiçbir mod çalışmaz.

## Dosya başlığı (isteğe bağlı)
```js
// ==Mod==
// name: Modun adı
// author: Sen
// version: 1.0
// desc: Kısa açıklama
// online: evet        (çevrimiçide de çalışacağını belirtir, sadece bilgi)
// ==/Mod==
```

## API
| | |
|---|---|
| `GTA.on('start', fn)` | mod başlayınca |
| `GTA.on('tick', (s, dt) => {})` | her 0,2 sn; `s` = durum |
| `GTA.on('stop', fn)` | mod kapanırken |
| `GTA.state` | `{x,z,a,hp,money,wanted,hour,rain,inCar,speed,wep,online}` |
| `GTA.toast(m)` `GTA.say(m)` `GTA.log(...)` | ekran yazısı / komut konsolu / test günlüğü |
| `GTA.hud(id, metin)` `GTA.hudRemove(id)` | ekranda kalıcı etiket (modun başına en fazla 8) |
| `GTA.command('ad', (args, s) => {}, 'yardım')` | `/ad` komutu (CMD ekranında yaz), `/help`'te listelenir |
| `GTA.addMoney(n)` `setMoney(n)` `heal()` `giveWeapon(0-3)` | oyuncu |
| `GTA.spawnCar('alfa')` | car, police-car, bus, truck, alfa, mito, sport, moskvich, clio, volvo, bajaj, berrari, cmw, kercedes, f1, heli, plane |
| `GTA.teleport(x,z)` `setHour(0-24)` `setWeather('rain'/'clear')` `setWanted(0-5)` | dünya |
| `GTA.save(anahtar, değer)` `GTA.load(anahtar, varsayılan)` | modun kalıcı verisi (en fazla 20 KB) |

## Güvenlik ve hata koruması
- Modlar ayrı bir **Web Worker** içinde çalışır: oyunun değişkenlerine, hesabına, tarayıcı verisine, ağa (`fetch`, `WebSocket`...) ve `document`'e **erişemez**. Sadece yukarıdaki API ile konuşur.
- Sonsuz döngü ya da takılma: 4 sn yanıt vermezse mod durdurulur, oyun donmaz.
- 10 sn içinde 6 hata verirse mod otomatik durur ve yöneticide sebebi görünür.
- Saniyede en fazla 80 eylem; tek seferde para sınırı 10 milyon; ışınlanma ±3000; modun en fazla 12 aracı.
- Mod kapanınca/ dünya değişince HUD yazıları ve modun çıkardığı araçlar temizlenir.
- **Çevrimiçi dünyada** dünyayı etkileyen eylemler (para, silah, araç, ışınlanma, saat, hava, arama seviyesi) **kapalıdır**; sadece `toast, say, hud, command, save, log` çalışır. Modlar sadece kendi ekranında çalışır, diğer oyuncular görmez. Böylece herkesin dünyası aynı kalır.
- Yine de tanımadığın kişilerden gelen modu önce **TEST ET** ile dene.

## Çevrimdışı dünyalar
**ÇEVRİMDIŞI BAŞLA** → **DEVAM ET** (son otomatik kayıt: konum, para, silahlar, arabalar, saat) ya da **YENİ DÜNYA** (kaydı siler, onay ister). Oyun 8 sn'de bir kaydeder.
Hesapla girişliysen para/silah/araçlar hesabın ilerlemesinden gelir, dünya kaydı konumu ve saati tutar.

## Örnek
```js
GTA.on('tick', s => { if (s.speed > 150) GTA.toast('Yavaş!'); });
GTA.command('gece', () => GTA.setHour(0), 'saati geceye al');
```
