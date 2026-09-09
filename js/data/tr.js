// Turkish sentence pack.
// text  : sentence in Turkish
// en    : English translation
// level : 1 = easy, 2 = normal, 3 = hard   tag : theme
const TR_SENTENCES = [
  // ---- daily -----------------------------------------------------------
  { text: 'Günaydın, nasılsın?', en: 'Good morning, how are you?', level: 1, tag: 'daily' },
  { text: 'Bugün hava çok güzel.', en: 'The weather is lovely today.', level: 1, tag: 'daily' },
  { text: 'Kedileri çok seviyorum.', en: 'I really like cats.', level: 1, tag: 'daily' },
  { text: 'Yarın görüşürüz.', en: 'See you tomorrow.', level: 1, tag: 'daily' },
  { text: 'Anahtarlarım nerede?', en: 'Where are my keys?', level: 1, tag: 'daily' },
  { text: 'İyi geceler, tatlı rüyalar.', en: 'Good night, sweet dreams.', level: 1, tag: 'daily' },
  { text: 'Çok teşekkür ederim.', en: 'Thank you very much.', level: 1, tag: 'daily' },
  { text: 'Genelde yedide kalkıp işe gitmeden önce kahve yaparım.', en: 'I usually get up at seven and make coffee before work.', level: 2, tag: 'daily' },
  { text: 'Evimin yanındaki park ilkbaharda çok güzel oluyor.', en: 'The park next to my house is beautiful in spring.', level: 2, tag: 'daily' },
  { text: 'Odadan çıkarken lütfen ışıkları söndür.', en: 'Please turn off the lights when you leave the room.', level: 2, tag: 'daily' },
  { text: 'Komşum geçen hafta taşındı, ben de ona kurabiye götürdüm.', en: 'My neighbour moved in last week, so I took them some cookies.', level: 2, tag: 'daily' },
  { text: 'Her pazar öğleden sonra evi toplamaya çalışıyorum.', en: 'I try to tidy the house every Sunday afternoon.', level: 2, tag: 'daily' },
  { text: 'Her gün tekrarlanan küçük alışkanlıklar zamanla büyük değişimlere dönüşür.', en: 'Small habits repeated every day eventually turn into big changes.', level: 3, tag: 'daily' },
  { text: 'Uyuyamadığım gecelerde bir bardak ılık süt beni rahatlatıyor.', en: 'On nights when I cannot sleep, a glass of warm milk helps me relax.', level: 3, tag: 'daily' },
  { text: 'Ailemle vakit geçirmek benim için her şeyden daha değerli.', en: 'Spending time with my family matters more to me than anything else.', level: 3, tag: 'daily' },
  { text: 'Unutmadan yarınki alışveriş listesini bir kâğıda yazmalıyım.', en: 'Before I forget, I should write tomorrow\'s shopping list on a piece of paper.', level: 3, tag: 'daily' },
  { text: 'Telefonu karıştırmak yerine dışarı çıkıp kısa bir yürüyüş yaptım.', en: 'Instead of scrolling on my phone, I went outside for a short walk.', level: 3, tag: 'daily' },

  // ---- travel ----------------------------------------------------------
  { text: 'İstasyon nerede?', en: 'Where is the station?', level: 1, tag: 'travel' },
  { text: 'İki bilet, lütfen.', en: 'Two tickets, please.', level: 1, tag: 'travel' },
  { text: 'Burada fotoğraf çekebilir miyim?', en: 'Can I take a photo here?', level: 1, tag: 'travel' },
  { text: 'Bir sonraki durakta ineceğim.', en: 'I am getting off at the next stop.', level: 1, tag: 'travel' },
  { text: 'Bir gecelik oda ne kadar?', en: 'How much is a room for one night?', level: 1, tag: 'travel' },
  { text: 'Araba kiralayıp üç gün boyunca sahil yolunda ilerledik.', en: 'We rented a car and drove along the coast road for three days.', level: 2, tag: 'travel' },
  { text: 'Havalimanındaki aktarma neredeyse üç saat sürdü.', en: 'The transfer at the airport took almost three hours.', level: 2, tag: 'travel' },
  { text: 'Son treni kaçırmamak için lokantadan erken ayrıldım.', en: 'I left the restaurant early so I would not miss the last train.', level: 2, tag: 'travel' },
  { text: 'Kapadokya semalarında gün doğumunda balon izlemek muhteşemdi.', en: 'Watching the balloons at sunrise over Cappadocia was magnificent.', level: 2, tag: 'travel' },
  { text: 'Eski şehrin yakınında ucuz bir otel var mı?', en: 'Is there a cheap hotel near the old town?', level: 2, tag: 'travel' },
  { text: 'Fazla plan yapılmadan çıkılan yolculuklar çoğu zaman en beklenmedik keşiflere götürür.', en: 'Trips taken without much planning often lead to the most unexpected discoveries.', level: 3, tag: 'travel' },
  { text: 'İlk yurt dışı yolculuğumda tanıştığım insanlarla hâlâ haberleşiyorum.', en: 'I still keep in touch with the people I met on my first trip abroad.', level: 3, tag: 'travel' },
  { text: 'Yurt dışına çıkmadan önce para bozdurmayı ve sigorta yaptırmayı unutmayın.', en: 'Before going abroad, remember to exchange money and arrange insurance.', level: 3, tag: 'travel' },
  { text: 'Yerel halka en sevdikleri lokantayı sormak her yolculuğun en güzel yanıdır.', en: 'Asking locals for their favourite restaurant is the best part of any journey.', level: 3, tag: 'travel' },
  { text: 'Dili mükemmel bilmeseniz bile anlaşma isteği bir yolculuğu ayakta tutar.', en: 'Even without perfect language skills, the will to communicate keeps a journey going.', level: 3, tag: 'travel' },

  // ---- food ------------------------------------------------------------
  { text: 'Bir kahve, lütfen.', en: 'One coffee, please.', level: 1, tag: 'food' },
  { text: 'Bu tatlı biraz fazla şekerli.', en: 'This dessert is a little too sweet.', level: 1, tag: 'food' },
  { text: 'Bu yemeğin adı ne?', en: 'What is this dish called?', level: 1, tag: 'food' },
  { text: 'Akşama mercimek çorbası var.', en: 'There is lentil soup for dinner.', level: 1, tag: 'food' },
  { text: 'Bir bardak su daha alabilir miyim?', en: 'Could I have another glass of water?', level: 1, tag: 'food' },
  { text: 'İstasyonun yanındaki fırının simitleri çok meşhur.', en: 'The simit from the bakery next to the station is famous.', level: 2, tag: 'food' },
  { text: 'İlk kez kendi ellerimle mantı yapmayı denedim.', en: 'I tried making mantı by hand for the first time.', level: 2, tag: 'food' },
  { text: 'Sıcak bir yaz gününde en iyisi buz gibi bir ayrandır.', en: 'On a hot summer day, an ice-cold ayran is the best thing there is.', level: 2, tag: 'food' },
  { text: 'Bana ızgara balık ile bir tabak pilav yeter.', en: 'Grilled fish and a plate of rice are enough for me.', level: 2, tag: 'food' },
  { text: 'Soğuk bir akşamda sıcak bir çorba insanı ısıtıyor.', en: 'A hot soup warms you up on a cold evening.', level: 2, tag: 'food' },
  { text: 'Mevsiminde sebze kullanmak en sade yemeği bile lezzetli hâle getirir.', en: 'Using seasonal vegetables makes even the simplest dish taste good.', level: 3, tag: 'food' },
  { text: 'Yeni pişmiş ekmeğin kokusu beni doğrudan fırının içine çekti.', en: 'The smell of freshly baked bread pulled me straight into the bakery.', level: 3, tag: 'food' },
  { text: 'Kışın ailece sofra başında toplanmak yılın en güzel anlarından biri.', en: 'Gathering around the table with family in winter is one of the best moments of the year.', level: 3, tag: 'food' },
  { text: 'Her gün en az bir öğünde sebze ağırlıklı bir yemek pişirmeye çalışıyorum.', en: 'I try to cook a vegetable-heavy dish for at least one meal every day.', level: 3, tag: 'food' },
  { text: 'Tabağında yemek bırakmamak, o yemeği pişiren kişiye teşekkür etmenin bir yoludur.', en: 'Not leaving food on your plate is a way of thanking the person who cooked it.', level: 3, tag: 'food' },

  // ---- work: everyday office phrases and business email language --------
  { text: 'Kolay gelsin.', en: 'May it come easy (a greeting to someone at work).', level: 1, tag: 'work' },
  { text: 'Emeğinize sağlık.', en: 'Thank you for your hard work.', level: 1, tag: 'work' },
  { text: 'Günaydın, hafta sonunuz nasıl geçti?', en: 'Good morning, how was your weekend?', level: 1, tag: 'work' },
  { text: 'Anlaşıldı, hemen ilgileniyorum.', en: 'Understood, I am on it right away.', level: 1, tag: 'work' },
  { text: 'Bir saniye lütfen, hatta kalın.', en: 'One moment please, stay on the line.', level: 1, tag: 'work' },
  { text: 'Kontrol edip size döneceğim.', en: 'I will check and get back to you.', level: 1, tag: 'work' },
  { text: 'Şu an masamda değilim.', en: 'I am away from my desk right now.', level: 1, tag: 'work' },
  { text: 'Ben çıkıyorum, iyi akşamlar.', en: 'I am heading out, have a good evening.', level: 1, tag: 'work' },
  { text: 'Toplantı saat onda başlıyor.', en: 'The meeting starts at ten.', level: 1, tag: 'work' },
  { text: 'Dosyayı bana gönderir misiniz?', en: 'Could you send me the file?', level: 1, tag: 'work' },
  { text: 'Bugün bize zaman ayırdığınız için teşekkür ederiz.', en: 'Thank you for taking the time to meet with us today.', level: 2, tag: 'work' },
  { text: 'İlgili belgeyi ekte bulabilirsiniz.', en: 'Please find the relevant document attached.', level: 2, tag: 'work' },
  { text: 'Dönüşünüzü bekliyor olacağım.', en: 'I look forward to your reply.', level: 2, tag: 'work' },
  { text: 'Mümkünse yarına kadar dönüş yapabilir misiniz?', en: 'Could you reply by tomorrow if possible?', level: 2, tag: 'work' },
  { text: 'İlgili kişiye danışıp size en kısa sürede döneceğim.', en: 'I will consult the person in charge and get back to you as soon as I can.', level: 2, tag: 'work' },
  { text: 'Zahmet verdiğim için kusura bakmayın, şimdiden teşekkürler.', en: 'Sorry for the trouble, and thank you in advance.', level: 2, tag: 'work' },
  { text: 'Toplantı odasını benim için ayırtabilir misiniz?', en: 'Could you book the meeting room for me?', level: 2, tag: 'work' },
  { text: 'Bugün evden çalışıyorum, bana sohbetten yazabilirsiniz.', en: 'I am working from home today, so you can message me on chat.', level: 2, tag: 'work' },
  { text: 'Rahatsızlandığım için bugün izin kullanacağım.', en: 'I am not feeling well, so I will take the day off.', level: 2, tag: 'work' },
  { text: 'Bugünkü toplantının notlarını aşağıda paylaşıyorum.', en: 'I am sharing the notes from today\'s meeting below.', level: 2, tag: 'work' },
  { text: 'Yarın sabah ofiste olmayacağım.', en: 'I will not be in the office tomorrow morning.', level: 2, tag: 'work' },
  { text: 'Şimdilik kısa bir bilgilendirme yapmak istedim.', en: 'Just a quick update for now.', level: 2, tag: 'work' },
  { text: 'Rahatsız ettiğim için özür dilerim, fırsat bulduğunuzda bir bakabilir misiniz?', en: 'I apologise for the interruption, could you take a look when you get a chance?', level: 3, tag: 'work' },
  { text: 'Teslim takvimini konuşmak için uygun bir zaman ayarlayabilir miyiz?', en: 'Could we set a time to discuss the delivery schedule?', level: 3, tag: 'work' },
  { text: 'Belirttiğiniz noktaları düzelttim ve güncel sürümü ekte gönderiyorum.', en: 'I have corrected the points you raised and am sending the updated version attached.', level: 3, tag: 'work' },
  { text: 'Önceki e-postamda bir hata vardı, düzeltilmiş hâlini iletiyorum.', en: 'There was an error in my previous email, so I am sending the corrected version.', level: 3, tag: 'work' },
  { text: 'Bugün mümkün değilse yarın sabah da benim için uygun olur.', en: 'If today is not possible, tomorrow morning works for me as well.', level: 3, tag: 'work' },
  { text: 'Yoğun programınıza rağmen katıldığınız için teşekkür ederim.', en: 'Thank you for attending despite your busy schedule.', level: 3, tag: 'work' },
  { text: 'Ek dosya bende açılmadı, tekrar gönderebilir misiniz?', en: 'The attachment did not open on my end, could you resend it?', level: 3, tag: 'work' },
  { text: 'Bugün ayırdığınız zaman için teşekkürler, birlikte çalışmayı dört gözle bekliyorum.', en: 'Thank you for your time today, and I look forward to working together.', level: 3, tag: 'work' },
];

// Curated paragraphs for paragraph mode.
const TR_PARAGRAPHS = [
  { text: 'Bugün pazar. Geç kalktım ve kendime bir fincan kahve yaptım. Öğleden sonra bir arkadaşımla parkta yürüyüşe çıkacağım.', en: 'Today is Sunday. I got up late and made myself a cup of coffee. In the afternoon I will go for a walk in the park with a friend.', level: 1, tag: 'daily' },
  { text: 'Taşındıktan altı ay sonra yeni mahalleye nihayet alıştım. Caddedeki esnaf çok sıcakkanlı, her alışverişe gidişimde biraz sohbet ediyoruz. İnsan yabancı bir yerde bile konuşacak birileri olunca hayatı zengin buluyor.', en: 'Six months after moving, I have finally gotten used to the new neighbourhood. The shopkeepers on the street are warm, and we chat a little every time I go shopping. Even in an unfamiliar place, life feels rich when you have people to talk to.', level: 3, tag: 'daily' },
  { text: 'İzmir gezimizin ikinci günü en güzeliydi. Sabah erkenden antik kente gittiğimiz için ortalık sessiz ve neredeyse bomboştu. Öğle yemeğinde deniz mahsulleri yedik, akşam da sahil boyunca yürüdük.', en: 'The second day of our trip to Izmir was the best. We went to the ancient city early in the morning, so it was quiet and almost empty. We ate seafood for lunch, and in the evening we walked along the shore.', level: 2, tag: 'travel' },
  { text: 'İlk kez tek başıma yurt dışına çıktığımda dil engeli beni defalarca zorladı. Yine de haritayı gösterip yol sorduğumda tanımadığım insanlar bana nazikçe yardım etti. O gün mükemmel bir dil bilgisinden çok anlaşma isteğinin önemli olduğunu öğrendim.', en: 'On my first solo trip abroad, the language barrier tripped me up many times. Even so, whenever I pointed at the map and asked for directions, strangers kindly helped me. That day I learned that the will to communicate matters more than perfect grammar.', level: 3, tag: 'travel' },
  { text: 'Geçen hafta sonu ilk kez sıfırdan mercimek çorbası pişirdim. Soğanı yavaş yavaş kavurmak biraz zaman aldı ama çorbayı tatlı ve yoğun yaptı. Ailem çok sevdi, bu yüzden yeniden pişirmek istiyorum.', en: 'Last weekend I made lentil soup from scratch for the first time. Frying the onions slowly took a while, but it made the soup sweet and rich. My family loved it, so I want to make it again.', level: 2, tag: 'food' },
  { text: 'Ev yemekleri, mevsiminde malzeme kullanmaya dair küçük bilgilerle doludur. Mevsiminde olanı tatmak, ilkbahar yeşilliklerinden kış köklerine kadar yılın değişimini hissettirir. Yoğun günlerde bile sofraya mevsimlik tek bir malzeme eklemek onu biraz daha zengin yapar.', en: 'Home cooking is full of small wisdom about using seasonal ingredients. Tasting what is in season lets you feel the year change, from spring greens to winter roots. Even on busy days, adding one seasonal ingredient makes the table a little richer.', level: 3, tag: 'food' },
  { text: 'Merhaba, ben Demir. Yarınki toplantının belgelerini gönderiyorum. Fırsat bulduğunuzda bir göz atabilir misiniz?', en: 'Hello, this is Demir. I am sending the materials for tomorrow\'s meeting. Could you take a look when you have a moment?', level: 1, tag: 'work' },
  { text: 'İlginiz için teşekkür ederiz, geçen gün toplantıda ayırdığınız zaman için de ayrıca minnettarız. Görüştüğümüz konuya dair hazırladığımız belgeleri ekte iletiyorum. İncelemenizi rica eder, birlikte çalışmayı dört gözle beklediğimizi belirtmek isterim.', en: 'Thank you for your continued interest, and for the time you gave us at the meeting the other day. I am attaching the materials we prepared on the matter we discussed. I would appreciate your review, and I look forward to working together.', level: 3, tag: 'work' },
];

// Warm-up drill items: key rows and short words.
const TR_DRILLS = [
  { text: 'asdf jkl' }, { text: 'qwer uıop' }, { text: 'zxcv bnm' }, { text: 'ğüşiöç' }, { text: 'şğüıöç ÇŞĞÜİÖ' },
  { text: 'Pijamalı hasta yağız şoföre çabucak güvendi.' },
  { text: 'kedi' }, { text: 'köpek' }, { text: 'okul' }, { text: 'arkadaş' }, { text: 'hava durumu' }, { text: 'çalışmak' }, { text: 'müzik' },
  { text: 'yolculuk' }, { text: 'ödev' }, { text: 'bilet' }, { text: 'kütüphane' }, { text: 'gazete' }, { text: 'kahve' }, { text: 'teşekkürler' }, { text: 'merhaba' },
];

// Easter egg, matching the Japanese and Korean packs.
const TR_EGG = { text: 'Yuri bugün de Suiri\'nin yanına eve döndü.', en: 'Yuri came home to Suiri again today.', level: 1, tag: 'egg' };
const TR_EGG_WORK = { text: 'Kolay gelsin. Yuri\'nin bugün de Suiri\'nin yanına eve döndüğünü bilginize sunarım.', en: 'Hello. Just a quick report that Yuri came home to Suiri again today.', level: 1, tag: 'egg' };
