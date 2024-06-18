---
title: "Kapsamlı Date Rehberi: Frontend, Backend & DB'de Tarih Yönetimi"
date: "2024-06-18"
categories:
  - "turkce"
  - "web"
  - "javascript"
  - "typescript"
---

Bu makalede gerek frontend'de gerek backend'de tarihler (`Date`) nasıl yönetilmeli biraz ondan bahsedeceğim. Normalde çok temel konular ama sektörde çok yanlış kullanımlar görmek mümkün, o yüzden örnek bir senaryo ile başlayıp, her adımda doğru [convention](https://en.wikipedia.org/wiki/Coding_conventions)'ları göstermeye çalışacağım. Kapsamlı bir rehber görevi göreceğini umuyorum.

Örnek senaryomuz için bir hatırlatma uygulaması düşünelim. Çok basit bir hatırlatmalar tablomuz olsun ve her hatırlatmanın içeriğini ve ne zaman tetikleneceği bilgisini tutalım.

[Frontend](#frontend-katmani) -> [Backend](#backend-katmani) -> [DB](#db-katmani) sıralamasında sondan başa doğru gideceğim ama istediğinize atlayabilirsiniz. En son bazı bonuslar da var DB optimizasyonları gibi.

## DB katmanı

Database tarafında MySQL üzerinden gideceğim en popüler DBMS'lerden biri malum. MySQL'de tarih/zaman saklamak için [5 farklı](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-type-syntax.html) kolon tipi bulunuyor:
- DATE
- DATETIME
- TIMESTAMP
- TIME
- YEAR

Örnek uygulamamızda tutulan hatırlatmaların tetiklenme tarihlerini `DATETIME` ile saklayabiliriz. Oluşturulma tarihlerini ise `TIMESTAMP` ile saklayacağız.. Peki aradaki fark ne tam olarak?

- `TIMESTAMP`'de değerler arka planda UTC olarak tutulur, fakat MySQL değerin çıktısını gösterirken sorgunun yapıldığı bağlantının `time_zone`'una göre dönüşüm yapar. Örneğin `time_zone` eğer `'Europe/Istanbul'` olarak ayarlıysa kolonda tutulan değere +3 saat ekleyerek gösterir.

- `DATETIME`'da ise değerler aynen saklandığı gibi gösterilir ve DBMS tarafından herhangi bir dönüşüm yapılmaz. Bu sorumluluk DB'yi kullanan uygulamaya bırakılmıştır.
 
Genele baktığımız zaman TIMESTAMP bir kayıtın tabloda INSERT ya da UPDATE edildiği zamanları tutmak için kullanılır, örn: `created_at` ya da `updated_at` gibi.

DATETIME'ı ise spesifik tarihleri tutmak için kullanırız. Hem ekstradan bir sürü Date manipülasyon fonksiyonu destekler, hem de 4 byte yerine 8 byte olarak saklanır. (bkz. [Year 2038 problem](https://en.wikipedia.org/wiki/Year_2038_problem))

Tablomuzu şu şekilde oluşturalım:

```sql
CREATE TABLE hatirlatmalar (
    id INT PRIMARY KEY AUTO_INCREMENT,
    icerik TEXT,
    tetiklenme_tarihi DATETIME,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Bir kayıt ekleyeceğiz, fakat dikkat etmemiz gereken şey `tetiklenme_tarihi` kolonunun UTC tarih alması, bu yüzden istediğimiz tarihten 3 saat eksik INSERT yapmamız gerekiyor. (Bunu gerçek kodda yapmamız gerekmeyecek çünkü frontend tarafında `new Date().toISOString()` zaten UTC dönecek UTC+3 değil.)

```sql
INSERT INTO hatirlatmalar (icerik, tetiklenme_tarihi) 
VALUES ('Doktor randevusu', '2024-06-19 06:00:00'); -- aslında saat 9'u temsil ediyor
```

Bu kayıtı `SELECT` yaptığımız zaman aldığımız sonuç (`time_zone = 'SYSTEM'` olarak ayarlı):

```
+----+------------------+---------------------+---------------------+
| id | icerik           | tetiklenme_tarihi   | olusturulma_tarihi  |
+----+------------------+---------------------+---------------------+
|  1 | Doktor randevusu | 2024-06-19 06:00:00 | 2024-06-18 18:53:36 |
+----+------------------+---------------------+---------------------+
```

Fakat `time_zone = 'Europe/Istanbul'` olarak ayarladığımızda:

```
+----+------------------+---------------------+---------------------+
| id | icerik           | tetiklenme_tarihi   | olusturulma_tarihi  |
+----+------------------+---------------------+---------------------+
|  1 | Doktor randevusu | 2024-06-19 06:00:00 | 2024-06-18 21:53:36 |
+----+------------------+---------------------+---------------------+
```

Görüldüğü üzere `tetiklenme_tarihi` kolonu `DATETIME` olduğu için üzerinde herhangi bir dönüşüm yapılmadı, fakat `olusturulma_tarihi` kolonu `TIMESTAMP` olduğu için MySQL `time_zone`'u dikkate alarak +3 saat ekleyerek çıktı verdi. Kolonda depolanan değer değişmiyor sadece MySQL'in sorguya verdiği çıktı değişiyor. Bu gerçekten dikkat edilmesi gereken bir konu, frontend tarafına gelince daha rahat anlayacağız.

## Backend katmanı

Bu tarafta genelde dikkat etmemiz gereken konu direkt olarak timezone işlemleri yapmamak. Backend tarafında genelde UTC ile çalışmak daha mantıklıdır. Çünkü uygulamamızı sadece belirli bir coğrafyada çalıştırmayı düşünmüyoruz, dünya genelinde kullanılabilir olmasını istiyoruz. Eğer backend kodumuzda 3 saat eklemeler çıkarmalar yaparsak işi boşuna yokuşa sürmüş oluruz :)

Şimdi [Bun](https://bun.sh/) kullanarak basit bir Node.js uygulaması ayağa kaldırıyorum. Daha sonra `test-select.ts` dosyasını aşağıdaki gibi dolduruyorum:

```typescript
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "db",
});

const [results] = await connection.query(
  "SELECT * FROM hatirlatmalar",
);
console.log(JSON.stringify(results, null, 2));

await connection.end();
```

Kodu `bun run test-select.ts` diyerek çalıştırdığımda:

```json
[
  {
    "id": 1,
    "icerik": "Doktor randevusu",
    "tetiklenme_tarihi": "2024-06-19T03:00:00.000Z",
    "olusturulma_tarihi": "2024-06-18T15:53:36.000Z"
  }
]
```

Bir yanlışlık var sanki. Tarihler kaymış baya.

Bunun sebebi `mysql2` ve `mysql` modüllerinin Date kolonlarını otomatik olarak JavaScript `Date` objesine [çevirmesi](https://github.com/mysqljs/mysql/issues/605#issuecomment-40168396). JS de doğal olarak kendi timezone'una sahip, bu yüzden tarihler kayıyor. Burada yanlışı daha da ilerletmektense direkt kütüphanenin bu davranışını kapatsak daha iyi olur. Bunu yapmak için `dateStrings` argümanını `true` yapmamız yeterli:

```typescript
const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "db",
  dateStrings: true, // bunu ekledik
});
```

Şimdi tekrar çalıştırdığımda:

```json
[
  {
    "id": 1,
    "icerik": "Doktor randevusu",
    "tetiklenme_tarihi": "2024-06-19 06:00:00",
    "olusturulma_tarihi": "2024-06-18 18:53:36"
  }
]
```

Bu sefer sonuç daha doğru gözüküyor. Tetiklenme tarihinin saat 9 olmasını istemiştik, UTC olduğu için 6 döndü. Oluşturma tarihi de 21:53 idi, UTC olduğu için 18:53 çıktısı aldık. Backend'in kullanılan locale'dan hiç haberi olmamış oldu.

Tek eksiğimiz bu tarihlerin [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) olarak frontend'e verilmesi. Onu da JS tarafında yapabiliriz ya da SQL tarafında `DATE_FORMAT` fonksiyonunu kullanarak yapabiliriz:

```sql
SELECT DATE_FORMAT(tetiklenme_tarihi, '%Y-%m-%dT%TZ') AS tetiklenme_tarihi,
       DATE_FORMAT(olusturulma_tarihi, '%Y-%m-%dT%TZ') AS olusturulma_tarihi
FROM hatirlatmalar;
```

## Frontend katmanı

Frontend tarafında aslında yapmamız gereken şey çok basit. DB'den UTC gelen tarihleri backend üzerlerinde bir oynama yapmadan bize gönderdi, tek yapmamız gereken bize backend'den gelen bu ISO formatındaki tarihleri `new Date()`'den geçirmek. Geri kalanını kullanıcının tarayıcısı bulunduğu locale'e göre halledecek.

```typescript
const backendResponse = [
    {
        "tetiklenme_tarihi": "2024-06-19T06:00:00Z",
        "olusturulma_tarihi": "2024-06-18T18:53:36Z"
    }
];
backendResponse.forEach((hatirlatma) => {
    const tetiklenmeTarihi = new Date(hatirlatma.tetiklenme_tarihi);
    const olusturulmaTarihi = new Date(hatirlatma.olusturulma_tarihi);
    console.log(tetiklenmeTarihi.toLocaleString());
    console.log(olusturulmaTarihi.toLocaleString());
});
```

Çıktı:

```
19.06.2024 09:00:00
18.06.2024 21:53:36
```

Görüldüğü üzere ne backend'de ne de DB'de locale ile alakalı hiçbir şey yapmadık ve frontend'de tarihlerimiz doğru gözüküyor. Kullanıcının tarayıcısının locale'ine göre tarihler otomatik olarak dönüştürüldü.

Bu noktada şundan da bahsetmekte fayda var, biz bu tarihleri frontend'e göndermeden önce neden ISO formatına dönüştürdük? Çünkü olduğu gibi MySQL `DATETIME` formatında gönderseydik (örn: `"2024-06-19 06:00:00"`) JS'de bunu `new Date()`'den geçirirken yanlış bir tarih çıktısı alırdık. Tarayıcı bu tarihi kendi locale'ine göre yorumlayacaktı ve zaten UTC+3 olduğunu düşünecekti. Biz tarihi ISO formatına dönüştürerek aslında tarayıcıyı yönlendirmiş olduk. `"2024-06-19T06:00:00Z"` sonundaki `Z` tarihin UTC olduğunu anlatıyor.

---

Aslında makale bu kadardı. Ama buraya kadar okuduysanız birkaç bonus trick daha vereyim:

## "X gün önce" gibi tarih gösterimleri

Genelde bu tarz gösterimler için [moment](https://momentjs.com/) ya da [date-fns](https://date-fns.org/) kütüphaneler kullanılır fakat buna gerek yok. Modern JavaScript'te `Intl.RelativeTimeFormat` gibi bir [nimet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) var, 0 dependency ile halledilecek bir iş. Aşağıdaki örneği bir StackOverflow [cevabından](https://stackoverflow.com/a/72817357) aldım:

```typescript
function timeAgo(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);
  const formatter = new Intl.RelativeTimeFormat("tr");
  const ranges = [
    ["years", 3600 * 24 * 365],
    ["months", 3600 * 24 * 30],
    ["weeks", 3600 * 24 * 7],
    ["days", 3600 * 24],
    ["hours", 3600],
    ["minutes", 60],
    ["seconds", 1],
  ] as const;
  const secondsElapsed = (date.getTime() - Date.now()) / 1000;

  for (const [rangeType, rangeVal] of ranges) {
    if (rangeVal < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / rangeVal;
      return formatter.format(Math.round(delta), rangeType);
    }
  }
}

console.log(timeAgo(new Date("2024-06-19T06:00:00Z")));
```

Çıktı bu makalenin yayınlandığı tarihte `10 saat sonra` olarak dönüyor.

## DB tarafında tarih sorgum çok yavaş?

Diyelim ki tablomuzda 10M kayıt var ve biz tetik süresi 2025 yılında olan kayıtların sayısını istiyoruz. Önlemimizi alıp önce tetiklenme tarihine bir index koyduk:

```sql
CREATE INDEX tetiklenme_tarihi_index ON hatirlatmalar (tetiklenme_tarihi);
```

Sonra şöyle bir sorgu yazdık:

```sql
SELECT COUNT(*)
FROM hatirlatmalar
WHERE YEAR(tetiklenme_tarihi) = 2025;
```

Ama index eklememize rağmen sorgu 1 saniyeden fazla sürüyor. Bunun sebebi `YEAR` fonksiyonunu kullandığımız anda MySQL artık index'i kullanamıyor olması.. Yaygın yapılan bir hata. Bunun yerine sorguyu şu şekilde değiştirmeliyiz:

```sql
SELECT COUNT(*) 
FROM hatirlatmalar 
WHERE tetiklenme_tarihi BETWEEN '2025-01-01' AND '2025-12-31';
```

Bu sorguyu çalıştırdığımız zaman 0.03sn'de bitmesinden index'i kullandığını anlayabiliyoruz.

---

Umarım bu -ortaya karışık- rehber faydalı olabilmiştir. Burada anlattığım convention'lar tabii ki her zaman katı bir şekilde takip edilecek diye bir kaide yok, istisnai durumlar hep olacaktır ama doğru yolunu öğrenmek ve ona göre ölçüp tartmak önemli. Eğer bu konuda web özelinde daha fazla bilgi almak isterseniz [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) ve [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) dokümantasyonlarını inceleyebilirsiniz. 
