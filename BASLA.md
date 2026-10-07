# v16 değişiklikleri
- DESTEK düğmesi kaldırıldı, yerine MODLAR geldi.
- Oyuna girerken tam ekran + yatay kilit; MENÜ'ye dönünce telefonun önceki yönü (dikey/yatay) geri gelir. Tarayıcı izin vermezse "Telefonu yatay çevir" uyarısı sadece oyunda çıkar.
- ÇEVRİMDIŞI BAŞLA -> DEVAM ET / YENİ DÜNYA (otomatik kayıt).
- MODLAR: her dünyadan önce "Mod ister misiniz?". Rehber: MOD-REHBERI.md, örnekler: mods/ klasörü.

# GTA 67 - Çevrimiçi kurulum

Oyun + çok oyunculu sunucu tek dosyada: `server.js` (npm install gerekmez).

Yerelde dene:  node server.js   ->  http://localhost:3000
(Oyun artık bağlandığı sunucunun /ws adresini kullanır; ayrı relay gerekmez.)

## Render.com (ücretsiz, önerilen)
1. Bu klasörü GitHub'a yükle (yeni repo).
2. render.com -> New -> Web Service -> repoyu seç.
3. Runtime: Node, Build Command: boş, Start Command: node server.js -> Deploy.
4. Verilen https://....onrender.com adresini herkes açar, ÇEVRİMİÇİ OYNA çalışır.
(Ücretsiz planda 15 dk kullanılmazsa uyur, ilk açılış ~30 sn sürer.)

## Çevrimiçi dünya nasıl çalışıyor
- Odadaki ilk oyuncu "host": trafik ve yayaları o simüle eder, diğerleri sunucu üzerinden alır.
  Host çıkarsa / sekmesi arka plana giderse sıradaki oyuncu host olur.
- Araç renkleri/modelleri, yayalar, trafik ışığı, gün saati ve yağmur herkeste aynı.
- Koltuklar sunucuda: sürücü(0), yan(1), sol arka(2), sağ arka(3), otobüs 12 kişi.
  Soldan binersen sürücü/sol, sağdan binersen yan/sağ arka. KOLTUK düğmesi koltuk değiştirir (otomatik sürüş YOK).
- Oyuncular birbirine ateş edebilir (SİLAH + ATEŞ), can gider, ölen WASTED olur.
- Online modda NPC/araç sayısı herkes için sabit (45 yaya, 44 araç).
- Ayarlar (grafik, ses, yağmur, gün hızı, sayılar) artık tarayıcıda kalıcı; oyun bunları kendiliğinden değiştirmez.

Alternatifler: Railway, Fly.io, Koyeb - hepsi `node server.js` ile çalışır.

## v3 duzeltmeleri
- Otobus duraklari artik sadece kaldirimda: baska bir yolun (komsu ada yolu dahil) uzerine dusen yer atlaniyor.
- Online'da araca binerken sunucu 3 sn icinde cevap vermezse oyun seni yerel olarak bindirir (takilmaz).
- Eski sunucu/relay (koltuk sistemi yok) otomatik algilanir, binis aninda yapilir.

## v4 duzeltmeleri
- Lag: OTO PERFORMANS (Ayarlar'da ac/kapat). FPS 38'in altina inerse oyun cozunurlugu, golge ve bloom'u kademeli kisar, FPS duzelince geri acar. Kayitli ayarlarina dokunmaz.
- Sag ustte FPS + ping (ms) gostergesi (yesil <80 ms, sari <150 ms, kirmizi >=150 ms). Kisildiysa yaninda ▼ seviyesi gorunur.
- Araca binince aninda inme: sunucu gec cevap verince oyun artik seni atmiyor, koltugu yeniden kaydediyor. E tusu basili tutulunca bin/in tekrarlamasi ve cift tetiklenme engellendi.

## v5 duzeltmeleri
- Polis yayalari artik oluyor (eskiden polis ARABASI gibi hasar alip hic dusmuyorlardi). 2 tabanca atisinda duser.
- FPS: kasma sebebi cok parcali modellerdi (araba 16-52, yaya ~15 cizim cagrisi, ev 49 bin ucgen). Artik uzaktaki arabalar dusuk poligonlu govdeye gecer, uzak yaya/ev gizlenir, golge sadece yakindakilere duser. OTO PERFORMANS kademeleri 0-5: once mesafe/golge, en son cozunurluk kisilir.
- Evler golge dusurmez, mini harita 4 karede bir cizilir.
- KOLTUK dugmesi artik koltugunu yaziyor (SURUCU / YAN / SOL ARKA / SAG ARKA), sunucu cevap vermezse uyari verir, koltuk bilgisi eksikse de calisir.

## v6 (bu sürüm)
- ÖNEMLİ: Koltuk değiştirme ve herkeste aynı dünya için SUNUCU güncel olmalı. Eski `gta67-relay` sunucusu koltuk sistemini bilmez ("Bu sunucuda koltuk değiştirme yok"). `relay_kod.js` içeriğini Render'da gta67-relay > Environment > CODE değişkenine yapıştırıp Deploy et (ya da `server.js`'i kendi repona koy).
- İlerleme kaydı hem tarayıcıda (localStorage) hem sunucuda tutulur: para, silah, ev, işletme, banka, polis rütbesi, satın alınan arabalar (konum/hasarıyla). Oyuna girince geri yüklenir; çevrimiçiyken sunucu kaydı daha yeniyse o kullanılır.
- Yaralanınca (can <= %35) AMBULANS ÇAĞIR düğmesi çıkar; ölünce ambulans kendiliğinden gelir, seni hastaneye götürür (tedavi ücreti en fazla $150, hastane içinde yatakta can yenilenir).
- Polis ol: Karakol > "Polis ol / mesaiyi bitir" (üniforma, arama seviyen artmaz), "Devriye görevi" (8 şüpheli yakala, +bonus), "Devriye aracı al".
- Evler: içeride insan yok, yataklar var (yatağa uzan = uyu + can). "2 katlı ev" gerçekten 2 katlı: merdivenle üst kata çıkılır, üstte yatak odaları var. Online'da üst kattaki oyuncu diğerlerine doğru yükseklikte görünür.
- Her mekan türünün içi ve çatısı/dışı farklı (hastane yatakları, banka kasası, sinema koltukları, bowling hattı, kütüphane rafları...).
- FPS: piksel yükü ve bloom/gölge maliyeti azaltıldı, mekan dış cepheleri her karede matris hesaplamaz.

## v7 (bu sürüm)
- DÜKKAN SOYGUNU: Market, lokanta, giyim, kafe, eczane ve silahçıya gir. Kasiyere yaklaş (8 m içinde, yüzün ona dönük), silahını seç ve ATEŞ'e bas. Kasiyer elleri kaldırır, ekranda SOYGUN çubuğu dolar (tabanca 5 sn, SMG 3.6 sn, pompalı 4.2 sn, bazuka 2.8 sn). Dolunca kasa açılır ve para sende. Kasiyerden 10 m uzaklaşırsan soygun yarıda kalır.
- Aynı dükkan 4 dakika boyunca tekrar soyulamaz.
- TANIK = POLİS: dükkânın içindeki müşteri (%85 arar), dışarıda kapıya 22 m içindeki yayalar (kişi başı artan ihtimal), yakındaki polis memuru, ve bazen kasiyerin sessiz alarmı polisi çağırır. Çağrı olunca 2-3 yıldız gelir. İçerideysen polis dışarıda bekler, çıkınca kapıda karşılar. Tanık yoksa arama seviyen artmaz.
- GLB silahlar: GunPack Vol.1 OBJ'leri GLB'ye çevrildi (models/uzi.glb, rifle.glb, rpg.glb, ak47.glb). SMG = Uzi, Pompalı = av tüfeği, Bazuka = RPG modeli olarak elde görünür. AK-47 silahçı duvarında asılı.
- Kenney City Kit Commercial (CC0): dükkân girişlerine tente, kafe/lokanta önüne şemsiye.
- Modeller js/weapons7.js içinde base64 gömülü (ayrıca models/ klasöründe .glb dosyaları durur).

## v8 (bu sürüm)
- ARKADAŞLAR (ilk menüde): kullanıcı adı yaz → EKLE. Karşı taraf KABUL edince arkadaş olursunuz. Listede çevrimiçi/çevrimdışı, hangi odada olduğu görünür; odadaysa KATIL ile direkt girersin (şifreli odada şifre sorar). Kullanıcı adı ilk kullanan cihaza bağlanır.
- MAP ID: ODA OLUŞTUR 7 haneli yeni bir Map ID üretir (= oda kodu). "MAP ID İLE KATIL" ile girilir. Harita, trafik, yayalar, gün saati ve hava bu Map ID'den türer; sunucu her zaman host'un Map ID'sini yollar, farklı gelirse oyun dünyayı otomatik host'unkiyle yeniden kurar.
- SOHBET düğmesi (veya T tuşu): YAZILI SOHBET / SESLİ SOHBET. Sesli sohbette mikrofon açılır, odadaki herkes birbirini duyar (konuşan kişinin adı ekranda çıkar). Üstteki yeşil düğme (veya V) mikrofonu sustur/aç. Mikrofon için https gerekir (Render zaten https).
- DİREKSİYON: yeni görünüm, serbest bırakınca kendiliğinden ortalanır, ard arda 4 tura kadar döner (1,2 tur = tam kilit).
- DRIFT: gaz/fren + tam direksiyon + hızda araç kayar, arkada lastik izi ve duman kalır (izler ~30 sn sonra silinir).
- FPS: OTO PERFORMANS 9 kademe, FPS 34'ün altına inince hemen kısar (22 altında 2 kademe birden). Arabaların detaylı modeli 30 m içinde görünür, uzakta hafif gövde.

## Render'da güncelleme (ÖNEMLİ)
- Oyunu + sunucuyu birlikte sunan servis: repo'yu güncelle, Render otomatik deploy eder (Start: node server.js).
- Ayrı `gta67-relay` servisi kullanıyorsan: `relay_kod.js` içeriğini Environment > CODE değişkenine yapıştır ve Deploy et. Eski relay arkadaşlık, Map ID ve sesli sohbeti bilmez.
- Arkadaş listesi sunucuda friends.json dosyasında tutulur. Render ücretsiz planda disk kalıcı değildir, yeniden başlayınca liste sıfırlanabilir (kalıcı disk eklersen sorun olmaz).

## v9
- ÇEVRİMİÇİ akışı: Çevrimiçi başla → hesap (giriş yapılmışsa atlanır, oturum cihazda hatırlanır) → ODA OLUŞTUR (oda adı, şifre [boş olabilir], NPC en çok 250, araç en çok 275, OLUŞTUR) veya ODA GİR (7 haneli kod [+ şifre varsa], GİR).
- NPC/araç sayısı odayı kuran oyuncunun seçtiği değer olur ve odadaki herkeste aynıdır. (Sunucu güncellemesi şart: server.js / relay_kod.js yeniden deploy edilmeli. Eski sunucuda sayılar 45/44 kalır.)
- Sunucu: dünya paketi sınırı 16 KB → 64 KB, araç listesi 700 → 2400 sayı (275 araç + 250 yaya için).
- DİREKSİYON: tam kilit 1,2 turdan ~190°'ye indi ve küçük açılarda hassas eğri eklendi. Küçük çevirme artık net tepki verir, tam kilit değişmedi. Araç dönüş hızı biraz arttı, yüksek hızda kararlılık aynı.
- FPS: yumuşak gölge filtresi daha ucuz türe çevrildi, gölge haritası 3 karede bir yenilenir. Hiçbir nesne/ayar kaldırılmadı.

## v11
- Oyun hangi adreste açılırsa açılsın (Render, Netlify, GitHub Pages, başka bir site) çevrimiçi bağlantı otomatik olarak wss://gta67-relay.onrender.com/ws sunucusuna gider. Sadece localhost / yerel ağda kendi server.js'ine bağlanır.

## v12 (v9.js)
- PİKSELLEME: çözünürlük tabanı konuldu (artık çok düşmez). FPS düşünce önce uzak binaları gizler, gölge/bloom'u azaltır; çözünürlük en son ve en fazla %20 kısılır.
- Uzak statik nesneler (bina, direk...) mesafeye göre gizlenir (çizim sayısı azalır), sis uzakta pop-in'i saklar.
- ARABA MODELİ: 100 m içinde detaylı GLB yüklenir, çıkınca silinir (hafif araba kalır). FPS düşünce yarıçap küçülür.
- TRAFİK: arabalar öndeki araç/yaya/oyuncuya göre yavaşlar-durur, sıkışırsa U dönüşü yapar, oyuncuya korna çalar. Yayalar hızlı gelen arabadan kaçar.
- TAKSİ: haritadan yer seç → taksi rotayı kendisi sürer (rota haritada ve yolda görünür), varınca ücret kesilir, para yetmezse bakiye eksiye düşer.
- SELFIE: Kamera uygulaması karakterin telefonu eline almasını sağlar; çevir düğmesi ön/arka kamera, beyaz daire fotoğraf çeker (eski fotoğraf kaydı çalışmıyordu, düzeltildi).

## v13 (bu güncelleme)
- 3. şahıs yukarı bakma: ekranı parmakla DİKEY sürükle (araçta bırakınca kamera kendiliğinden döner).
- Telefon: Google (Vikipedi destekli arama + gerçek Google'ı aç), Yılan, Görevler, Rehber, Hesap Mak., Notlar, Hava, Banka, Saat.
- Mekanlar: küçük (18 m) / orta / büyük (52 m) boyutlar, desenli zemin, lambri, tavan ışıkları, pencereler, tabela, türüne göre ekipman.
- Anna, Charlie, Mark, Job: haritada ünlem işaretli karakterler; zorlu görevler (WhatsApp ve telefon > Görevler'den takip).
- FPS: sürekli çözünürlük ayarı (son çare), telefon/dükkan açıkken 3 karede 1 çizim, uzak yayalar gizlenir.
- Sunucu değişmedi (Render'da çalışan v12 sunucusu aynen kullanılır).

## v14 (bu güncelleme)
- Üst mesaj alanı: tüm bilgi mesajları ve sohbet satırları ekranın ORTASI yerine üstte (kısa süre kalıp kayboluyor).
- Helikopter + uçak: havalimanı haritada Dağ adasının batısında (telefon > Uçuş > GPS'e koy). Gaz = hız, ▲ YÜKSEL / ▼ ALÇAL (PC: Boşluk / Shift). Yere inmeden araçtan inilmez; binalara çarpılınca hasar var.
- Otobüs: durağa yaklaş, ARAÇ tuşu, hedef durağı seç; otobüs gelir, otomatik biner, hedefte inersin (bilet ücreti mesafeye göre).

## v15 (son guncelleme)
- **Galeri / dukkan menusu:** liste uzun olunca CIK dugmesi ekran disinda kaliyordu. Tum menuler artik kaydirilabiliyor, CIK dugmesi sag ustte sabit.
- **/spawn:** `heli`, `plane` zaten vardi; artik `helicopter`, `helikopter`, `ucak`, `uçak`, `motor`, `polis`, `otobus`, `kamyon`, `giulia` gibi adlar da calisiyor. Komut kutusuna (CMD) tek dokunusla arac cikaran dugmeler eklendi (Helikopter, Ucak, Alfa, Mito, Spor, Moskvich, Bajaj, Otobus...).
- **Trafik tabelalari:** kavsaklarda hash kaydirmasi negatif cikinca tabela uretimi ilk bozuk kavsakta duruyordu (sessizce). Duzeltildi.
- **FPS:** mobilde MSAA kapali + anisotropi 1; koni/silindir (ev catilari, antenler) ve daglar parcalara birlestirildi (~500 cizim nesnesi az); bina birlestirmesi 360 m'lik bolgelere ayrildi (kamera disindaki sehir cizilmiyor, golge gecisi de azaliyor); GLB arabalar/ev PBR yerine Lambert kullaniyor (piksel basina cok daha ucuz).
- **Online gecikme:** konum 20 Hz (50 ms), host dunya durumu ~15 Hz, sunucu yayini 50 ms (`TICK_MS`), uzak oyuncu/arac/yayada hiz tahminiyle ileri tahmin + daha sik yumusatma; sikisan baglantida eski paketler atiliyor (bufferedAmount).
  **Sunucuyu (server.js / relay_kod.js) yeniden deploy et**, yoksa yayin 100 ms kalir (istemci tarafi yine de calisir).
