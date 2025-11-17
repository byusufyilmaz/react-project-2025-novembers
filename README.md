# React Project - 2025

Merhaba, bu projede sizden belirtilen hataların giderilmesi ve yeni özelliklerin uygulamaya eklenmesi beklenmektedir.

## 📦 Kurulum ve Başlatma Adımları

Projeyi çalıştırmak için aşağıdaki adımları takip edin:

```sh
npm install --legacy-peer-deps
npm run dev
```

## 🧭 Proje Özeti

Güncel uygulama; personel profili, vardiya takvimi ve gelişmiş planlama araçlarını tek ekranda toplar. Öne çıkan yetenekler:

- **Akıllı takvim**: Personel bazlı renklendirilmiş vardiyalar, drag & drop ile güncelleme, drag-to-create, çoklu seçim ve tek tıkla toplu kaldırma.
- **Vardiya talepleri**: Modal üzerinden saat değişikliği, talep kaydetme, e-posta ile gönderme ve yönetici onayı için durum takibi.
- **KPI kartları ve öneriler**: Seçili personelin toplam vardiya/saat/gece vardiyası bilgileri ve müsait günlere göre otomatik öneriler.
- **Personel yönetimi**: Dinamik personel ekleme/çıkarma, isim kontrolü, özel vardiyalar ve off-day/pair vurguları.
- **Tema ve tasarım**: Açık/koyu tema desteği, modern kart tasarımları, ikonografik butonlar ve responsive düzen.

## ✅ Uygulanan Adımlar & Ekstra Özellikler

| Başlık | Uygulama Özeti |
| --- | --- |
| ProfileCard Rol Gösterimi | Profil gelmeden localStorage’daki rol/email bilgisi okunup hatasız şekilde gösteriliyor. |
| Calendar Bug & Event Detayı | Eventler seçili personele göre filtreleniyor, renklendiriliyor; modalda tüm bilgiler görüntüleniyor. |
| Pair Günleri | Sadece ilgili tarih aralıkları altı çizili oluyor; pair partnerlerine özgü renkler uygulanıyor. |
| Drag & Drop Güncellemesi | Sürükle-bırak edilen vardiyalar redux state’ine işleniyor, güncellenen eventler highlight alıyor. |
| Tasarım & Tema | Gradient arkaplan, kart tasarımları, ikonlu butonlar ve dark mode eklendi. |
| Özel Vardiya Yönetimi | Form ile özel vardiya yaratma, sürükle-bırak güncelleme, çoklu seçimle toplu silme. |
| Akıllı Öneriler | Boş günlere göre otomatik vardiya önerisi sunuluyor, tek tıkla uygulanabiliyor. |
| KPI Kartları | Toplam vardiya, planlanan saat, gece vardiyası ve güncellenen vardiya sayıları hesaplanıyor. |
| Vardiya Talepleri | Modal içinden saat değişikliği talebi kaydediliyor, onay/ret durumları listeleniyor, mail gönderilebiliyor. |
| Personel Yönetimi | Yeni personel ekleme, isim çakışması uyarısı, özel personeller için silme, mevcut personeli gizleme. |
| Vardiya Silme | Tek event veya seçilen tüm eventler (API/özel) kaldırılabiliyor. |

## 🐞 Hata Düzeltmeleri ve 📌 İstekler

**1. ProfileCard Bileşeni – Rol Gösterimi** (15P)
- Sorun: Kullanıcı profili henüz yüklenmemişken, ProfileCard bileşeninde role alanı gösterilemiyor.

- Beklenen Davranış: Eğer state üzerinden profil datası henüz gelmemişse, localStorage içindeki role bilgisi kullanılmalı ve düzgün şekilde ekranda gösterilmelidir. Uygulama bu durumda hata vermemelidir.

**2. Calendar Bug ve Event Detayı** (25P)
- Sorun: projede CalendarContainer içerisindeki bir takım mantık ve değişkenlerin kullanım hatalarından dolayı eventler calendarda render olamıyor.

- Beklenen Davranış: Bütün eventler yani assignmentlar takvimde görüntülenmeli ve bu görüntüleme seçili staff üzerindem olmalıdır.

- Takvim üzerindeki eventlerin her biri kendine özel bir renk ile highlight edilmelidir. Bu renklendirme shift ve staff bazlı olmalıdır. Ek olarak, takvimdeki bir etkinliğe tıklandığında bir pop-up açılarak, ilgili etkinliğe ait personel adı, vardiya adı, tarih, başlangıç ve bitiş saatleri gibi tüm bilgilerin görüntülenmesi beklenmektedir.

**4. Pair Günlerinin Altını Çizme** (25P)
- Sorun: highlightedPair sınıfı tüm günlere uygulandığı için takvimdeki bütün günlerin altı çizili görünmekte.

- Beklenen Davranış: Her personelin sahip olduğu pair listesi, o personelin başka bir personelle birlikte çalıştığı tarih aralıklarını belirtmektedir. Takvimde, seçili personelin bu tarih aralıklarına denk gelen günleri (pair günleri), highlightedPair sınıfı ile altı çizili olarak gösterilmelidir. Diğer günler normal şekilde görünmelidir.

- Ek olarak beklenen davranış, her pair’in takvimde kendi rengiyle temsil edilmesidir. Yani, takvimde tıklanabilir durumda olan her personel farklı bir renkte gösterilmelidir. Örneğin, Tuba seçili personel ise ve 14. gün Esra ile bir pair oluşturuyorsa, Esra'nın rengi kırmızıysa, ayın 14'ü kırmızı alt çizgiyle vurgulanmalıdır.

**5. Takvimde Sürükle-Bırak ile Event Güncelleme** (25P)
- Beklenen Davranış: Takvimdeki bir etkinlik sürüklenerek günü değiştirildiğinde, bu değişiklik state/redux verisine yansıtılmalıdır yani selector ile redux üzerinden çekilen schedule verisine işlenilmelidir. Bu işlemlerin, ilgili bileşen içinde ve projenin store klasörü altında gerçekleştirilmesi gerekmektedir. (25P)

**6. Tasarım Güncellemeleri** (10P + Ekstra)
- Beklenti: Mevcut bileşenlerin görsel ve yapısal tasarımları elinizdeki verilere uygun şekilde iyileştirilmeli ve modern, kullanıcı dostu bir arayüz haline getirilmelidir.

#
---
#
 
📝 **Öneri**: Kullanıcı deneyimini artıracak şekilde yeniden düzenlemeler yapabilir, component hiyerarşisini sadeleştirebilir ve UI/UX anlamında profesyonel dokunuşlar ekleyebilirsiniz.

**Her geliştirme adımında kodun okunabilirliğine, performansına ve bileşenlerin yeniden kullanılabilirliğine dikkat edilmesi beklenmektedir.Proje ile ilgili sorularınızı info@smart-maple.com adresine iletebilirsiniz.**

✨ Teşekkürler!
